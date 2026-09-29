import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MainModule } from '@rdkit/rdkit';
import type { ReactionModel } from '../chem/ai/model';
import type { CatalystSuggestion } from '../chem/ai/reactionAI';
import { extendRoutes, planSynthesis, type RetroResult, type RetroRoute, type RetroStep } from '../chem/ai/retrosynthesis';
import {
  evaluateStep,
  recommendedCatalyst,
  stepHelpers,
  worstVerdict,
  type StepConditions,
  type StepEvaluation,
  type StepVerdict,
} from '../chem/ai/synthesisConditions';
import { formatSigned } from '../chem/format';
import { formatPressure, formatTemperature } from '../chem/workbench';
import { loadCatalog, routesTo, type Synthesis } from '../data/catalog';
import { substanceById } from '../data/substances';
import type { Substance } from '../data/types';
import type { Catalysis } from '../data/workbenchSpecs';
import { AiProposalCard } from './AiProposalCard';
import { Callout } from './Callout';
import { MoleculeStructure } from './MoleculeStructure';
import { PressureControl, TemperatureControl } from './ReactorControls';
import { SubstancePicker } from './SubstancePicker';

interface Props {
  rdkit: MainModule | null;
  model: ReactionModel | null;
  modelStatus: 'laden' | 'bereit' | 'fehlt';
  /** Temperatur und Druck des Reaktors – dieselben wie beim Mischen */
  temperatureC: number;
  pressureBar: number;
  onSetTemperature: (temperatureC: number) => void;
  onSetPressure: (pressureBar: number) => void;
  /** Zielstoff aus der Adresse (#/werkbank?ziel=…) */
  initialTarget?: Substance | null;
  /** Stufe ansetzen: Stoffe ins Gefäß, Katalyse, Temperatur und Druck einstellen */
  onSetUp: (substances: Substance[], catalysis: Catalysis | null, temperatureC: number, pressureBar: number) => void;
  onAddSubstance: (substance: Substance) => void;
  onSetCatalysis: (catalysis: Catalysis) => void;
}

type CatalystMode = 'empfehlung' | 'ohne';

const percent = (value: number) => `${Math.round(value * 100)} %`;

const ROLE_ICONS: Record<string, string> = {
  Katalysator: '⚙', Säure: 'H⁺', Base: 'OH⁻', Aktivierungsreagenz: '⚡', Reduktionsmittel: '↓e⁻', Oxidationsmittel: '↑e⁻', Halogenierungsmittel: 'X', Reagenz: '•',
};

const VERDICT: Record<StepVerdict, { icon: string; label: string; variant: 'success' | 'warning' | 'danger' }> = {
  läuft: { icon: '✅', label: 'läuft', variant: 'success' },
  langsam: { icon: '🐢', label: 'zu langsam', variant: 'warning' },
  problem: { icon: '⚠', label: 'Problem', variant: 'danger' },
  blockiert: { icon: '⛔', label: 'braucht Katalysator', variant: 'danger' },
};

const HYDROGENATION = new Set(['pd', 'pt', 'ni', 'edelmetall']);

/** Stoff der Datenbank zu einem Hilfsstoff-Vorschlag */
function substanceFor(entry: CatalystSuggestion | undefined): Substance | null {
  return entry?.substanceIds.map((id) => substanceById(id)).find((found): found is Substance => Boolean(found)) ?? null;
}

/**
 * KI-Synthese als Bereich der Werkbank: Zielstoff wählen, die Reaktions-KI
 * plant rückwärts, und jede Stufe wird unter den eingestellten Bedingungen
 * bewertet – Temperatur, Druck und Katalysator wie beim Mischen.
 */
export function SynthesisPlanner(props: Props) {
  const { rdkit, model, modelStatus, temperatureC, pressureBar, onSetTemperature, onSetPressure, initialTarget } = props;
  const [target, setTarget] = useState<Substance | null>(initialTarget ?? null);
  const [result, setResult] = useState<{ targetId: string; data: RetroResult } | null>(null);
  const [running, setRunning] = useState(false);
  const [catalog, setCatalog] = useState<Synthesis[]>([]);
  const [catalystMode, setCatalystMode] = useState<CatalystMode>('empfehlung');
  const [choices, setChoices] = useState<Record<string, string | null>>({});
  const [onlyRunning, setOnlyRunning] = useState(false);

  useEffect(() => {
    if (initialTarget) setTarget(initialTarget);
  }, [initialTarget]);

  useEffect(() => {
    let cancelled = false;
    loadCatalog().then((entries) => {
      if (!cancelled) setCatalog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const plan = (): void => {
    if (!rdkit || !model || !target) return;
    setRunning(true);
    setResult(null);
    setChoices({});
    const options = { temperatureC, limit: 4 };
    // Erst die Wartemeldung zeichnen, dann rechnen (die Planung braucht einige Sekunden)
    window.setTimeout(() => {
      let first: RetroResult;
      try {
        first = planSynthesis(rdkit, model, target, { ...options, depth: 1 });
        first = { ...first, pending: first.routes.some((route) => !route.allAvailable) };
        setResult({ targetId: target.id, data: first });
      } finally {
        setRunning(false);
      }
      if (first.pending) {
        window.setTimeout(() => {
          const extended = extendRoutes(rdkit, model, first, options);
          setResult((current) => (current && current.targetId === target.id ? { targetId: target.id, data: extended } : current));
        }, 60);
      }
    }, 60);
  };

  // Adresse mit Zielstoff: gleich planen
  useEffect(() => {
    if (initialTarget && rdkit && model && result?.targetId !== initialTarget.id && !running) plan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTarget, rdkit, model]);

  const current = result && target && result.targetId === target.id ? result.data : null;

  /** Gewählter Hilfsstoff einer Stufe */
  const choiceFor = (key: string, step: RetroStep): string | null => {
    if (key in choices) return choices[key];
    return catalystMode === 'ohne' ? null : recommendedCatalyst(step);
  };

  // Bewertung aller Stufen unter den eingestellten Bedingungen
  const evaluated = useMemo(() => {
    if (!current) return [];
    return current.routes.map((route) => {
      const steps = route.steps.map((step, index) => {
        const key = `${route.id}-${index}`;
        const conditions: StepConditions = { temperatureC, pressureBar, catalyst: choiceFor(key, step) };
        return { key, step, conditions, evaluation: evaluateStep(rdkit, step, conditions) };
      });
      return { route, steps, verdict: worstVerdict(steps.map((entry) => entry.evaluation.verdict)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, temperatureC, pressureBar, choices, catalystMode, rdkit]);
  const shown = onlyRunning ? evaluated.filter((entry) => entry.verdict === 'läuft') : evaluated;

  /** Bedingungen der KI für einen ganzen Weg übernehmen (höchste nötige Temperatur und Druck) */
  const adopt = (entries: typeof evaluated[number]['steps']): void => {
    const temperature = Math.max(...entries.map((entry) => entry.evaluation.recommended.temperatureC));
    const pressure = Math.max(...entries.map((entry) => entry.evaluation.recommended.pressureBar));
    onSetTemperature(temperature);
    onSetPressure(pressure);
    setChoices((currentChoices) => {
      const next = { ...currentChoices };
      for (const entry of entries) next[entry.key] = entry.evaluation.recommended.catalyst;
      return next;
    });
  };

  const textbook = target && substanceById(target.id) ? routesTo(catalog, target.id) : [];

  return (
    <div className="workbench synthesis">
      {/* ---------- Zielstoff und Reaktor ---------- */}
      <section className="card">
        <h2>🎯 Zielstoff</h2>
        <p className="small subtle" style={{ marginTop: 0 }}>
          Was soll entstehen? Die Reaktions-KI wendet ihre gelernten Vorlagen rückwärts an, prüft jeden Vorschlag vorwärts
          nach und plant bis zu zwei Stufen.
        </p>
        <SubstancePicker
          label="Zielstoff"
          value={target}
          onChange={(value) => {
            setTarget(value);
            setResult(null);
          }}
          rdkit={rdkit}
          placeholder="z. B. Aspirin, Paracetamol, Zimtsäure oder SMILES"
        />
        <button type="button" className="button" style={{ marginTop: 10, width: '100%' }} disabled={!target || !rdkit || !model || running} onClick={plan}>
          {running ? 'Plant …' : 'KI-Synthese planen'}
        </button>
        {modelStatus === 'laden' && <p className="small muted">KI-Modell wird geladen …</p>}

        <h2 style={{ marginTop: 20 }}>⚗ Reaktor</h2>
        <p className="small subtle" style={{ marginTop: 0 }}>
          Dieselben Regler wie beim Mischen. Jede Stufe wird sofort unter diesen Bedingungen bewertet.
        </p>
        <TemperatureControl id="synthese-temperatur" value={temperatureC} onChange={onSetTemperature} />
        <PressureControl id="synthese-druck" value={pressureBar} onChange={onSetPressure} />

        <h3 style={{ marginTop: 14 }}>Katalysatoren</h3>
        <div className="row" role="radiogroup" aria-label="Katalysatoren für alle Stufen">
          {([
            ['empfehlung', '⚙ KI-Empfehlung', 'Je Stufe den Katalysator, den die KI vorschlägt'],
            ['ohne', '○ Ohne Katalysator', 'Alle Stufen ohne Katalysator oder Hilfsstoff'],
          ] as Array<[CatalystMode, string, string]>).map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={catalystMode === id}
              className={`chip${catalystMode === id ? ' active' : ''}`}
              title={hint}
              onClick={() => {
                setCatalystMode(id);
                setChoices({});
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="small subtle" style={{ marginBottom: 0 }}>Bei jeder Stufe lässt sich der Katalysator einzeln umstellen.</p>

        <h3 style={{ marginTop: 14 }}>Anzeige</h3>
        <label className="row small" style={{ gap: 8 }}>
          <input type="checkbox" checked={onlyRunning} onChange={(event) => setOnlyRunning(event.target.checked)} />
          Nur Wege zeigen, die bei {formatTemperature(temperatureC)} und {formatPressure(pressureBar)} laufen
        </label>
      </section>

      {/* ---------- Wege ---------- */}
      <section className="stack">
        {!current && !running && (
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              Wähle links einen Zielstoff und tippe auf «KI-Synthese planen». Mit den Reglern stellst du Temperatur, Druck und
              Katalysatoren ein – die Wege zeigen sofort, ob und wie schnell jede Stufe dann abläuft.
            </p>
          </div>
        )}
        {modelStatus === 'fehlt' && (
          <Callout variant="warning" title="KI-Modell nicht verfügbar">
            <p style={{ margin: 0 }}>Ohne das Modell kann die App keine Synthese planen.</p>
          </Callout>
        )}
        {running && (
          <div className="card row">
            <span className="spinner" /> <span className="muted">Die KI zerlegt den Zielstoff und prüft die Wege …</span>
          </div>
        )}
        {current?.blocked && (
          <Callout variant="danger" title="Keine Synthese">
            <p style={{ margin: 0 }}>{current.blocked}</p>
          </Callout>
        )}
        {current && !current.blocked && current.routes.length === 0 && (
          <Callout variant="info" title="Kein Weg gefunden">
            <p style={{ margin: 0 }}>
              Die gelernten Vorlagen liefern {current.candidates} mögliche Zerlegungen, aber keine hat die Vorwärtsprüfung bestanden.
              Für ungewöhnliche Moleküle kennt die KI oft keinen sicheren Weg.
            </p>
          </Callout>
        )}
        {shown.map((entry) => (
          <RouteCard
            key={entry.route.id}
            index={evaluated.indexOf(entry)}
            route={entry.route}
            verdict={entry.verdict}
            steps={entry.steps}
            onChoose={(key, value) => setChoices((currentChoices) => ({ ...currentChoices, [key]: value }))}
            onAdopt={() => adopt(entry.steps)}
            {...props}
          />
        ))}
        {current && onlyRunning && shown.length < evaluated.length && (
          <p className="small muted" style={{ margin: 0 }}>
            {evaluated.length - shown.length} {evaluated.length - shown.length === 1 ? 'Weg läuft' : 'Wege laufen'} bei diesen Bedingungen
            nicht und {evaluated.length - shown.length === 1 ? 'ist' : 'sind'} ausgeblendet.
          </p>
        )}
        {current?.pending && (
          <div className="row small">
            <span className="spinner" /> <span className="muted">Suche Vorstufen für Ausgangsstoffe, die nicht im Schrank stehen …</span>
          </div>
        )}
        {current && !current.blocked && (
          <p className="small subtle" style={{ margin: 0 }}>
            {current.candidates} Zerlegungen geprüft. Alles hier ist Vorhersage der KI; Geschwindigkeiten sind Richtwerte nach
            Arrhenius (± eine Größenordnung). Ausbeute, Nebenprodukte und Schutzgruppen sind nicht berücksichtigt.
          </p>
        )}

        {target && textbook.length > 0 && (
          <details className="card small">
            <summary>Lehrbuchwege aus dem Synthesekatalog ({textbook.length})</summary>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
              {textbook.slice(0, 3).map((entry) => (
                <li key={entry.id} className="catalyst-item">
                  <div className="row-between" style={{ gap: 6 }}>
                    <strong>{entry.ruleName}</strong>
                    <span className="subtle">{entry.reactionType}</span>
                  </div>
                  <div className="mono small" style={{ overflowWrap: 'anywhere' }}>{entry.equation}</div>
                  <div className="small subtle">{entry.conditions}</div>
                  {entry.educts.length > 0 && (
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      style={{ marginTop: 6 }}
                      onClick={() => props.onSetUp(entry.educts, null, temperatureC, pressureBar)}
                    >
                      ⚗ {entry.educts.map((educt) => educt.name).join(' + ')} ins Gefäß
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <Link to={`/stoff?name=${encodeURIComponent(target.name)}`} className="small">
              Alle Wege auf der Stoffseite
            </Link>
          </details>
        )}
      </section>
    </div>
  );
}

interface EvaluatedStep {
  key: string;
  step: RetroStep;
  conditions: StepConditions;
  evaluation: StepEvaluation;
}

function RouteCard({
  route,
  index,
  verdict,
  steps,
  onChoose,
  onAdopt,
  ...props
}: Props & {
  route: RetroRoute;
  index: number;
  verdict: StepVerdict;
  steps: EvaluatedStep[];
  onChoose: (key: string, value: string | null) => void;
  onAdopt: () => void;
}) {
  const stages = route.steps.length;
  const look = VERDICT[verdict];
  return (
    <article className="card route-card">
      <div className="row-between" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>
          Weg {index + 1} · {stages === 1 ? '1 Stufe' : `${stages} Stufen`}
        </h3>
        <div className="row" style={{ gap: 6 }}>
          <span className={`badge badge-${look.variant}`} title="Bei den eingestellten Bedingungen">
            {look.icon} {look.label}
          </span>
          <span className={`badge badge-${route.confidence >= 0.6 ? 'success' : route.confidence >= 0.3 ? 'warning' : 'danger'}`} title="Wie sicher sich die KI ist (alle Stufen zusammen)">
            Sicherheit {percent(route.confidence)}
          </span>
          {route.allAvailable ? (
            <span className="badge badge-success" title="Alle Ausgangsstoffe stehen im Chemikalienschrank">vorrätig</span>
          ) : (
            <span className="badge badge-warning" title="Mindestens ein Ausgangsstoff steht nicht in der Stoffdatenbank">Ausgangsstoff fehlt</span>
          )}
        </div>
      </div>
      <ol className="route-steps">
        {steps.map((entry, stepIndex) => (
          <StepItem key={entry.key} entry={entry} number={stepIndex + 1} onChoose={(value) => onChoose(entry.key, value)} {...props} />
        ))}
      </ol>
      {verdict !== 'läuft' && (
        <button type="button" className="button button-secondary button-small" onClick={onAdopt}>
          🎛 Bedingungen der KI für diesen Weg übernehmen
        </button>
      )}
    </article>
  );
}

function StepItem({
  entry,
  number,
  onChoose,
  rdkit,
  temperatureC,
  pressureBar,
  onSetUp,
  onAddSubstance,
  onSetCatalysis,
  onSetTemperature,
  onSetPressure,
}: Props & { entry: EvaluatedStep; number: number; onChoose: (value: string | null) => void }) {
  const { step, conditions, evaluation } = entry;
  const helpers = stepHelpers(step);
  const chosen = helpers.find((helper) => helper.category === conditions.catalyst);
  const recommended = helpers.find((helper) => helper.category === evaluation.recommended.catalyst);
  const look = VERDICT[evaluation.verdict];

  const setUp = () => {
    const substances = step.precursors.map((precursor) => precursor.substance);
    const catalystSubstance = substanceFor(chosen);
    if (catalystSubstance) substances.push(catalystSubstance);
    // Hydrierung: Wasserstoff dazu
    const hydrogen = substanceById('wasserstoff');
    if (chosen && HYDROGENATION.has(chosen.category) && helpers.some((helper) => helper.category === 'wasserstoff') && hydrogen) substances.push(hydrogen);
    onSetUp(substances, chosen?.catalysis ?? null, temperatureC, pressureBar);
  };

  return (
    <li className="route-step">
      <div className="small subtle">Stufe {number} · {step.proposal.title}</div>
      <div className="route-equation">
        {step.precursors.map((precursor, index) => (
          <span key={precursor.smiles} className="route-molecule">
            {index > 0 && <span className="route-plus" aria-hidden="true">+</span>}
            <figure>
              {rdkit && <MoleculeStructure rdkit={rdkit} smiles={precursor.smiles} width={120} height={84} fallback={precursor.smiles} />}
              <figcaption className="small">
                {precursor.name}
                {!precursor.available && <span className="subtle" title="nicht im Chemikalienschrank"> *</span>}
              </figcaption>
            </figure>
          </span>
        ))}
        <span className="route-arrow" aria-hidden="true">→</span>
        <span className="route-molecule">
          <figure>
            {rdkit && step.product.smiles && <MoleculeStructure rdkit={rdkit} smiles={step.product.smiles} width={120} height={84} fallback={step.product.smiles} />}
            <figcaption className="small">
              <strong>{step.product.name}</strong>
            </figcaption>
          </figure>
        </span>
      </div>

      <div className="small" style={{ marginTop: 4 }}>Katalysator / Hilfsstoff:</div>
      <div className="row" role="radiogroup" aria-label={`Katalysator für Stufe ${number}`} style={{ gap: 6, marginTop: 4 }}>
        {helpers.slice(0, 5).map((helper) => (
          <button
            key={helper.category}
            type="button"
            role="radio"
            aria-checked={conditions.catalyst === helper.category}
            className={`chip chip-small${conditions.catalyst === helper.category ? ' active' : ''}`}
            title={`${helper.role}: ${helper.purpose}${helper.examples.length ? ` – z. B. ${helper.examples.slice(0, 2).join(', ')}` : ''}`}
            onClick={() => onChoose(helper.category)}
          >
            <span aria-hidden="true">{ROLE_ICONS[helper.role] ?? '•'}</span> {helper.label}
            {helper.category === evaluation.recommended.catalyst && ' ★'}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={conditions.catalyst === null}
          className={`chip chip-small${conditions.catalyst === null ? ' active' : ''}`}
          onClick={() => onChoose(null)}
        >
          ○ ohne
        </button>
      </div>

      <div className={`step-verdict step-verdict-${look.variant}`}>
        <strong>
          {look.icon} {evaluation.summary}
        </strong>
        {(evaluation.notes.length > 0 || evaluation.problems.length > 1) && (
          <ul>
            {[...evaluation.problems.slice(1), ...evaluation.notes].map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        <div className="small subtle">
          KI-Empfehlung: {formatTemperature(evaluation.recommended.temperatureC)} · {formatPressure(evaluation.recommended.pressureBar)}
          {recommended ? ` · ${recommended.label}` : ' · ohne Katalysator'}
          {step.proposal.enthalpy && <> · ΔrH° ≈ {formatSigned(step.proposal.enthalpy.deltaH, 0).replace(/^-/, '−')} kJ/mol</>}
          {' '}· Sicherheit {percent(step.confidence)}
        </div>
      </div>

      <div className="row" style={{ gap: 6, marginTop: 6 }}>
        <button type="button" className="button button-small" onClick={setUp}>
          ⚗ Stufe {number} im Gefäß ansetzen
        </button>
        {(evaluation.recommended.temperatureC !== temperatureC ||
          Math.abs(evaluation.recommended.pressureBar - pressureBar) > 0.05 ||
          evaluation.recommended.catalyst !== conditions.catalyst) && (
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => {
              onSetTemperature(evaluation.recommended.temperatureC);
              onSetPressure(evaluation.recommended.pressureBar);
              onChoose(evaluation.recommended.catalyst);
            }}
          >
            🎛 Empfehlung einstellen
          </button>
        )}
        <details className="small route-details">
          <summary>Energiediagramm und alle Hilfsstoffe</summary>
          <AiProposalCard
            proposal={step.proposal}
            rdkit={rdkit}
            temperatureC={temperatureC}
            onAddSubstance={onAddSubstance}
            onSetCatalysis={onSetCatalysis}
            onSetTemperature={onSetTemperature}
            compact
          />
        </details>
      </div>
    </li>
  );
}
