import { useEffect, useRef, useState } from 'react';
import { searchSubstances } from '../data/substances';
import { SOURCES, suggestNames, type SourceHit } from '../services/substanceSources';
import type { Substance } from '../data/types';

export interface SelectedSubstance {
  label: string;
  smiles?: string;
  formula?: string;
  cid?: number;
  /** Stammt der Treffer aus der lokalen Datenbank, einer Online-Datenbank oder der Eingabe? */
  source: 'lokal' | 'pubchem' | 'wikidata' | 'eingabe';
}

interface Props {
  onSelect: (entry: SelectedSubstance) => void;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

interface Option {
  label: string;
  detail?: string;
  substance?: Substance;
  hit?: SourceHit;
  source: SelectedSubstance['source'];
}

/**
 * Eingabefeld für Stoffe mit Vorschlägen aus der lokalen Datenbank, aus
 * Wikidata (deutsche Namen) und PubChem. Name, Summenformel, CAS-Nummer und
 * SMILES werden erkannt.
 */
export function SubstanceSearch({ onSelect, placeholder, autoFocus, initialValue = '' }: Props) {
  const [query, setQuery] = useState(initialValue);
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setOptions([]);
      return;
    }

    // Lokale Treffer stehen sofort zur Verfügung
    const local: Option[] = searchSubstances(term, 8).map((substance) => ({
      label: substance.name,
      detail: `${substance.formula} · ${substance.category}`,
      substance,
      source: 'lokal' as const,
    }));
    setOptions(local);
    setHighlighted(0);

    const timer = setTimeout(async () => {
      setLoading(true);
      const remote = await suggestNames(term, 8);
      setLoading(false);
      if (!remote.length) return;

      const known = new Set(local.map((option) => option.label.toLowerCase()));
      const merged: Option[] = [
        ...local,
        ...remote
          .filter((entry) => !known.has(entry.label.toLowerCase()))
          .map((entry) => ({
            label: entry.label,
            detail: [SOURCES[entry.source].label, entry.source === 'wikidata' ? entry.detail : undefined].filter(Boolean).join(' · '),
            hit: entry.hit,
            source: entry.source === 'wikidata' ? ('wikidata' as const) : ('pubchem' as const),
          })),
      ];
      setOptions(merged.slice(0, 12));
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const choose = (option: Option): void => {
    setOpen(false);
    setQuery(option.label);
    if (option.substance) {
      onSelect({
        label: option.substance.name,
        smiles: option.substance.smiles,
        formula: option.substance.formula,
        cid: option.substance.pubchemCid,
        source: 'lokal',
      });
    } else if (option.hit) {
      // Wikidata liefert Struktur, Formel und PubChem-CID gleich mit
      onSelect({ label: option.label, smiles: option.hit.smiles, formula: option.hit.formula, cid: option.hit.cid, source: option.source });
    } else {
      onSelect({ label: option.label, source: option.source });
    }
  };

  const submitRaw = (): void => {
    const term = query.trim();
    if (!term) return;
    setOpen(false);
    const localHit = searchSubstances(term, 1)[0];
    if (localHit && localHit.name.toLowerCase() === term.toLowerCase()) {
      onSelect({
        label: localHit.name,
        smiles: localHit.smiles,
        formula: localHit.formula,
        cid: localHit.pubchemCid,
        source: 'lokal',
      });
      return;
    }
    onSelect({ label: term, source: 'eingabe' });
  };

  return (
    <div className="search-box" ref={containerRef}>
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <input
          className="input"
          type="search"
          inputMode="search"
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder ?? 'Stoff eingeben: Name, Formel, CAS-Nummer oder SMILES'}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setHighlighted((index) => Math.min(index + 1, options.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlighted((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              if (open && options[highlighted]) choose(options[highlighted]);
              else submitRaw();
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          aria-label="Stoff suchen"
          aria-expanded={open}
          role="combobox"
          aria-controls="stoff-vorschlaege"
        />
        <button className="button" type="button" onClick={submitRaw}>
          {loading ? <span className="spinner" /> : 'Analysieren'}
        </button>
      </div>

      {open && options.length > 0 && (
        <div className="suggestion-list" id="stoff-vorschlaege" role="listbox">
          {options.map((option, index) => (
            <button
              key={`${option.source}-${option.label}`}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              className={`suggestion-item${index === highlighted ? ' highlighted' : ''}`}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => choose(option)}
            >
              <div>{option.label}</div>
              {option.detail && <div className="meta">{option.detail}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
