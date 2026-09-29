import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MainModule } from '@rdkit/rdkit';
import type { ReactionModel } from '../chem/ai/model';
import { extendRoutes, planSynthesis, type RetroResult, type RetroRoute, type RetroStep } from '../chem/ai/retrosynthesis';
import { formatSigned } from '../chem/format';
import { loadCatalog, routesTo, type Synthesis } from '../data/catalog';
import { substanceById } from '../data/substances';
import type { Substance } from '../data/types';
import type { Catalysis } from '../data/workbenchSpecs';
import { AiProposalCard } from './AiProposalCard';
import { Callout } from './Callout';
import { MoleculeStructure } from './MoleculeStructure';
import { SubstancePicker } from './SubstancePicker';

interface Props {
  rdkit: MainModule | null;
  model: ReactionModel | null;
  modelStatus: 'laden' | 'bereit' | 'fehlt';
  temperatureC: number;
  /** Zielstoff aus der Adresse (#/werkbank?ziel=…) */
  initialTarget?: Substance | null;
  /** Stufe ansetzen: Stoffe ins Gefäß, Katalyse und Temperatur einstellen */
  onSetUp: (substances: Substance[], catalysis: Catalysis | null, temperatureC: number | null) => void;
  onAddSubstance: (substance: Substance) => void;
  onSetCatalysis: (catalysis: Catalysis) => void;
  onSetTemperature: (temperatureC: number) => void;
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

/** Temperatur, bei der die Stufe zügig läuft (mit dem vorgeschlagenen Katalysator), auf 10 °C gerundet. */
function stepTemperature(step: RetroStep): number | null {
  const energy = step.proposal.energy;
  if (!energy) return null;
  const value = energy.catalyzed ? energy.temperatureCatalyzed : energy.temperatureUncatalyzed;
  if (value === null || !Number.isFinite(value)) return null;
  return Math.min(1100, Math.max(20, Math.ceil(value / 10) * 10));
}

const ACTIVATORS = new Set(['Säure', 'Aktivierungsreagenz', 'Halogenierungsmittel']);
const HELPER_ROLES = new Set(['Katalysator', 'Säure', 'Base', 'Aktivierungsreagenz', 'Reduktionsmittel', 'Oxidationsmittel', 'Halogenierungsmittel', 'Reagenz']);

/** Hilfsstoffe der Stufe in der Reihenfolge der KI (ohne Lösungsmittel und Liganden) */
function helpers(step: RetroStep) {
  return step.proposal.catalysts.filter((entry) => HELPER_ROLES.has(entry.role));
}

/**
 * KI-Synthese in der Werkbank: Zielstoff wählen, die Reaktions-KI plant
 * rückwärts, wie er sich herstellen lässt – mit Ausgangsstoffen, Katalysator
 * und Temperatur. Jede Stufe lässt sich mit einem Klick im Gefäß ansetzen.
 */
export function SynthesisPlanner({ rdkit, model, modelStatus, temperatureC, initialTarget, onSetUp, onAddSubstance, onSetCatalysis, onSetTemperature }: Props) {
  const [target, setTarget] = useState<Substance | null>(initialTarget ?? null);
  const [result, setResult] = useState<{ targetId: string; data: RetroResult } | null>(null);
  const [running, setRunning] = useState(false);
  const [catalog, setCatalog] = useState<Synthesis[]>([]);

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
    // Erst die Wartemeldung zeichnen, dann rechnen (die Planung braucht einige Sekunden)
    const options = { temperatureC, limit: 4 };
    window.setTimeout(() => {
      let first: RetroResult;
      try {
        // Erst die einstufigen Wege zeigen, dann in Ruhe die zweite Stufe planen
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

  const textbook = target && substanceById(target.id) ? routesTo(catalog, target.id).slice(0, 3) : [];
  const current = result && target && result.targetId === target.id ? result.data : null;

  return (
    <section className="card planner" aria-labelledby="planner-title">
      <div className="card-title">
        <h2 id="planner-title" style={{ margin: 0 }}>
          🎯 Zielstoff herstellen <span className="badge badge-ai">KI-Synthese</span>
        </h2>
      </div>
      <p className="small subtle" style={{ marginTop: 4 }}>
        Wähle, was entstehen soll. Die Reaktions-KI wendet ihre gelernten Reaktionsvorlagen rückwärts an, prüft jeden
        Vorschlag vorwärts nach und nennt Ausgangsstoffe, Katalysator und Temperatur – auf Wunsch über zwei Stufen.
      </p>
      <div className="planner-form">
        <SubstancePicker label="Zielstoff" value={target} onChange={(value) => { setTarget(value); setResult(null); }} rdkit={rdkit} placeholder="z. B. Aspirin, Paracetamol, Zimtsäure oder SMILES" />
        <button type="button" className="button" disabled={!target || !rdkit || !model || running} onClick={plan}>
          {running ? 'Plant …' : 'KI-Synthese planen'}
        </button>
      </div>
      {modelStatus === 'laden' && <p className="small muted">KI-Modell wird geladen …</p>}
      {modelStatus === 'fehlt' && (
        <Callout variant="warning" title="KI-Modell nicht verfügbar">
          <p style={{ margin: 0 }}>Ohne das Modell kann die App keine Synthese planen.</p>
        </Callout>
      )}
      {running && (
        <div className="row" style={{ marginTop: 12 }}>
          <span className="spinner" /> <span className="muted">Die KI zerlegt den Zielstoff und prüft die Wege …</span>
        </div>
      )}

      {current?.blocked && (
        <Callout variant="danger" title="Keine Synthese">
          <p style={{ margin: 0 }}>{current.blocked}</p>
        </Callout>
      )}

      {current && !current.blocked && (
        <div className="stack" style={{ marginTop: 12 }}>
          {current.routes.length === 0 ? (
            <Callout variant="info" title="Kein Weg gefunden">
              <p style={{ margin: 0 }}>
                Die gelernten Vorlagen liefern {current.candidates} mögliche Zerlegungen, aber keine hat die Vorwärtsprüfung
                bestanden. Für ungewöhnliche Moleküle kennt die KI oft keinen sicheren Weg.
              </p>
            </Callout>
          ) : (
            current.routes.map((route, index) => (
              <RouteCard
                key={route.id}
                route={route}
                index={index}
                rdkit={rdkit}
                temperatureC={temperatureC}
                onSetUp={onSetUp}
                onAddSubstance={onAddSubstance}
                onSetCatalysis={onSetCatalysis}
                onSetTemperature={onSetTemperature}
              />
            ))
          )}
          {current.pending && (
            <div className="row small">
              <span className="spinner" /> <span className="muted">Suche Vorstufen für Ausgangsstoffe, die nicht im Schrank stehen …</span>
            </div>
          )}
          <p className="small subtle" style={{ margin: 0 }}>
            {current.candidates} Zerlegungen geprüft. Alles hier ist Vorhersage der KI – Ausbeute, Nebenprodukte und
            Schutzgruppen sind nicht berücksichtigt.
          </p>
        </div>
      )}

      {target && textbook.length > 0 && (
        <details className="small" style={{ marginTop: 12 }}>
          <summary>Lehrbuchwege aus dem Synthesekatalog ({routesTo(catalog, target.id).length})</summary>
          <ul className="stack" style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
            {textbook.map((entry) => (
              <li key={entry.id} className="catalyst-item">
                <div className="row-between" style={{ gap: 6 }}>
                  <strong>{entry.ruleName}</strong>
                  <span className="subtle">{entry.reactionType}</span>
                </div>
                <div className="mono small" style={{ overflowWrap: 'anywhere' }}>{entry.equation}</div>
                {entry.educts.length > 0 && (
                  <button type="button" className="button button-secondary button-small" style={{ marginTop: 6 }} onClick={() => onSetUp(entry.educts, null, null)}>
                    ⚗ {entry.educts.map((educt) => educt.name).join(' + ')} ins Gefäß
                  </button>
                )}
              </li>
            ))}
          </ul>
          {target && (
            <Link to={`/stoff?name=${encodeURIComponent(target.name)}`} className="small">
              Alle Wege auf der Stoffseite
            </Link>
          )}
        </details>
      )}
    </section>
  );
}

function RouteCard({
  route,
  index,
  rdkit,
  temperatureC,
  onSetUp,
  onAddSubstance,
  onSetCatalysis,
  onSetTemperature,
}: {
  route: RetroRoute;
  index: number;
  rdkit: MainModule | null;
  temperatureC: number;
  onSetUp: Props['onSetUp'];
  onAddSubstance: Props['onAddSubstance'];
  onSetCatalysis: Props['onSetCatalysis'];
  onSetTemperature: Props['onSetTemperature'];
}) {
  const stages = route.steps.length;
  return (
    <article className="route-card">
      <div className="row-between" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>
          Weg {index + 1} · {stages === 1 ? '1 Stufe' : `${stages} Stufen`}
        </h3>
        <div className="row" style={{ gap: 6 }}>
          <span className={`badge badge-${route.confidence >= 0.6 ? 'success' : route.confidence >= 0.3 ? 'warning' : 'danger'}`} title="Wie sicher sich die KI ist (alle Stufen zusammen)">
            Sicherheit {percent(route.confidence)}
          </span>
          {route.allAvailable ? (
            <span className="badge badge-success" title="Alle Ausgangsstoffe stehen im Chemikalienschrank">alle Ausgangsstoffe vorrätig</span>
          ) : (
            <span className="badge badge-warning" title="Mindestens ein Ausgangsstoff steht nicht in der Stoffdatenbank">Ausgangsstoff nicht im Schrank</span>
          )}
        </div>
      </div>
      <ol className="route-steps">
        {route.steps.map((step, stepIndex) => (
          <StepItem
            key={`${step.product.smiles}-${stepIndex}`}
            step={step}
            number={stepIndex + 1}
            rdkit={rdkit}
            temperatureC={temperatureC}
            onSetUp={onSetUp}
            onAddSubstance={onAddSubstance}
            onSetCatalysis={onSetCatalysis}
            onSetTemperature={onSetTemperature}
          />
        ))}
      </ol>
    </article>
  );
}

function StepItem({
  step,
  number,
  rdkit,
  temperatureC,
  onSetUp,
  onAddSubstance,
  onSetCatalysis,
  onSetTemperature,
}: {
  step: RetroStep;
  number: number;
  rdkit: MainModule | null;
  temperatureC: number;
  onSetUp: Props['onSetUp'];
  onAddSubstance: Props['onAddSubstance'];
  onSetCatalysis: Props['onSetCatalysis'];
  onSetTemperature: Props['onSetTemperature'];
}) {
  const [catalyst, second] = helpers(step);
  const temperature = stepTemperature(step);
  const firstSubstance = (entry: typeof catalyst | undefined) =>
    entry?.substanceIds.map((id) => substanceById(id)).find((found): found is Substance => Boolean(found)) ?? null;
  const setUp = () => {
    // Ausgangsstoffe und die zwei wichtigsten Hilfsstoffe (etwa Palladium und Wasserstoff)
    const substances = [...step.precursors.map((entry) => entry.substance)];
    // Säure, Säurechlorid-Bildner und Kupplungsreagenz sind Alternativen – nur eines davon
    const alternatives = catalyst && second && ACTIVATORS.has(catalyst.role) && ACTIVATORS.has(second.role);
    for (const entry of alternatives ? [catalyst] : [catalyst, second]) {
      const substance = firstSubstance(entry);
      if (substance && !entry?.present) substances.push(substance);
    }
    const catalysis = catalyst?.catalysis ?? second?.catalysis ?? null;
    onSetUp(substances, catalysis, temperature !== null && temperature > temperatureC ? temperature : null);
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
      <div className="small">
        {catalyst ? (
          <>
            {catalyst.role}: <strong>{catalyst.label}</strong>
            {catalyst.examples.length > 0 && <span className="subtle"> (z. B. {catalyst.examples.slice(0, 2).join(', ')})</span>}
            {second && (
              <>
                {' '}· {second.role}: {second.label}
              </>
            )}
          </>
        ) : (
          'Ohne Hilfsstoff'
        )}
        {temperature !== null && <> · zügig ab etwa {temperature} °C</>}
        {step.proposal.enthalpy && <> · ΔrH° ≈ {formatSigned(step.proposal.enthalpy.deltaH, 0).replace(/^-/, '−')} kJ/mol</>}
        <span className="subtle"> · Sicherheit {percent(step.confidence)}</span>
      </div>
      <div className="row" style={{ gap: 6, marginTop: 6 }}>
        <button type="button" className="button button-small" onClick={setUp}>
          ⚗ Stufe {number} im Gefäß ansetzen
        </button>
        <details className="small route-details">
          <summary>Details (Energie, Katalysatoren)</summary>
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
