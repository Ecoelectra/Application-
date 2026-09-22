import { useMemo, useState } from 'react';
import { searchReactions } from '../chem/reactionEngine';
import { ReactionCard } from '../components/ReactionCard';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { REACTIONS } from '../data/reactions';

const CATEGORIES = ['organisch', 'elektrochemie', 'anorganisch', 'technisch', 'analytik'];
const SCALES = ['Schulversuch', 'Laborsynthese', 'Industrie', 'Wirkstoffentwicklung'];

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [scales, setScales] = useState<string[]>([]);

  const toggle = (
    value: string,
    list: string[],
    setter: (next: string[]) => void,
  ): void => {
    setter(list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]);
  };

  const results = useMemo(
    () => searchReactions(query, { categories, groups, scales }),
    [query, categories, groups, scales],
  );

  const usedGroups = useMemo(() => {
    const ids = new Set(REACTIONS.flatMap((rule) => rule.functionalGroups));
    return FUNCTIONAL_GROUPS.filter((group) => ids.has(group.id));
  }, []);

  const activeFilters = categories.length + groups.length + scales.length;

  return (
    <main className="page">
      <header className="page-header">
        <h1>Reaktionen durchsuchen</h1>
        <p>
          {REACTIONS.length} Reaktionen mit Gleichung, Mechanismus, Bedingungen und Anleitung. Such
          nach Namen, Reagenzien, Mechanismustyp oder Stichwörtern wie «Radikal», «Katalyse» oder
          «Elektrolyse».
        </p>
      </header>

      <div className="card" style={{ marginBottom: 18 }}>
        <input
          className="input"
          type="search"
          value={query}
          placeholder="z. B. Veresterung, Grignard, Kolbe, SN2, Palladium …"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Reaktionen durchsuchen"
        />

        <div style={{ marginTop: 14 }}>
          <div className="subtle" style={{ marginBottom: 6 }}>Kategorie</div>
          <div className="row">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip${categories.includes(category) ? ' active' : ''}`}
                onClick={() => toggle(category, categories, setCategories)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="subtle" style={{ marginBottom: 6 }}>Einsatzbereich</div>
          <div className="row">
            {SCALES.map((scale) => (
              <button
                key={scale}
                type="button"
                className={`chip${scales.includes(scale) ? ' active' : ''}`}
                onClick={() => toggle(scale, scales, setScales)}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary className="subtle" style={{ cursor: 'pointer' }}>
            Nach funktioneller Gruppe filtern
          </summary>
          <div className="row" style={{ marginTop: 10 }}>
            {usedGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`chip${groups.includes(group.id) ? ' active' : ''}`}
                onClick={() => toggle(group.id, groups, setGroups)}
              >
                {group.name}
              </button>
            ))}
          </div>
        </details>

        {activeFilters > 0 && (
          <button
            type="button"
            className="button button-secondary button-small"
            style={{ marginTop: 12 }}
            onClick={() => {
              setCategories([]);
              setGroups([]);
              setScales([]);
            }}
          >
            {activeFilters} Filter zurücksetzen
          </button>
        )}
      </div>

      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="muted">{results.length} Treffer</span>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-2">
          {results.map((rule) => (
            <ReactionCard key={rule.id} rule={rule} />
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <span className="icon">🔍</span>
          <p>Keine Reaktion gefunden. Versuche einen anderen Suchbegriff oder weniger Filter.</p>
        </div>
      )}
    </main>
  );
}
