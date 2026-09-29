import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRDKit } from '../hooks/useRDKit';
import {
  DEFAULT_CONDITIONS,
  EVIDENCE_LABELS,
  formatPressure,
  formatTemperature,
  temperatureRange,
  documentedSuggestions,
  mix,
  productAsSubstance,
  vesselKeys,
  type DocumentedSuggestion,
  type Evidence,
  type MixResult,
  type WorkbenchConditions,
  type WorkbenchProduct,
  type WorkbenchReaction,
} from '../chem/workbench';
import { MoleculeStructure } from '../components/MoleculeStructure';
import { ComplexBuilder } from '../components/ComplexBuilder';
import { ComplexDetails } from '../components/ComplexDetails';
import { physicalProperties, stateAt } from '../chem/phase';
import { substanceFromCompound, substanceFromSmiles } from '../chem/externalSubstances';
import { compoundByCid } from '../services/pubchem';
import { OnlineSubstanceSearch } from '../components/OnlineSubstanceSearch';
import { AiProposalCard } from '../components/AiProposalCard';
import { AiInfoPanel } from '../components/AiInfoPanel';
import { SynthesisPlanner } from '../components/SynthesisPlanner';
import { CatalysisControl, PRESSURE_LOG_MIN, PressureControl, TEMPERATURE_MAX, TEMPERATURE_MIN, TemperatureControl } from '../components/ReactorControls';
import { predictFromKnowledge, predictWithModel, type AiProposal } from '../chem/ai/reactionAI';
import type { StepEvaluation, StepVerdict } from '../chem/ai/synthesisConditions';
import { useReactionModel } from '../hooks/useReactionModel';
import type { MainModule } from '@rdkit/rdkit';
import { EnthalpyPanel } from '../components/EnthalpyPanel';
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
const SHELVES: Array<{ id: string; label: string; categories: string[]; ids?: string[] }> = [
  {
    id: 'metallsalze',
    label: 'Metallsalze',
    categories: [],
    ids: [
      'kupfersulfat', 'kupfer-ii-chlorid', 'kupfer-i-chlorid', 'nickel-ii-chlorid', 'nickel-ii-sulfat',
      'cobalt-ii-chlorid', 'eisen-iii-chlorid', 'eisen-ii-sulfat', 'chrom-iii-chlorid', 'mangan-ii-chlorid',
      'zinksulfat', 'aluminiumchlorid', 'silbernitrat', 'silberchlorid', 'silberbromid', 'kupfer-ii-hydroxid',
      'palladium-ii-chlorid', 'magnesiumchlorid', 'calciumchlorid', 'blei-ii-nitrat',
    ],
  },
  {
    id: 'komplexbildner',
    label: 'Komplexbildner',
    categories: [],
    ids: [
      'ammoniak', 'wasser', 'ethylendiamin', 'dinatrium-edta', 'kaliumthiocyanat', 'natriumthiosulfat',
      'natriumfluorid', 'kaliumiodid', 'natriumhydroxid', 'salzsaeure', 'dimethylglyoxim', '1-10-phenanthrolin',
      '2-2-bipyridin', '8-hydroxychinolin', 'acetylaceton', 'glycin', 'kaliumnatriumtartrat', 'glycerin',
      'natriumoxalat', 'pyridin', 'phenol', 'salicylsaeure', 'triphenylphosphin', 'thioharnstoff',
    ],
  },
  { id: 'saeuren', label: 'Säuren', categories: ['Säure'] },
  { id: 'basen', label: 'Laugen und Basen', categories: ['Base'] },
  { id: 'salze', label: 'Salze', categories: ['Salz'] },
  { id: 'metalle', label: 'Metalle und Elemente', categories: ['Element'] },
  { id: 'oxide', label: 'Oxide, Gase, Nichtmetallverbindungen', categories: ['Oxid', 'Gas', 'Nichtmetallverbindung'] },
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
/** Mischungen, bei denen die Reaktions-KI zeigt, was sie kann (Katalysator, Temperatur, Druck) */
const AI_EXAMPLES: string[][] = [
  ['anilin', 'acetylchlorid'],
  ['brombenzol', 'phenylboronsaeure'],
  ['benzylbromid', 'morpholin'],
  ['nitrobenzol', 'wasserstoff'],
  ['phenol', 'brom'],
  ['benzoesaeure', 'benzylamin'],
  ['benzaldehyd', 'anilin'],
  ['cyclohexen', 'wasserstoff'],
];

const FAVOURITES = [
  'salzsaeure', 'schwefelsaeure', 'natriumhydroxid', 'essigsaeure', 'ethanol',
  'zink', 'magnesium', 'kupfer', 'eisen', 'silbernitrat', 'kupfersulfat',
  'natriumchlorid', 'calciumcarbonat', 'wasser',
];

const MAX_SLOTS = 4;




const ORIGIN_LABELS: Record<NonNullable<Substance['origin']>, { label: string; hint: string } | undefined> = {
  pubchem: { label: 'PubChem', hint: 'Aus PubChem geladen; Name und Daten stammen von dort' },
  eingabe: { label: 'SMILES', hint: 'Als Struktur eingegeben' },
  generiert: undefined,
};

const STATE_ICONS: Record<string, string> = {
  fest: '▪', flüssig: '💧', gasförmig: '💨', gelöst: '🫧', zersetzt: '⚠', unbekannt: '?',
};


export function WorkbenchPage() {
  const { rdkit, status } = useRDKit();
  const [selected, setSelected] = useState<Substance[]>([]);
  const [conditions, setConditions] = useState<WorkbenchConditions>({
    ...DEFAULT_CONDITIONS,
    temperatureC: 20,
    pressureBar: 1.013,
  });
  const temperatureC = conditions.temperatureC ?? 20;
  const pressureBar = conditions.pressureBar ?? 1.013;
  const setTemperature = (value: number): void => {
    if (!Number.isFinite(value)) return;
    const clamped = Math.max(TEMPERATURE_MIN, Math.min(TEMPERATURE_MAX, Math.round(value)));
    setConditions((c) => ({ ...c, temperatureC: clamped, temperature: temperatureRange(clamped) }));
  };
  const setPressure = (value: number): void => {
    if (!Number.isFinite(value) || value <= 0) return;
    const clamped = Math.max(10 ** PRESSURE_LOG_MIN, Math.min(300, value));
    setConditions((c) => ({ ...c, pressureBar: Number(clamped.toPrecision(3)) }));
  };
  const [query, setQuery] = useState('');
  const [openShelf, setOpenShelf] = useState<string>('saeuren');
  const [result, setResult] = useState<MixResult | null>(null);
  const [running, setRunning] = useState(false);
  const [journal, setJournal] = useState<Array<{ educts: string; outcome: string }>>([]);
  const [params, setParams] = useSearchParams();
  type Mode = 'mischen' | 'synthese' | 'komplexe';
  const modus = params.get('modus');
  // Ein Zielstoff in der Adresse öffnet die KI-Synthese
  const mode: Mode = modus === 'komplexe' ? 'komplexe' : modus === 'synthese' || (!modus && params.has('ziel')) ? 'synthese' : 'mischen';
  const switchMode = (next: Mode): void => {
    const nextParams = new URLSearchParams(next === 'mischen' ? {} : { modus: next });
    setParams(nextParams, { replace: true });
  };
  const [database, setDatabase] = useState<ReactionDatabaseIndex | null>(null);
  const [documented, setDocumented] = useState<{ ids: string; reactions: DocumentedReaction[] } | null>(null);

  // Stoffe aus der Adresse übernehmen, z. B. #/werkbank?stoffe=anilin,acetanhydrid
  // Auch PubChem-Stoffe (pubchem-2519) und Strukturen (smiles:CCO) sind möglich.
  const stoffeParam = params.get('stoffe') ?? '';
  // Nur Stoffe außerhalb der Datenbank brauchen RDKit; sonst nicht erneut auslösen
  const urlRdkit = stoffeParam.split(',').some((id) => id && !substanceById(id)) ? rdkit : null;
  useEffect(() => {
    const ids = stoffeParam.split(',').filter(Boolean);
    if (!ids.length) return;
    const external = ids.some((id) => !substanceById(id));
    if (external && !urlRdkit) return;
    let cancelled = false;
    (async () => {
      const resolved = await Promise.all(ids.map((id) => resolveSubstanceId(urlRdkit, id)));
      const fromUrl = resolved.filter((entry): entry is Substance => Boolean(entry));
      if (!cancelled && fromUrl.length) setSelected(fromUrl.slice(0, MAX_SLOTS));
    })();
    return () => {
      cancelled = true;
    };
  }, [stoffeParam, urlRdkit]);

  // Zielstoff für die KI-Synthese aus der Adresse, z. B. #/werkbank?ziel=paracetamol
  const zielParam = params.get('ziel') ?? '';
  const [planTarget, setPlanTarget] = useState<Substance | null>(null);
  const zielRdkit = zielParam && !substanceById(zielParam) ? rdkit : null;
  useEffect(() => {
    if (!zielParam || (!substanceById(zielParam) && !zielRdkit)) return;
    let cancelled = false;
    resolveSubstanceId(zielRdkit, zielParam).then((substance) => {
      if (!cancelled) setPlanTarget(substance);
    });
    return () => {
      cancelled = true;
    };
  }, [zielParam, zielRdkit]);

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
    if (shelf.ids) return shelf.ids.map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry));
    return SUBSTANCES.filter((substance) => shelf.categories.includes(substance.category));
  }, [openShelf]);
  const [shelfExpanded, setShelfExpanded] = useState(false);
  const SHELF_PREVIEW = 60;

  const favourites = useMemo(
    () => FAVOURITES.map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry)),
    [],
  );

  // Reaktions-KI: rechnet in der Werkbank mit
  const { model: aiModel, status: aiStatus } = useReactionModel();

  // Ergebnis neu berechnen, sobald sich Auswahl, Bedingungen oder das KI-Modell ändern
  useEffect(() => {
    if (!selected.length) {
      setResult(null);
      return;
    }
    setRunning(true);
    if (!documentedReady) return;
    // Kurze Verzögerung, damit die Animation sichtbar wird
    const timer = window.setTimeout(() => {
      setResult(mix(rdkit, selected, conditions, documentedList, aiModel));
      setRunning(false);
    }, 320);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdkit, selected, conditions, documentedReady, documented, aiModel]);

  // Weitere Ideen der KI: Wissensbasis und Vorschläge, die nicht schon als Reaktion oben stehen
  const [aiResults, setAiResults] = useState<Array<{ key: string; substances: Substance[]; proposals: AiProposal[] }> | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  useEffect(() => {
    const partners = selected.filter((substance) => substance.category !== 'Nachweisreagenz');
    if (!rdkit || !partners.length) {
      setAiResults(null);
      return;
    }
    setAiRunning(true);
    const timer = window.setTimeout(() => {
      const groups: Substance[][] = [];
      if (partners.length === 1) groups.push(partners);
      for (let i = 0; i < partners.length; i++) for (let j = i + 1; j < partners.length; j++) groups.push([partners[i], partners[j]]);
      const options = { temperatureC, catalysis: conditions.catalysis };
      setAiResults(
        groups.map((group) => {
          const others = selected.filter((substance) => !group.includes(substance));
          const knowledge = predictFromKnowledge(group, { ...options, others, rdkit });
          const learned = aiModel ? predictWithModel(rdkit, aiModel, group, { ...options, others, limit: 3 }) : [];
          return { key: group.map((entry) => entry.id).join('+'), substances: group, proposals: [...knowledge, ...learned] };
        }),
      );
      setAiRunning(false);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [rdkit, aiModel, selected, temperatureC, conditions.catalysis]);

  const addSubstance = (substance: Substance): void => {
    setSelected((current) => {
      if (current.some((entry) => entry.id === substance.id)) return current;
      if (current.length >= MAX_SLOTS) return current;
      return [...current, substance];
    });
  };

  /** Stufe aus der KI-Synthese ansetzen: Gefäß neu befüllen, Katalyse und Temperatur einstellen */
  const setUpStep = (
    substances: Substance[],
    catalysis: Exclude<WorkbenchConditions['catalysis'], 'keine'> | null,
    temperature: number,
    pressure: number,
  ): void => {
    const unique = substances.filter((entry, index) => substances.findIndex((other) => other.id === entry.id) === index);
    setSelected(unique.slice(0, MAX_SLOTS));
    setConditions((current) => ({ ...current, catalysis: catalysis ?? 'keine' }));
    setTemperature(temperature);
    setPressure(pressure);
    // Zum Mischen wechseln: Die Werkbank rechnet die Stufe nach
    switchMode('mischen');
    window.setTimeout(() => document.getElementById('reaktionsgefaess')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
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
                : result.pairOutcomes?.[0]?.equation ?? 'keine Reaktion',
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
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ margin: 0 }}>Werkbank</h1>
          <div className="row" role="tablist" aria-label="Werkbank-Modus">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'mischen'}
              className={`chip${mode === 'mischen' ? ' active' : ''}`}
              onClick={() => switchMode('mischen')}
            >
              ⚗ Stoffe mischen
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'synthese'}
              className={`chip${mode === 'synthese' ? ' active' : ''}`}
              onClick={() => switchMode('synthese')}
            >
              🎯 KI-Synthese
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'komplexe'}
              className={`chip${mode === 'komplexe' ? ' active' : ''}`}
              onClick={() => switchMode('komplexe')}
            >
              ⬡ Komplexe bauen
            </button>
          </div>
        </div>
        {mode === 'mischen' && (
          <p className="lead">
            Stoffe ins Reaktionsgefäß geben und sehen, was entsteht. Die App rechnet die Gleichung aus,
            beschreibt die Beobachtung und erklärt, warum es so abläuft. Gibst du ein Metallsalz und einen
            Komplexbildner zusammen, zeigt sie den entstehenden Komplex mit Farbe, räumlichem Bau und
            Orbitalschema.
          </p>
        )}
        {mode === 'synthese' && (
          <p className="lead">
            Zielstoff wählen und die Reaktions-KI planen lassen, wie er entsteht. Mit Temperatur, Druck und Katalysator
            steuerst du den Reaktor: Jede Stufe zeigt sofort, ob sie abläuft, wie schnell und worauf zu achten ist. Mit
            «Stufe ansetzen» geht es direkt ins Reaktionsgefäß.
          </p>
        )}
        {mode === 'mischen' && (
        <p className="small muted" style={{ marginTop: 6 }}>
          Jedes Ergebnis ist gekennzeichnet: <EvidenceBadge evidence="belegt" /> in der Literatur beschrieben
          {database ? ` (Abgleich mit ${database.total.toLocaleString('de-DE')} Reaktionen aus US-Patenten)` : ''},{' '}
          <EvidenceBadge evidence="lehrbuch" /> fest hinterlegte Standardreaktion,{' '}
          <EvidenceBadge evidence="ki" /> vom neuronalen Netz vorhergesagt und im Reaktor bei der eingestellten Temperatur,
          dem Druck und dem Katalysator bewertet, <EvidenceBadge evidence="vorhersage" /> aus Regeln oder Vorlagen berechnet
          und nicht einzeln belegt.{' '}
          {aiStatus === 'bereit'
            ? 'Die Reaktions-KI rechnet jede Mischung mit.'
            : aiStatus === 'laden'
              ? 'Die Reaktions-KI wird geladen …'
              : 'Die Reaktions-KI ist nicht geladen; die Werkbank rechnet nur mit Regeln und Belegen.'}
        </p>
        )}
      </div>

      {mode === 'komplexe' && <ComplexBuilder />}

      {/* KI-Synthese bleibt beim Umschalten erhalten, damit die Wege nicht neu geplant werden müssen */}
      <div hidden={mode !== 'synthese'}>
        <SynthesisPlanner
          rdkit={rdkit}
          model={aiModel}
          modelStatus={aiStatus}
          temperatureC={temperatureC}
          pressureBar={pressureBar}
          onSetTemperature={setTemperature}
          onSetPressure={setPressure}
          initialTarget={planTarget}
          onSetUp={setUpStep}
          onAddSubstance={addSubstance}
          onSetCatalysis={(catalysis) => setConditions((c) => ({ ...c, catalysis }))}
        />
      </div>

      {mode === 'mischen' && (
      <div className="workbench">
        {/* ---------- Chemikalienschrank ---------- */}
        <section className="card cabinet">
          <h2>Chemikalienschrank</h2>

          <input
            className="input"
            type="search"
            value={query}
            placeholder="Name, Formel, CAS-Nummer oder SMILES …"
            aria-label="Stoff suchen"
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="small subtle" style={{ margin: '6px 0 0' }}>
            {SUBSTANCES.length.toLocaleString('de-DE')} Stoffe offline, dazu online alle Stoffe aus PubChem.
          </p>

          {query.trim() ? (
            <>
              <div className="bottle-grid" style={{ marginTop: 12 }}>
                {searchResults.map((substance) => (
                  <BottleButton key={substance.id} substance={substance} onAdd={addSubstance} />
                ))}
                {!searchResults.length && <p className="muted small">Nicht in der App-Datenbank.</p>}
              </div>
              <OnlineSubstanceSearch
                query={query}
                rdkit={rdkit}
                localNames={searchResults.flatMap((substance) => [substance.name, ...substance.synonyms])}
                onAdd={addSubstance}
              />
            </>
          ) : (
            <>
              <div className="row" style={{ marginTop: 12, marginBottom: 10 }}>
                {SHELVES.map((shelf) => (
                  <button
                    key={shelf.id}
                    type="button"
                    className={`chip${openShelf === shelf.id ? ' active' : ''}`}
                    onClick={() => {
                      setOpenShelf(shelf.id);
                      setShelfExpanded(false);
                    }}
                  >
                    {shelf.label}
                  </button>
                ))}
              </div>
              <div className="bottle-grid">
                {(shelfExpanded ? shelfContents : shelfContents.slice(0, SHELF_PREVIEW)).map((substance) => (
                  <BottleButton key={substance.id} substance={substance} onAdd={addSubstance} />
                ))}
              </div>
              {shelfContents.length > SHELF_PREVIEW && (
                <button
                  type="button"
                  className="button button-secondary button-small"
                  style={{ marginTop: 10 }}
                  onClick={() => setShelfExpanded((value) => !value)}
                >
                  {shelfExpanded ? 'Weniger zeigen' : `Alle ${shelfContents.length} Stoffe zeigen`}
                </button>
              )}
            </>
          )}

          <h3 style={{ marginTop: 18 }}>Häufig gebraucht</h3>
          <div className="bottle-grid">
            {favourites.map((substance) => (
              <BottleButton key={substance.id} substance={substance} onAdd={addSubstance} />
            ))}
          </div>

          <h3 style={{ marginTop: 18 }}>🤖 Mit der KI ausprobieren</h3>
          <div className="row" style={{ gap: 6 }}>
            {AI_EXAMPLES.map((ids) => {
              const substances = ids.map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry));
              if (substances.length !== ids.length) return null;
              return (
                <button
                  key={ids.join('+')}
                  type="button"
                  className="chip chip-small"
                  onClick={() => {
                    setSelected(substances);
                    window.setTimeout(() => document.getElementById('reaktionsgefaess')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                  }}
                >
                  {substances.map((entry) => entry.name).join(' + ')}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------- Reaktionsgefäß ---------- */}
        <section className="stack">
          <div className="card" id="reaktionsgefaess">
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
                        <div className="subtle mono small">
                          {substance.formula}
                          {(() => {
                            const origin = substance.origin ? ORIGIN_LABELS[substance.origin] : undefined;
                            return origin ? (
                              <span className="badge tag-origin" title={origin.hint}>
                                {origin.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {(() => {
                          const state = stateAt(physicalProperties(rdkit, substance), temperatureC, pressureBar);
                          return (
                            <div className="small state-line" title={state.source === 'Joback-Schätzung' ? 'Schmelz- und Siedepunkt nach der Joback-Methode geschätzt' : undefined}>
                              <span aria-hidden="true">{STATE_ICONS[state.state]}</span> {state.text}
                            </div>
                          );
                        })()}
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

            <TemperatureControl id="temperatur-regler" value={temperatureC} onChange={setTemperature} />
            <PressureControl id="druck-regler" value={pressureBar} onChange={setPressure} />
            <CatalysisControl value={conditions.catalysis} onChange={(catalysis) => setConditions((c) => ({ ...c, catalysis }))} />

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

          {!running && result && result.outcome !== 'gesperrt' && selected.length > 0 && (
            <AiForecast result={result} substances={selected} modelStatus={aiStatus} temperatureC={temperatureC} pressureBar={pressureBar} />
          )}

          {!running && result?.notes && result.notes.length > 0 && (
            <Callout variant="neutral" title={`Bei ${formatTemperature(temperatureC)} und ${formatPressure(pressureBar)}`}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </Callout>
          )}

          {!running && result?.outcome === 'keine-reaktion' && (
            <div className="card">
              <h2>Keine chemische Reaktion</h2>
              {result.pairOutcomes?.length ? (
                <p className="muted" style={{ marginBottom: 8 }}>
                  Für diese Stoffe ist keine Reaktion hinterlegt oder belegt. Was stattdessen passiert, sagt die
                  Vorhersage unten.
                </p>
              ) : null}
              {result.hints.map((hint) => (
                <p key={hint} className="muted" style={{ marginBottom: 8 }}>
                  {hint}
                </p>
              ))}
            </div>
          )}

          {!running && result?.outcome === 'reaktion' && result.hints.length > 0 && (
            <Callout variant="info" title="Hinweise">
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
                temperatureC={temperatureC}
                onAddSubstance={addSubstance}
                onSetCatalysis={(catalysis) => setConditions((c) => ({ ...c, catalysis }))}
                onSetTemperature={setTemperature}
                onSetPressure={setPressure}
              />
            ))}

          {!running &&
            result?.outcome !== 'gesperrt' &&
            result?.pairOutcomes?.map((reaction) => (
              <ReactionResult
                key={reaction.id}
                reaction={reaction}
                rdkit={rdkit}
                rdkitReady={status === 'bereit'}
                onUseProduct={useProduct}
                temperatureC={temperatureC}
                onAddSubstance={addSubstance}
                onSetCatalysis={(catalysis) => setConditions((c) => ({ ...c, catalysis }))}
                onSetTemperature={setTemperature}
                onSetPressure={setPressure}
              />
            ))}

          {!running && result?.outcome !== 'gesperrt' && selected.length > 0 && (
            <AiSection
              ruleReactions={result?.outcome === 'reaktion' ? result.reactions.filter((reaction) => !reaction.missing.length) : []}
              shown={new Set((result?.reactions ?? []).flatMap((reaction) => (reaction.ai ? [reaction.ai.id] : [])))}
              results={aiResults}
              running={aiRunning}
              modelStatus={aiStatus}
              rdkit={rdkit}
              temperatureC={temperatureC}
              onAddSubstance={addSubstance}
              onSetCatalysis={(catalysis) => setConditions((c) => ({ ...c, catalysis }))}
              onSetTemperature={setTemperature}
            />
          )}

          {!running && suggestions.length > 0 && (
            <DocumentedPanel
              suggestions={suggestions}
              rdkit={rdkit}
              rdkitReady={status === 'bereit'}
              slotsLeft={MAX_SLOTS - selected.length}
              onAdd={(substances) => substances.forEach(addSubstance)}
            />
          )}

          <AiInfoPanel model={aiModel} status={aiStatus} />

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
      )}
    </main>
  );
}

interface ForecastLine {
  key: string;
  label: string;
  icon: string;
  text: string;
  detail?: string;
  target?: string;
}

/** Was die KI für ein Stoffpaar (oder einen einzelnen Stoff) vorhersagt – in einem Satz. */
function forecastFor(group: Substance[], result: MixResult, modelReady: boolean): ForecastLine {
  const label = group.map((entry) => entry.name).join(' + ');
  const key = group.map((entry) => entry.id).join('+');
  const involves = (reaction: WorkbenchReaction) => group.every((entry) => reaction.participants?.includes(entry.id));
  const reactions = result.reactions.filter(involves);
  const productText = (reaction: WorkbenchReaction) =>
    reaction.products
      .map((product) => product.name ?? product.formula)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
  const percentOf = (reaction: WorkbenchReaction) => Math.max(1, Math.round((reaction.ai?.confidence ?? 0) * 100));

  // 1. Das neuronale Netz sagt eine Reaktion voraus, die jetzt läuft (eigene oder bestätigte)
  const running = reactions.find((reaction) => reaction.ai && !reaction.missing.length);
  if (running) {
    const own = running.evidence === 'ki';
    return {
      key,
      label,
      icon: '🤖',
      text: `Es entsteht ${productText(running) || 'ein neues Produkt'} – ${running.ai?.title ?? running.reactionType}.`,
      detail: own
        ? `${running.reactor?.summary ?? ''} Sicherheit der KI: ${percentOf(running)} %.`
        : `Die KI bestätigt die ${running.evidence === 'belegt' ? 'belegte ' : ''}Reaktion der Werkbank (Sicherheit ${percentOf(running)} %).`,
      target: running.id,
    };
  }
  // 2. Die KI kennt eine Reaktion, aber unter diesen Bedingungen läuft sie nicht
  const waiting = reactions.find((reaction) => reaction.ai);
  if (waiting) {
    return {
      key,
      label,
      icon: '⏳',
      text: `Möglich wäre ${productText(waiting) || 'eine Reaktion'} (${waiting.ai?.title ?? waiting.reactionType}) – so passiert aber noch nichts.`,
      detail: `Dafür fehlt: ${waiting.missing.join('; ')}`,
      target: waiting.id,
    };
  }
  // 3. Das Netz hat nichts, die Regeln der Werkbank kennen die Reaktion
  const rule = reactions.find((reaction) => !reaction.missing.length);
  if (rule) {
    return {
      key,
      label,
      icon: '⚗',
      text: `${rule.title}: ${rule.observation}`,
      detail: modelReady
        ? 'Das neuronale Netz kennt vor allem organische Reaktionen; diese Vorhersage stammt aus den Regeln und Belegen der Werkbank.'
        : undefined,
      target: rule.id,
    };
  }
  const blocked = reactions[0];
  if (blocked) {
    return { key, label, icon: '⏳', text: `Möglich wäre: ${blocked.title} – so passiert aber noch nichts.`, detail: `Dafür fehlt: ${blocked.missing.join('; ')}`, target: blocked.id };
  }
  // 4. Keine chemische Reaktion: was stattdessen passiert
  const outcome = result.pairOutcomes?.find(involves);
  return {
    key,
    label,
    icon: '💧',
    text: outcome ? `Keine chemische Reaktion. ${outcome.observation}` : 'Keine chemische Reaktion erwartet.',
    target: outcome?.id,
  };
}

/** Oben im Ergebnis: Was die KI für jede Kombination im Gefäß vorhersagt. */
function AiForecast({
  result,
  substances,
  modelStatus,
  temperatureC,
  pressureBar,
}: {
  result: MixResult;
  substances: Substance[];
  modelStatus: 'laden' | 'bereit' | 'fehlt';
  temperatureC: number;
  pressureBar: number;
}) {
  const partners = substances.filter((substance) => substance.category !== 'Nachweisreagenz');
  const groups: Substance[][] = [];
  if (partners.length === 1) groups.push(partners);
  for (let i = 0; i < partners.length; i++) for (let j = i + 1; j < partners.length; j++) groups.push([partners[i], partners[j]]);
  const lines = groups.map((group) => forecastFor(group, result, modelStatus === 'bereit'));
  return (
    <section className="card ai-forecast" aria-live="polite">
      <h2 style={{ marginBottom: 4 }}>🤖 KI-Vorhersage: Was passiert?</h2>
      <p className="small subtle" style={{ marginTop: 0 }}>
        {modelStatus === 'bereit'
          ? `Das neuronale Netz rechnet bei ${formatTemperature(temperatureC)} und ${formatPressure(pressureBar)} mit – mit Katalysator, Wärme und Druck, die du einstellst.`
          : modelStatus === 'laden'
            ? 'Das neuronale Netz wird geladen (einmalig, danach offline) – gleich rechnet es mit.'
            : 'Das neuronale Netz ließ sich nicht laden; die Vorhersage stammt aus den Regeln der Werkbank.'}
      </p>
      <ul className="ai-forecast-list">
        {lines.map((line) => (
          <li key={line.key}>
            <span className="ai-forecast-icon" aria-hidden="true">
              {line.icon}
            </span>
            <div>
              {lines.length > 1 && <strong>{line.label}: </strong>}
              {line.text}
              {line.detail && <div className="small subtle">{line.detail}</div>}
              {line.target && (
                <button
                  type="button"
                  className="link-button small"
                  onClick={() => document.getElementById(`reaktion-${line.target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Einzelheiten ↓
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** KI-Vorschläge je Stoffpaar: immer eine Aussage, mit Katalysator, falls die Barriere zu hoch ist. */
function AiSection({
  ruleReactions,
  shown,
  results,
  running,
  modelStatus,
  rdkit,
  temperatureC,
  onAddSubstance,
  onSetCatalysis,
  onSetTemperature,
}: {
  ruleReactions: WorkbenchReaction[];
  /** Vorschläge, die schon als Reaktion der Werkbank oben stehen */
  shown: Set<string>;
  results: Array<{ key: string; substances: Substance[]; proposals: AiProposal[] }> | null;
  running: boolean;
  modelStatus: 'laden' | 'bereit' | 'fehlt';
  rdkit: MainModule | null;
  temperatureC: number;
  onAddSubstance: (substance: Substance) => void;
  onSetCatalysis: (catalysis: WorkbenchConditions['catalysis']) => void;
  onSetTemperature: (value: number) => void;
}) {
  const remaining = (results ?? [])
    .map((entry) => ({ ...entry, all: entry.proposals, proposals: entry.proposals.filter((proposal) => !shown.has(proposal.id)) }))
    // Paare, deren Vorschläge schon alle oben als Reaktion stehen, nicht wiederholen
    .filter((entry) => entry.proposals.length || !entry.all.length);
  if (!running && modelStatus !== 'laden' && results && !remaining.length) return null;
  return (
    <section className="stack">
      <h2 style={{ margin: 0 }}>🤖 Weitere Ideen der Reaktions-KI</h2>
      <p className="small subtle" style={{ margin: 0 }}>
        Die sicheren Vorhersagen des neuronalen Netzes stehen oben als Reaktionen (<EvidenceBadge evidence="ki" />). Hier
        folgen weitere Möglichkeiten und Verfahren aus der Katalyse-Wissensbasis – jeweils mit dem nötigen Katalysator, falls
        die Aktivierungsenergie bei {Math.round(temperatureC)} °C zu hoch ist. Alles hier ist Vorhersage.
      </p>
      {(running || modelStatus === 'laden') && (
        <div className="row">
          <span className="spinner" /> <span className="muted">{modelStatus === 'laden' ? 'KI-Modell wird geladen …' : 'Die KI rechnet …'}</span>
        </div>
      )}
      {!running &&
        remaining.map(({ key, substances, proposals }) => {
          const [best, ...rest] = proposals;
          const label = substances.map((entry) => entry.name).join(' + ');
          return (
            <div key={key} className="ai-pair">
              {remaining.length > 1 && <h3 style={{ margin: '4px 0 8px' }}>{label}</h3>}
              {!best && ruleMatch(ruleReactions, substances) ? (
                <Callout variant="success" title={`${label}: ${ruleMatch(ruleReactions, substances)?.reactionType ?? 'Reaktion bekannt'}`}>
                  <p style={{ margin: 0 }}>
                    Diese Reaktion kennen schon die Regeln der Werkbank (oben).{' '}
                    {ruleMatch(ruleReactions, substances)?.kind === 'anorganisch'
                      ? 'Reaktionen zwischen Ionen in Lösung – Neutralisation, Fällung, Gasentwicklung – haben praktisch keine Aktivierungsenergie: Sie laufen sofort ab, ein Katalysator ist nicht nötig.'
                      : 'Die KI hat dazu nichts Zusätzliches vorzuschlagen.'}
                  </p>
                </Callout>
              ) : best ? (
                <AiProposalCard
                  proposal={best}
                  rdkit={rdkit}
                  temperatureC={temperatureC}
                  onAddSubstance={onAddSubstance}
                  onSetCatalysis={onSetCatalysis}
                  onSetTemperature={onSetTemperature}
                  compact
                />
              ) : (
                <Callout variant="info" title={`${label}: kein Reaktionsvorschlag`}>
                  <p style={{ margin: 0 }}>
                    {modelStatus === 'fehlt'
                      ? 'Das KI-Modell ist nicht geladen; die Wissensbasis kennt für diese Stoffe keine katalysierte Reaktion.'
                      : 'Weder das neuronale Netz noch die Katalyse-Wissensbasis kennen eine Umsetzung dieser Stoffe. Ein Katalysator hilft hier nicht – er beschleunigt nur Reaktionen, die grundsätzlich möglich sind.'}
                  </p>
                </Callout>
              )}
              {rest.length > 0 && (
                <details className="ai-more">
                  <summary>Weitere Vorschläge ({rest.length})</summary>
                  <div className="stack" style={{ marginTop: 8 }}>
                    {rest.map((proposal) => (
                      <AiProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        rdkit={rdkit}
                        temperatureC={temperatureC}
                        onAddSubstance={onAddSubstance}
                        onSetCatalysis={onSetCatalysis}
                        onSetTemperature={onSetTemperature}
                        compact
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
    </section>
  );
}

/** Regelreaktion, an der beide Stoffe beteiligt sind. */
function ruleMatch(reactions: WorkbenchReaction[], substances: Substance[]): WorkbenchReaction | undefined {
  return reactions.find((reaction) => substances.every((substance) => reaction.participants?.includes(substance.id)));
}

/** Kennung aus der Adresse: Datenbank-ID, pubchem-CID oder smiles:… */
async function resolveSubstanceId(rdkit: MainModule | null, id: string): Promise<Substance | null> {
  const local = substanceById(id);
  if (local) return local;
  if (!rdkit) return null;
  if (id.startsWith('smiles:')) {
    const result = substanceFromSmiles(rdkit, id.slice('smiles:'.length));
    return result.ok ? result.substance : null;
  }
  const cid = id.match(/^pubchem-(\d+)$/)?.[1];
  if (cid) {
    const compound = await compoundByCid(Number(cid));
    const result = compound ? substanceFromCompound(rdkit, compound) : null;
    return result?.ok ? result.substance : null;
  }
  return null;
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
  temperatureC,
  onAddSubstance,
  onSetCatalysis,
  onSetTemperature,
  onSetPressure,
}: {
  reaction: WorkbenchReaction;
  rdkit: ReturnType<typeof useRDKit>['rdkit'];
  rdkitReady: boolean;
  onUseProduct: (product: WorkbenchProduct) => void;
  temperatureC: number;
  onAddSubstance: (substance: Substance) => void;
  onSetCatalysis: (catalysis: WorkbenchConditions['catalysis']) => void;
  onSetTemperature: (value: number) => void;
  onSetPressure: (value: number) => void;
}) {
  const confirmed = reaction.evidence !== 'ki' && reaction.ai;
  return (
    <article className="card reaction-result" id={`reaktion-${reaction.id}`}>
      <div className="card-title">
        <div>
          <h2 style={{ marginBottom: 2 }}>{reaction.title}</h2>
          <div className="subtle">{reaction.reactionType}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <EvidenceBadge evidence={reaction.evidence} count={reaction.documented?.count} />
          {confirmed && reaction.ai && (
            <span className="badge badge-ai" title="Die Reaktions-KI sagt dasselbe Produkt voraus">
              🤖 KI bestätigt · {Math.max(1, Math.round(reaction.ai.confidence * 100))} %
            </span>
          )}
          {reaction.catalysisMatched && <span className="badge badge-success">passende Katalyse</span>}
          {reaction.confidence && (
            <span className={`badge badge-${reaction.confidence === 'hoch' ? 'success' : reaction.confidence === 'mittel' ? 'warning' : 'danger'}`} title="Verlässlichkeit der Vorhersage">
              Verlässlichkeit: {reaction.confidence}
            </span>
          )}
          <span className={`badge badge-${reaction.kind === 'physikalisch' ? 'technisch' : reaction.kind}`}>
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

      <EnthalpyPanel enthalpy={reaction.enthalpy} missing={reaction.enthalpyMissing} />

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

      {reaction.complex && (
        <div style={{ marginTop: 12 }}>
          <ComplexDetails complex={reaction.complex} compact />
        </div>
      )}

      {reaction.explanation !== reaction.evidenceNote && <p style={{ marginTop: 12 }}>{reaction.explanation}</p>}

      {reaction.reactor && reaction.ai && (
        <ReactorVerdict
          reaction={reaction}
          onSetCatalysis={onSetCatalysis}
          onSetTemperature={onSetTemperature}
          onSetPressure={onSetPressure}
        />
      )}

      <Callout
        variant={EVIDENCE_VARIANT[reaction.evidence]}
        icon={reaction.evidence === 'ki' ? '🤖' : undefined}
        title={reaction.evidence === 'vorhersage' ? 'Nur eine Vorhersage' : reaction.evidence === 'ki' ? 'Vorhersage der Reaktions-KI' : EVIDENCE_LABELS[reaction.evidence]}
      >
        <p style={{ margin: 0 }}>{reaction.evidenceNote}</p>
        {confirmed && reaction.ai && (
          <p style={{ margin: '6px 0 0' }}>
            🤖 Die Reaktions-KI kommt zum selben Produkt ({reaction.ai.title}, Sicherheit{' '}
            {Math.max(1, Math.round(reaction.ai.confidence * 100))} %).
          </p>
        )}
      </Callout>

      {reaction.evidence === 'ki' && reaction.ai && (
        <details className="ai-more" style={{ marginTop: 8 }}>
          <summary>Katalysator, Energieprofil und Vorbild der KI</summary>
          <div style={{ marginTop: 8 }}>
            <AiProposalCard
              proposal={reaction.ai}
              rdkit={rdkit}
              temperatureC={temperatureC}
              onAddSubstance={onAddSubstance}
              onSetCatalysis={onSetCatalysis}
              onSetTemperature={onSetTemperature}
              compact
            />
          </div>
        </details>
      )}

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
            Im Komplex-Baukasten bearbeiten
          </Link>
        )}
      </div>
    </article>
  );
}

const EVIDENCE_VARIANT: Record<Evidence, 'success' | 'info' | 'warning'> = {
  belegt: 'success',
  lehrbuch: 'info',
  ki: 'info',
  vorhersage: 'warning',
};

const EVIDENCE_ICONS: Record<Evidence, string> = { belegt: '✓', lehrbuch: '📘', ki: '🤖', vorhersage: '≈' };

const VERDICT_TEXT: Record<StepVerdict, { icon: string; title: string; variant: 'success' | 'warning' | 'danger' }> = {
  läuft: { icon: '✅', title: 'Im Reaktor: läuft', variant: 'success' },
  langsam: { icon: '🐢', title: 'Im Reaktor: zu langsam', variant: 'warning' },
  blockiert: { icon: '⛔', title: 'Im Reaktor: blockiert', variant: 'danger' },
  problem: { icon: '⚠️', title: 'Im Reaktor: Problem', variant: 'warning' },
};

/** Bewertung einer KI-Reaktion bei Temperatur, Druck und Katalysator – mit der Empfehlung der KI zum Übernehmen */
function ReactorVerdict({
  reaction,
  onSetCatalysis,
  onSetTemperature,
  onSetPressure,
}: {
  reaction: WorkbenchReaction;
  onSetCatalysis: (catalysis: WorkbenchConditions['catalysis']) => void;
  onSetTemperature: (value: number) => void;
  onSetPressure: (value: number) => void;
}) {
  const evaluation = reaction.reactor as StepEvaluation;
  const proposal = reaction.ai as AiProposal;
  const { recommended } = evaluation;
  const helper = proposal.catalysts.find((entry) => entry.category === recommended.catalyst);
  const text = VERDICT_TEXT[evaluation.verdict];
  const apply = (): void => {
    onSetTemperature(recommended.temperatureC);
    onSetPressure(recommended.pressureBar);
    if (helper?.catalysis) onSetCatalysis(helper.catalysis);
  };
  const needsCatalyst = helper && !helper.present && !helper.catalysis;
  return (
    <Callout variant={text.variant} icon={text.icon} title={text.title}>
      <p style={{ margin: 0 }}>{evaluation.summary}</p>
      {evaluation.notes.length > 0 && (
        <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {evaluation.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {evaluation.verdict !== 'läuft' && (
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="button button-small" onClick={apply}>
            Empfehlung einstellen: {Math.round(recommended.temperatureC)} °C,{' '}
            {recommended.pressureBar.toLocaleString('de-DE', { maximumFractionDigits: 1 })} bar
            {helper?.catalysis ? `, ${helper.label}` : ''}
          </button>
          {needsCatalyst && (
            <span className="small muted">Dazu {helper.label} ins Gefäß geben (Details unten).</span>
          )}
        </div>
      )}
    </Callout>
  );
}

function EvidenceBadge({ evidence, count }: { evidence: Evidence; count?: number }) {
  const title =
    evidence === 'belegt'
      ? 'In der Patentliteratur beschrieben'
      : evidence === 'lehrbuch'
        ? 'Fest hinterlegte Standardreaktion'
        : evidence === 'ki'
          ? 'Vom neuronalen Netz vorhergesagt – nicht einzeln belegt'
          : 'Berechnet – nicht einzeln belegt';
  const variant = evidence === 'ki' ? 'ai' : EVIDENCE_VARIANT[evidence] === 'info' ? 'analytik' : EVIDENCE_VARIANT[evidence];
  return (
    <span className={`badge badge-${variant}`} title={title}>
      <span aria-hidden="true">{EVIDENCE_ICONS[evidence]}</span> {EVIDENCE_LABELS[evidence]}
      {count && count > 1 ? ` (${count}×)` : ''}
    </span>
  );
}

function EvidenceSummary({ reactions }: { reactions: WorkbenchReaction[] }) {
  const complete = reactions.filter((reaction) => !reaction.missing.length);
  const count = (evidence: Evidence) => complete.filter((reaction) => reaction.evidence === evidence).length;
  const predictedOnly = complete.length > 0 && complete.every((reaction) => reaction.evidence === 'vorhersage' || reaction.evidence === 'ki');
  const confirmed = complete.filter((reaction) => reaction.evidence !== 'ki' && reaction.ai).length;
  if (!complete.length) return null;
  return (
    <Callout variant={predictedOnly ? 'warning' : 'neutral'} title={predictedOnly ? 'Hinweis: nur Vorhersagen' : 'Herkunft der Ergebnisse'}>
      <p style={{ margin: 0 }}>
        {predictedOnly
          ? 'Für diese Mischung ist keine Reaktion belegt. Die Ergebnisse unten sind von der Reaktions-KI, aus Regeln und Reaktionsvorlagen berechnet – chemisch plausibel, aber nicht experimentell für genau diese Stoffe nachgewiesen.'
          : `${count('belegt')} belegt, ${count('lehrbuch')} Lehrbuchreaktion${count('lehrbuch') === 1 ? '' : 'en'}, ${count('ki')} KI-Vorhersage${count('ki') === 1 ? '' : 'n'}, ${count('vorhersage')} Vorhersage${count('vorhersage') === 1 ? '' : 'n'}.`}
        {confirmed > 0 && ` Bei ${confirmed === 1 ? 'einer Reaktion' : `${confirmed} Reaktionen`} kommt die Reaktions-KI zum selben Produkt.`}
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
