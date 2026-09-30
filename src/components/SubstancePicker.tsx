import { useMemo, useState } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { consensus, looksLikeSmiles, substanceFromSmiles } from '../chem/externalSubstances';
import { searchSubstances } from '../data/substances';
import type { Substance } from '../data/types';
import { lookupEverywhere } from '../services/substanceSources';

interface Props {
  label: string;
  value: Substance | null;
  onChange: (substance: Substance | null) => void;
  rdkit: MainModule | null;
  placeholder?: string;
}

/**
 * Stoffauswahl mit Offline-Datenbank, SMILES-Eingabe und Online-Suche
 * (PubChem, Wikidata, ChEMBL, NCI CACTUS, OPSIN) –
 * dieselben Wege wie auf der Startseite und in der Werkbank.
 */
export function SubstancePicker({ label, value, onChange, rdkit, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const term = query.trim();
  const local = useMemo(() => (term.length >= 1 ? searchSubstances(term, 8) : []), [term]);
  const smiles = useMemo(() => (rdkit && looksLikeSmiles(rdkit, term) ? substanceFromSmiles(rdkit, term) : null), [rdkit, term]);

  const choose = (substance: Substance): void => {
    onChange(substance);
    setQuery('');
    setOpen(false);
    setMessage(null);
  };

  const online = async (): Promise<void> => {
    if (!rdkit || !term) return;
    setBusy(true);
    setMessage(null);
    const { hits } = await lookupEverywhere(term);
    setBusy(false);
    const outcome = hits.length ? consensus(rdkit, hits, term) : null;
    if (!outcome) {
      setMessage('Nicht gefunden – keine der Online-Datenbanken kennt den Namen, oder das Gerät ist offline.');
      return;
    }
    if (outcome.result.ok) choose(outcome.result.substance);
    else setMessage(outcome.result.reason);
  };

  if (value) {
    return (
      <div className="picker">
        <span className="picker-label">{label}</span>
        <div className="picker-chosen">
          <div>
            <strong>{value.name}</strong> <span className="mono subtle small">{value.formula}</span>
          </div>
          <button type="button" className="icon-button small" aria-label={`${value.name} entfernen`} onClick={() => onChange(null)}>
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="picker">
      <label className="picker-label">
        {label}
        <input
          className="input"
          type="search"
          value={query}
          placeholder={placeholder ?? 'Name, Formel, CAS oder SMILES'}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (local[0]) choose(local[0]);
              else if (smiles?.ok) choose(smiles.substance);
              else void online();
            }
          }}
        />
      </label>
      {open && term && (
        <div className="suggestion-list" role="listbox">
          {local.map((substance) => (
            <button key={substance.id} type="button" className="suggestion-item" onClick={() => choose(substance)}>
              <div>{substance.name}</div>
              <div className="meta">
                {substance.formula} · {substance.category}
              </div>
            </button>
          ))}
          {smiles?.ok && (
            <button type="button" className="suggestion-item" onClick={() => choose(smiles.substance)}>
              <div>Struktur: {smiles.substance.name}</div>
              <div className="meta">{smiles.substance.formula} · aus SMILES</div>
            </button>
          )}
          <button type="button" className="suggestion-item" onClick={() => void online()} disabled={busy}>
            <div>{busy ? 'Suche in den Datenbanken …' : `«${term}» online suchen`}</div>
            <div className="meta">PubChem, Wikidata, ChEMBL, NCI, OPSIN – braucht Internet</div>
          </button>
        </div>
      )}
      {message && <p className="small warning-text">{message}</p>}
    </div>
  );
}
