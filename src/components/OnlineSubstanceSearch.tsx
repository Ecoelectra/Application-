import { useEffect, useMemo, useState } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { consensus, looksLikeSmiles, substanceFromSmiles, type SourceConsensus } from '../chem/externalSubstances';
import { SOURCES, lookupEverywhere, suggestNames, type NameSuggestion, type SourceHit } from '../services/substanceSources';
import type { Substance } from '../data/types';

interface Props {
  query: string;
  rdkit: MainModule | null;
  /** Namen der lokalen Treffer, damit die Online-Quellen sie nicht doppelt vorschlagen */
  localNames: string[];
  onAdd: (substance: Substance) => void;
}

type Status = 'idle' | 'loading' | 'done' | 'offline';

/** Kurzer Bericht, welche Quellen den geladenen Stoff bestätigen */
export function consensusText(outcome: SourceConsensus): string {
  const agree = [...new Set(outcome.agree.map((hit) => SOURCES[hit.source].label))];
  const disagree = [...new Set(outcome.disagree.map((hit) => SOURCES[hit.source].label))].filter((label) => !agree.includes(label));
  const confirmed = agree.length > 1 ? `Dieselbe Struktur in ${agree.join(', ')}.` : `Gefunden in ${agree[0]}.`;
  return disagree.length ? `${confirmed} Abweichende Struktur unter diesem Namen: ${disagree.join(', ')}.` : confirmed;
}

/**
 * Ergänzt die Suche im Chemikalienschrank um Online-Datenbanken (PubChem,
 * Wikidata, ChEMBL, NCI CACTUS, OPSIN) und um die Eingabe als SMILES.
 */
export function OnlineSubstanceSearch({ query, rdkit, localNames, onAdd }: Props) {
  const term = query.trim();
  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setReport(null);
    setSuggestions([]);
    if (term.length < 2) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await suggestNames(term, 12);
      if (cancelled) return;
      setSuggestions(result);
      setStatus(result.length || navigator.onLine !== false ? 'done' : 'offline');
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  const smiles = useMemo(() => (looksLikeSmiles(rdkit, term) ? substanceFromSmiles(rdkit as MainModule, term) : null), [rdkit, term]);

  const known = new Set(localNames.map((name) => name.toLowerCase()));
  const remote = suggestions.filter((entry) => !known.has(entry.label.toLowerCase()));

  /** Alle Quellen befragen und die Struktur nehmen, die die meisten bestätigen */
  const load = async (name: string, known?: SourceHit): Promise<void> => {
    if (!rdkit) {
      setMessage('Das Strukturprogramm lädt noch – bitte einen Moment warten.');
      return;
    }
    setBusy(name);
    setMessage(null);
    setReport(null);
    const { hits } = await lookupEverywhere(name);
    setBusy(null);
    const all = known && !hits.some((hit) => hit.source === known.source && hit.ref === known.ref) ? [known, ...hits] : hits;
    const outcome = all.length ? consensus(rdkit, all, name) : null;
    if (!outcome) {
      setMessage(
        navigator.onLine === false
          ? 'Keine Internetverbindung: Die Online-Datenbanken sind nicht erreichbar. Offline stehen die Stoffe der App-Datenbank zur Verfügung.'
          : `Keine der Datenbanken (PubChem, Wikidata, ChEMBL, NCI, OPSIN) kennt «${name}» – oder sie sind gerade nicht erreichbar.`,
      );
      return;
    }
    if (!outcome.result.ok) {
      setMessage(outcome.result.reason);
      return;
    }
    setReport(`✓ ${outcome.result.substance.name}: ${consensusText(outcome)}`);
    onAdd(outcome.result.substance);
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
        Online-Datenbanken{' '}
        <span className="subtle small">(PubChem, Wikidata, ChEMBL, NCI, OPSIN – braucht Internet)</span>
      </h3>
      {status === 'loading' && (
        <p className="small muted">
          <span className="spinner" /> Suche in den Datenbanken …
        </p>
      )}
      {status === 'offline' && (
        <p className="small muted">Offline – die Online-Datenbanken sind nicht erreichbar. Die Stoffe der App-Datenbank stehen oben.</p>
      )}
      {status === 'done' && (
        <div className="bottle-grid">
          {remote.map((entry) => (
            <button
              key={`${entry.source}:${entry.label}`}
              type="button"
              className="bottle bottle-online"
              disabled={busy !== null}
              onClick={() => void load(entry.label, entry.hit)}
              title={`Aus ${SOURCES[entry.source].label} vorgeschlagen; beim Laden werden alle Datenbanken abgeglichen`}
            >
              <span className="bottle-name">{busy === entry.label ? <span className="spinner" /> : entry.label}</span>
              <span className="bottle-formula">
                {SOURCES[entry.source].label}
                {entry.detail && entry.source === 'wikidata' ? ` · ${entry.detail}` : ''}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="bottle bottle-online"
            disabled={busy !== null}
            onClick={() => void load(term)}
            title="Name, CAS-Nummer, InChIKey, Summenformel oder IUPAC-Name in allen Datenbanken suchen"
          >
            <span className="bottle-name">{busy === term ? <span className="spinner" /> : `«${term}» überall suchen`}</span>
            <span className="bottle-formula">Name, CAS, IUPAC</span>
          </button>
        </div>
      )}
      {report && <p className="small success-text">{report}</p>}
      {message && <p className="small warning-text">{message}</p>}
    </div>
  );
}
