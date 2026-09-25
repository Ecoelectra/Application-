import { useEffect, useMemo, useState } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { looksLikeSmiles, substanceFromCompound, substanceFromSmiles } from '../chem/externalSubstances';
import { autocomplete, findCompound } from '../services/pubchem';
import type { Substance } from '../data/types';

interface Props {
  query: string;
  rdkit: MainModule | null;
  /** Namen der lokalen Treffer, damit PubChem sie nicht doppelt vorschlägt */
  localNames: string[];
  onAdd: (substance: Substance) => void;
}

type Status = 'idle' | 'loading' | 'done' | 'offline';

/**
 * Ergänzt die Suche im Chemikalienschrank um alle Stoffe aus PubChem und um
 * die Eingabe als SMILES – wie die Stoffsuche auf der Startseite.
 */
export function OnlineSubstanceSearch({ query, rdkit, localNames, onAdd }: Props) {
  const term = query.trim();
  const [names, setNames] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setNames([]);
    if (term.length < 2) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await autocomplete(term, 10);
      if (cancelled) return;
      setNames(result);
      setStatus(result.length || navigator.onLine !== false ? 'done' : 'offline');
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  const smiles = useMemo(() => (looksLikeSmiles(rdkit, term) ? substanceFromSmiles(rdkit as MainModule, term) : null), [rdkit, term]);

  const known = new Set(localNames.map((name) => name.toLowerCase()));
  const remote = names.filter((name) => !known.has(name.toLowerCase()));

  const load = async (name: string): Promise<void> => {
    if (!rdkit) {
      setMessage('Das Strukturprogramm lädt noch – bitte einen Moment warten.');
      return;
    }
    setBusy(name);
    setMessage(null);
    const compound = await findCompound(name);
    setBusy(null);
    if (!compound) {
      setMessage(
        navigator.onLine === false
          ? 'Keine Internetverbindung: PubChem ist nicht erreichbar. Offline stehen die Stoffe der App-Datenbank zur Verfügung.'
          : `PubChem kennt «${name}» nicht oder ist gerade nicht erreichbar.`,
      );
      return;
    }
    const result = substanceFromCompound(rdkit, compound, name);
    if (!result.ok) {
      setMessage(result.reason);
      return;
    }
    onAdd(result.substance);
  };

  if (term.length < 2) return null;

  return (
    <div className="online-search">
      {smiles && (
        <div className="online-search-row">
          {smiles.ok ? (
            <>
              <span className="small">
                Struktur erkannt: <strong>{smiles.substance.name}</strong>{' '}
                <span className="mono">{smiles.substance.formula}</span>
              </span>
              <button type="button" className="button button-small" onClick={() => onAdd(smiles.substance)}>
                Ins Gefäß
              </button>
            </>
          ) : (
            <span className="small muted">{smiles.reason}</span>
          )}
        </div>
      )}

      <h3 className="online-search-title">
        Aus PubChem <span className="subtle small">(über 100 Millionen Stoffe, braucht Internet)</span>
      </h3>
      {status === 'loading' && (
        <p className="small muted">
          <span className="spinner" /> Suche in PubChem …
        </p>
      )}
      {status === 'offline' && (
        <p className="small muted">Offline – PubChem ist nicht erreichbar. Die Stoffe der App-Datenbank stehen oben.</p>
      )}
      {status === 'done' && (
        <div className="bottle-grid">
          {remote.map((name) => (
            <button
              key={name}
              type="button"
              className="bottle bottle-online"
              disabled={busy !== null}
              onClick={() => void load(name)}
              title="Aus PubChem laden und ins Gefäß geben"
            >
              <span className="bottle-name">{busy === name ? <span className="spinner" /> : name}</span>
              <span className="bottle-formula">PubChem</span>
            </button>
          ))}
          <button
            type="button"
            className="bottle bottle-online"
            disabled={busy !== null}
            onClick={() => void load(term)}
            title="Name, CAS-Nummer, Summenformel oder SMILES direkt in PubChem suchen"
          >
            <span className="bottle-name">{busy === term ? <span className="spinner" /> : `«${term}» suchen`}</span>
            <span className="bottle-formula">Name, CAS, Formel</span>
          </button>
        </div>
      )}
      {message && <p className="small warning-text">{message}</p>}
    </div>
  );
}
