import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRDKit } from '../hooks/useRDKit';
import {
  DEFAULT_CONDITIONS,
  EVIDENCE_LABELS,
  documentedSuggestions,
  mix,
  productAsSubstance,
  vesselKeys,
  type DocumentedSuggestion,
  type Evidence,
  type MixResult,
  type Temperature,
  type WorkbenchConditions,
  type WorkbenchProduct,
  type WorkbenchReaction,
} from '../chem/workbench';
import { MoleculeStructure } from '../components/MoleculeStructure';
import { Callout } from '../components/Callout';
import { SUBSTANCES, searchSubstances, substanceById } from '../data/substances';
import type { Substance } from '../data/types';
import {
  loadReactionIndex,
  reactionsInvolving,
  type DocumentedReaction,
  type ReactionDatabaseIndex,
} from '../data/documentedReactions';

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

const TEMPERATURES: Array<{ id: Temperature; label: string; icon: string }> = [
  { id: 'kalt', label: 'Kühlen (Eisbad)', icon: '❄' },
  { id: 'raum', label: 'Raumtemperatur', icon: '🌡' },
  { id: 'heiss', label: 'Erhitzen', icon: '🔥' },
];

const CATALYSES: Array<{ id: WorkbenchConditions['catalysis']; label: string; icon: string; hint: string }> = [
  { id: 'keine', label: 'Ohne Katalysator', icon: '○', hint: 'Nichts zusetzen' },
  { id: 'sauer', label: 'Säurekatalysiert (H⁺)', icon: '🟥', hint: 'Einige Tropfen konzentrierte Schwefelsäure oder p-Toluolsulfonsäure' },
  { id: 'basisch', label: 'Basenkatalysiert (OH⁻)', icon: '🟦', hint: 'Natronlauge, Alkoholat oder eine Aminbase' },
  { id: 'metall', label: 'Metallkatalysator', icon: '⬡', hint: 'Palladium, Platin oder Nickel' },
  { id: 'lewis', label: 'Lewis-Säure', icon: '◆', hint: 'Aluminiumchlorid oder Eisen(III)-bromid' },
];

export function WorkbenchPage() {
  const { rdkit, status } = useRDKit();
  const [selected, setSelected] = useState<Substance[]>([]);
  const [conditions, setConditions] = useState<WorkbenchConditions>(DEFAULT_CONDITIONS);
  const [query, setQuery] = useState('');
  const [openShelf, setOpenShelf] = useState<string>('saeuren');
  const [result, setResult] = useState<MixResult | null>(null);
  const [running, setRunning] = useState(false);
  const [journal, setJournal] = useState<Array<{ educts: string; outcome: string }>>([]);
  const [params] = useSearchParams();
  const [database, setDatabase] = useState<ReactionDatabaseIndex | null>(null);
  const [documented, setDocumented] = useState<{ ids: string; reactions: DocumentedReaction[] } | null>(null);

  // Stoffe aus der Adresse übernehmen, z. B. #/werkbank?stoffe=anilin,acetanhydrid
  useEffect(() => {
    const ids = params.get('stoffe')?.split(',') ?? [];
    const fromUrl = ids.map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry));
    if (fromUrl.length) setSelected(fromUrl.slice(0, MAX_SLOTS));
  }, [params]);

  useEffect(() => {
    loadReactionIndex().then(setDatabase);
  }, []);

  // Belegte Reaktionen der Stoffe im Gefäß nachladen
  const selectionKey = selected.map((entry) => entry.id).join('|');
  useEffect(() => {
    if (!rdkit || !selected.length) {
      setDocumented(null);
      return;
    }
    let cancelled = false;
    reactionsInvolving(vesselKeys(rdkit, selected)).then((reactions) => {
      if (!cancelled) setDocumented({ ids: selectionKey, reactions });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdkit, selectionKey]);

  const documentedReady = !rdkit || (documented !== null && documented.ids === selectionKey);
  const documentedList = documentedReady ? (documented?.reactions ?? []) : [];

  const suggestions = useMemo<DocumentedSuggestion[]>(
    () => (rdkit && documentedReady && selected.length ? documentedSuggestions(rdkit, selected, conditions, documentedList) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rdkit, documentedReady, documented, conditions],
  );

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
    if (!documentedReady) return;
    // Kurze Verzögerung, damit die Animation sichtbar wird
    const timer = window.setTimeout(() => {
      setResult(mix(rdkit, selected, conditions, documentedList));
      setRunning(false);
    }, 320);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdkit, selected, conditions, documentedReady, documented]);

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

  /** Ein Produkt als neues Edukt übernehmen – auch wenn es nicht in der Datenbank steht. */
  const useProduct = (product: WorkbenchProduct): void => {
    const substance = productAsSubstance(product);
    if (!substance) return;
    setSelected([substance]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>Werkbank</h1>
        <p className="lead">
          Stoffe ins Reaktionsgefäß geben und sehen, was entsteht. Die App rechnet die Gleichung aus,
          beschreibt die Beobachtung und erklärt, warum es so abläuft.
        </p>
        <p className="small muted" style={{ marginTop: 6 }}>
          Jedes Ergebnis ist gekennzeichnet: <EvidenceBadge evidence="belegt" /> in der Literatur beschrieben
          {database ? ` (Abgleich mit ${database.total.toLocaleString('de-DE')} Reaktionen aus US-Patenten)` : ''},{' '}
          <EvidenceBadge evidence="lehrbuch" /> fest hinterlegte Standardreaktion,{' '}
          <EvidenceBadge evidence="vorhersage" /> aus Regeln oder Vorlagen berechnet und nicht einzeln belegt.
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

            <h3 style={{ marginTop: 16 }}>Temperatur</h3>
            <div className="row" role="radiogroup" aria-label="Temperatur">
              {TEMPERATURES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="radio"
                  aria-checked={conditions.temperature === entry.id}
                  className={`chip${conditions.temperature === entry.id ? ' active' : ''}`}
                  onClick={() => setConditions((c) => ({ ...c, temperature: entry.id }))}
                >
                  <span aria-hidden="true">{entry.icon}</span> {entry.label}
                </button>
              ))}
            </div>

            <h3 style={{ marginTop: 14 }}>Katalyse</h3>
            <div className="row" role="radiogroup" aria-label="Katalyse">
              {CATALYSES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="radio"
                  aria-checked={conditions.catalysis === entry.id}
                  className={`chip${conditions.catalysis === entry.id ? ' active' : ''}`}
                  title={entry.hint}
                  onClick={() => setConditions((c) => ({ ...c, catalysis: entry.id }))}
                >
                  <span aria-hidden="true">{entry.icon}</span> {entry.label}
                </button>
              ))}
            </div>

            <h3 style={{ marginTop: 14 }}>Weitere Bedingungen</h3>
            <div className="row">
              <ConditionToggle
                label="In Wasser gelöst"
                icon="💧"
                active={conditions.aqueous}
                onToggle={() => setConditions((c) => ({ ...c, aqueous: !c.aqueous }))}
              />
              <ConditionToggle
                label="Licht (UV)"
                icon="💡"
                active={conditions.light}
                onToggle={() => setConditions((c) => ({ ...c, light: !c.light }))}
              />
              <ConditionToggle
                label="Strom (Elektrolyse)"
                icon="⚡"
                active={conditions.electrolysis}
                onToggle={() => setConditions((c) => ({ ...c, electrolysis: !c.electrolysis }))}
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

          {!running && result?.outcome === 'reaktion' && result.hints.length > 0 && (
            <Callout variant="info" title="Negativer Nachweis">
              {result.hints.map((hint) => (
                <p key={hint} style={{ marginBottom: 8 }}>
                  {hint}
                </p>
              ))}
            </Callout>
          )}

          {!running && result?.outcome === 'reaktion' && <EvidenceSummary reactions={result.reactions} />}

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

          {!running && suggestions.length > 0 && (
            <DocumentedPanel
              suggestions={suggestions}
              rdkit={rdkit}
              rdkitReady={status === 'bereit'}
              slotsLeft={MAX_SLOTS - selected.length}
              onAdd={(substances) => substances.forEach(addSubstance)}
            />
          )}

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
  onUseProduct: (product: WorkbenchProduct) => void;
}) {
  return (
    <article className="card reaction-result">
      <div className="card-title">
        <div>
          <h2 style={{ marginBottom: 2 }}>{reaction.title}</h2>
          <div className="subtle">{reaction.reactionType}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <EvidenceBadge evidence={reaction.evidence} count={reaction.documented?.count} />
          {reaction.catalysisMatched && <span className="badge badge-success">passende Katalyse</span>}
          <span className={`badge badge-${reaction.kind === 'anorganisch' ? 'anorganisch' : 'organisch'}`}>
            {reaction.kind}
          </span>
        </div>
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

      {reaction.explanation !== reaction.evidenceNote && <p style={{ marginTop: 12 }}>{reaction.explanation}</p>}

      <Callout
        variant={EVIDENCE_VARIANT[reaction.evidence]}
        title={reaction.evidence === 'vorhersage' ? 'Nur eine Vorhersage' : EVIDENCE_LABELS[reaction.evidence]}
      >
        <p style={{ margin: 0 }}>{reaction.evidenceNote}</p>
      </Callout>

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
          .filter((product) => (product.substanceId || product.smiles) && !['H2O', 'CO2'].includes(product.formula ?? ''))
          .slice(0, 3)
          .map((product) => (
            <button
              key={product.substanceId ?? product.smiles}
              type="button"
              className="button button-secondary button-small"
              onClick={() => onUseProduct(product)}
            >
              {product.name ?? product.formula} weiterverwenden
            </button>
          ))}
        {reaction.ruleId && (
          <Link className="button button-small" to={`/reaktion/${reaction.ruleId}`}>
            Ausführliche Anleitung
          </Link>
        )}
        {reaction.complexLink && (
          <Link className="button button-small" to={reaction.complexLink}>
            In der Komplex-Werkbank ansehen
          </Link>
        )}
      </div>
    </article>
  );
}

const EVIDENCE_VARIANT: Record<Evidence, 'success' | 'info' | 'warning'> = {
  belegt: 'success',
  lehrbuch: 'info',
  vorhersage: 'warning',
};

const EVIDENCE_ICONS: Record<Evidence, string> = { belegt: '✓', lehrbuch: '📘', vorhersage: '≈' };

function EvidenceBadge({ evidence, count }: { evidence: Evidence; count?: number }) {
  const title =
    evidence === 'belegt'
      ? 'In der Patentliteratur beschrieben'
      : evidence === 'lehrbuch'
        ? 'Fest hinterlegte Standardreaktion'
        : 'Berechnet – nicht einzeln belegt';
  return (
    <span className={`badge badge-${EVIDENCE_VARIANT[evidence] === 'info' ? 'analytik' : EVIDENCE_VARIANT[evidence]}`} title={title}>
      <span aria-hidden="true">{EVIDENCE_ICONS[evidence]}</span> {EVIDENCE_LABELS[evidence]}
      {count && count > 1 ? ` (${count}×)` : ''}
    </span>
  );
}

function EvidenceSummary({ reactions }: { reactions: WorkbenchReaction[] }) {
  const complete = reactions.filter((reaction) => !reaction.missing.length);
  const count = (evidence: Evidence) => complete.filter((reaction) => reaction.evidence === evidence).length;
  const predictedOnly = complete.length > 0 && complete.every((reaction) => reaction.evidence === 'vorhersage');
  if (!complete.length) return null;
  return (
    <Callout variant={predictedOnly ? 'warning' : 'neutral'} title={predictedOnly ? 'Hinweis: nur Vorhersagen' : 'Herkunft der Ergebnisse'}>
      <p style={{ margin: 0 }}>
        {predictedOnly
          ? 'Für diese Mischung ist keine Reaktion belegt. Die Ergebnisse unten sind aus Regeln und Reaktionsvorlagen berechnet – chemisch plausibel, aber nicht experimentell für genau diese Stoffe nachgewiesen.'
          : `${count('belegt')} belegt, ${count('lehrbuch')} Lehrbuchreaktion${count('lehrbuch') === 1 ? '' : 'en'}, ${count('vorhersage')} Vorhersage${count('vorhersage') === 1 ? '' : 'n'}.`}
      </p>
    </Callout>
  );
}

function DocumentedPanel({
  suggestions,
  rdkit,
  rdkitReady,
  slotsLeft,
  onAdd,
}: {
  suggestions: DocumentedSuggestion[];
  rdkit: ReturnType<typeof useRDKit>['rdkit'];
  rdkitReady: boolean;
  slotsLeft: number;
  onAdd: (substances: Substance[]) => void;
}) {
  return (
    <section className="card">
      <h2>Belegte Reaktionen mit diesen Stoffen</h2>
      <p className="muted small">
        So wurden die Stoffe im Gefäß in Patenten tatsächlich umgesetzt. Gib den fehlenden Partner dazu, um die
        Reaktion in der Werkbank nachzustellen.
      </p>
      <ul className="documented-list">
        {suggestions.map((entry) => (
          <li key={entry.reaction.id} className="documented-item">
            <MoleculeStructure
              rdkit={rdkit}
              smiles={entry.reaction.product}
              width={120}
              height={90}
              fallback={rdkitReady ? entry.productName : '…'}
            />
            <div style={{ minWidth: 0 }}>
              <div>
                <strong>{entry.from}</strong>
                {entry.partners.length > 0 && <> + {entry.partners.map((partner) => partner.name).join(' + ')}</>} →{' '}
                <strong>{entry.productName}</strong>
              </div>
              <div className="subtle small">
                {entry.reagents.length > 0 && <>Reagenzien laut Vorschrift: {entry.reagents.join(', ')} · </>}
                {entry.reaction.count > 1 ? `${entry.reaction.count} Fundstellen` : '1 Fundstelle'}
              </div>
              {entry.partners.length > 0 && (
                <button
                  type="button"
                  className="button button-secondary button-small"
                  style={{ marginTop: 6 }}
                  disabled={entry.partners.length > slotsLeft}
                  onClick={() => onAdd(entry.partners)}
                >
                  {entry.partners.length > slotsLeft ? 'Gefäß ist voll' : 'Partner ins Gefäß'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
