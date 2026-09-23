import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRDKit } from '../hooks/useRDKit';
import {
  DEFAULT_CONDITIONS,
  mix,
  type MixResult,
  type WorkbenchConditions,
  type WorkbenchReaction,
} from '../chem/workbench';
import { MoleculeStructure } from '../components/MoleculeStructure';
import { Callout } from '../components/Callout';
import { SUBSTANCES, searchSubstances, substanceById } from '../data/substances';
import type { Substance } from '../data/types';

/** Gruppen für den Chemikalienschrank. */
const SHELVES: Array<{ id: string; label: string; categories: string[] }> = [
  { id: 'saeuren', label: 'Säuren', categories: ['Säure'] },
  { id: 'basen', label: 'Laugen und Basen', categories: ['Base'] },
  { id: 'salze', label: 'Salze', categories: ['Salz'] },
  { id: 'metalle', label: 'Metalle und Elemente', categories: ['Element'] },
  { id: 'oxide', label: 'Oxide und Gase', categories: ['Oxid', 'Gas'] },
  {
    id: 'organisch',
    label: 'Organische Stoffe',
    categories: [
      'Alkohol', 'Aldehyd', 'Keton', 'Carbonsäure', 'Ester', 'Amin', 'Amid', 'Aromat',
      'Alkan', 'Alken', 'Alkin', 'Ether', 'Halogenverbindung', 'Nitril', 'Phenol',
      'Säurechlorid', 'Säurederivat', 'Heteroaromat', 'Aminosäure', 'Kohlenhydrat',
    ],
  },
  {
    id: 'reagenzien',
    label: 'Reagenzien',
    categories: ['Oxidationsmittel', 'Reduktionsmittel', 'Katalysator', 'Reagenz', 'Mediator', 'Lösungsmittel'],
  },
];

/** Häufig gebrauchte Stoffe als Schnellzugriff. */
const FAVOURITES = [
  'salzsaeure', 'schwefelsaeure', 'natriumhydroxid', 'essigsaeure', 'ethanol',
  'zink', 'magnesium', 'kupfer', 'eisen', 'silbernitrat', 'kupfersulfat',
  'natriumchlorid', 'calciumcarbonat', 'wasser',
];

const MAX_SLOTS = 4;

export function WorkbenchPage() {
  const { rdkit, status } = useRDKit();
  const [selected, setSelected] = useState<Substance[]>([]);
  const [conditions, setConditions] = useState<WorkbenchConditions>(DEFAULT_CONDITIONS);
  const [query, setQuery] = useState('');
  const [openShelf, setOpenShelf] = useState<string>('saeuren');
  const [result, setResult] = useState<MixResult | null>(null);
  const [running, setRunning] = useState(false);
  const [journal, setJournal] = useState<Array<{ educts: string; outcome: string }>>([]);

  const searchResults = useMemo(() => (query.trim() ? searchSubstances(query, 24) : []), [query]);

  const shelfContents = useMemo(() => {
    const shelf = SHELVES.find((entry) => entry.id === openShelf);
    if (!shelf) return [];
    return SUBSTANCES.filter((substance) => shelf.categories.includes(substance.category)).slice(0, 60);
  }, [openShelf]);

  const favourites = useMemo(
    () => FAVOURITES.map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry)),
    [],
  );

  // Ergebnis neu berechnen, sobald sich Auswahl oder Bedingungen ändern
  useEffect(() => {
    if (!selected.length) {
      setResult(null);
      return;
    }
    setRunning(true);
    // Kurze Verzögerung, damit die Animation sichtbar wird
    const timer = window.setTimeout(() => {
      setResult(mix(rdkit, selected, conditions));
      setRunning(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [rdkit, selected, conditions]);

  const addSubstance = (substance: Substance): void => {
    setSelected((current) => {
      if (current.some((entry) => entry.id === substance.id)) return current;
      if (current.length >= MAX_SLOTS) return current;
      return [...current, substance];
    });
  };

  const removeSubstance = (id: string): void => {
    setSelected((current) => current.filter((entry) => entry.id !== id));
  };

  const clearVessel = (): void => {
    if (result && selected.length) {
      setJournal((current) => [
        {
          educts: selected.map((entry) => entry.name).join(' + '),
          outcome:
            result.outcome === 'reaktion'
              ? result.reactions[0].equation
              : result.outcome === 'gesperrt'
                ? 'nicht simuliert (Gefahr)'
                : 'keine Reaktion',
        },
        ...current.slice(0, 9),
      ]);
    }
    setSelected([]);
    setResult(null);
  };

  /** Ein Produkt als neues Edukt übernehmen. */
  const useProduct = (substanceId?: string): void => {
    if (!substanceId) return;
    const substance = substanceById(substanceId);
    if (!substance) return;
    setSelected([substance]);
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>Werkbank</h1>
        <p className="lead">
          Stoffe ins Reaktionsgefäß geben und sehen, was entsteht. Die App rechnet die Gleichung aus,
          beschreibt die Beobachtung und erklärt, warum es so abläuft.
        </p>
      </div>

      <div className="workbench">
        {/* ---------- Chemikalienschrank ---------- */}
        <section className="card cabinet">
          <h2>Chemikalienschrank</h2>

          <input
            className="input"
            type="search"
            value={query}
            placeholder="Stoff suchen …"
            aria-label="Stoff suchen"
            onChange={(event) => setQuery(event.target.value)}
          />

          {query.trim() ? (
            <div className="bottle-grid" style={{ marginTop: 12 }}>
              {searchResults.map((substance) => (
                <BottleButton key={substance.id} substance={substance} onAdd={addSubstance} />
              ))}
              {!searchResults.length && <p className="muted small">Kein Stoff gefunden.</p>}
            </div>
          ) : (
            <>
              <div className="row" style={{ marginTop: 12, marginBottom: 10 }}>
                {SHELVES.map((shelf) => (
                  <button
                    key={shelf.id}
                    type="button"
                    className={`chip${openShelf === shelf.id ? ' active' : ''}`}
                    onClick={() => setOpenShelf(shelf.id)}
                  >
                    {shelf.label}
                  </button>
                ))}
              </div>
              <div className="bottle-grid">
                {shelfContents.map((substance) => (
                  <BottleButton key={substance.id} substance={substance} onAdd={addSubstance} />
                ))}
              </div>
            </>
          )}

          <h3 style={{ marginTop: 18 }}>Häufig gebraucht</h3>
          <div className="bottle-grid">
            {favourites.map((substance) => (
              <BottleButton key={substance.id} substance={substance} onAdd={addSubstance} />
            ))}
          </div>
        </section>

        {/* ---------- Reaktionsgefäß ---------- */}
        <section className="stack">
          <div className="card">
            <div className="card-title">
              <h2>Reaktionsgefäß</h2>
              {selected.length > 0 && (
                <button type="button" className="button button-secondary button-small" onClick={clearVessel}>
                  Leeren
                </button>
              )}
            </div>

            <div className={`vessel${running ? ' vessel-running' : ''}`}>
              {selected.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
                  Tippe im Schrank auf eine Flasche, um sie hier hineinzugeben.
                  <br />
                  <span className="small">Bis zu {MAX_SLOTS} Stoffe gleichzeitig.</span>
                </p>
              ) : (
                <div className="vessel-contents">
                  {selected.map((substance) => (
                    <div key={substance.id} className="vessel-item">
                      <div>
                        <strong>{substance.name}</strong>
                        <div className="subtle mono small">{substance.formula}</div>
                      </div>
                      <button
                        type="button"
                        className="icon-button small"
                        aria-label={`${substance.name} entfernen`}
                        onClick={() => removeSubstance(substance.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 style={{ marginTop: 16 }}>Bedingungen</h3>
            <div className="row">
              <ConditionToggle
                label="Erhitzen"
                icon="🔥"
                active={conditions.heat}
                onToggle={() => setConditions((c) => ({ ...c, heat: !c.heat }))}
              />
              <ConditionToggle
                label="Katalysator / Hilfsbase"
                icon="⚗"
                active={conditions.catalyst}
                onToggle={() => setConditions((c) => ({ ...c, catalyst: !c.catalyst }))}
              />
              <ConditionToggle
                label="In Wasser"
                icon="💧"
                active={conditions.aqueous}
                onToggle={() => setConditions((c) => ({ ...c, aqueous: !c.aqueous }))}
              />
            </div>
          </div>

          {/* ---------- Ergebnis ---------- */}
          {running && (
            <div className="card row">
              <span className="spinner" />
              <span className="muted">Reaktion wird berechnet …</span>
            </div>
          )}

          {!running && result?.outcome === 'gesperrt' && (
            <Callout variant="danger" title="Diese Mischung wird nicht simuliert">
              <p style={{ marginBottom: 0 }}>{result.blocked}</p>
            </Callout>
          )}

          {!running && result?.outcome === 'keine-reaktion' && (
            <div className="card">
              <h2>Keine Reaktion</h2>
              {result.hints.map((hint) => (
                <p key={hint} className="muted" style={{ marginBottom: 8 }}>
                  {hint}
                </p>
              ))}
            </div>
          )}

          {!running &&
            result?.outcome === 'reaktion' &&
            result.reactions.map((reaction) => (
              <ReactionResult
                key={reaction.id}
                reaction={reaction}
                rdkit={rdkit}
                rdkitReady={status === 'bereit'}
                onUseProduct={useProduct}
              />
            ))}

          {journal.length > 0 && (
            <div className="card">
              <h3>Laborjournal</h3>
              <ul className="journal">
                {journal.map((entry, index) => (
                  <li key={`${entry.educts}-${index}`}>
                    <span className="muted">{entry.educts}</span>
                    <span className="mono small">{entry.outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BottleButton({
  substance,
  onAdd,
}: {
  substance: Substance;
  onAdd: (substance: Substance) => void;
}) {
  return (
    <button type="button" className="bottle" onClick={() => onAdd(substance)} title={substance.description}>
      <span className="bottle-name">{substance.name}</span>
      <span className="bottle-formula mono">{substance.formula}</span>
    </button>
  );
}

function ConditionToggle({
  label,
  icon,
  active,
  onToggle,
}: {
  label: string;
  icon: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`chip${active ? ' active' : ''}`}
      aria-pressed={active}
      onClick={onToggle}
    >
      <span aria-hidden="true">{icon}</span> {label}
    </button>
  );
}

function ReactionResult({
  reaction,
  rdkit,
  rdkitReady,
  onUseProduct,
}: {
  reaction: WorkbenchReaction;
  rdkit: ReturnType<typeof useRDKit>['rdkit'];
  rdkitReady: boolean;
  onUseProduct: (substanceId?: string) => void;
}) {
  return (
    <article className="card reaction-result">
      <div className="card-title">
        <div>
          <h2 style={{ marginBottom: 2 }}>{reaction.title}</h2>
          <div className="subtle">{reaction.reactionType}</div>
        </div>
        <span className={`badge badge-${reaction.kind === 'anorganisch' ? 'anorganisch' : 'organisch'}`}>
          {reaction.kind}
        </span>
      </div>

      <div className="equation-scroll">
        <div className="equation-text">{reaction.equation}</div>
      </div>
      {reaction.ionicEquation && (
        <p className="subtle small" style={{ marginTop: 4 }}>
          Ionengleichung: <span className="mono">{reaction.ionicEquation}</span>
        </p>
      )}

      <div className="callout callout-success" style={{ marginTop: 12 }}>
        <span className="callout-icon">👁</span>
        <div>
          <strong>Beobachtung: </strong>
          {reaction.observation}
        </div>
      </div>

      {reaction.products.some((product) => product.smiles) && (
        <div className="row" style={{ marginTop: 12, alignItems: 'flex-start' }}>
          {reaction.products
            .filter((product) => product.smiles)
            .map((product) => (
              <figure key={product.smiles} style={{ margin: 0 }}>
                <MoleculeStructure
                  rdkit={rdkit}
                  smiles={product.smiles as string}
                  width={200}
                  height={140}
                  fallback={rdkitReady ? product.smiles : 'Struktur wird geladen …'}
                />
                <figcaption className="small" style={{ textAlign: 'center' }}>
                  {product.name ?? product.formula}
                </figcaption>
              </figure>
            ))}
        </div>
      )}

      <p style={{ marginTop: 12 }}>{reaction.explanation}</p>

      {reaction.missing.length > 0 && (
        <Callout variant="warning" title="Dafür fehlt noch etwas">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {reaction.missing.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </Callout>
      )}

      <dl className="definition-list" style={{ marginTop: 12 }}>
        <dt>Bedingungen</dt>
        <dd>{reaction.conditions}</dd>
        <dt>Einstufung</dt>
        <dd>{reaction.safetyLevel}</dd>
      </dl>

      {reaction.hazards.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary>Sicherheitshinweise</summary>
          <ul className="small muted" style={{ paddingLeft: 18, marginTop: 8 }}>
            {reaction.hazards.map((hazard) => (
              <li key={hazard}>{hazard}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="row" style={{ marginTop: 14 }}>
        {reaction.products
          .filter((product) => product.substanceId)
          .map((product) => (
            <button
              key={product.substanceId}
              type="button"
              className="button button-secondary button-small"
              onClick={() => onUseProduct(product.substanceId)}
            >
              {product.name} weiterverwenden
            </button>
          ))}
        {reaction.ruleId && (
          <Link className="button button-small" to={`/reaktion/${reaction.ruleId}`}>
            Ausführliche Anleitung
          </Link>
        )}
      </div>
    </article>
  );
}
