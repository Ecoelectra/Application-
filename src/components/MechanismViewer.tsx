import { useState } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import type { Mechanism } from '../data/types';
import { EnergyProfile } from './EnergyProfile';
import { ReactionEquation } from './ReactionEquation';

interface Props {
  rdkit: MainModule | null;
  mechanism: Mechanism;
}

/** Zeigt den Reaktionsmechanismus Schritt für Schritt mit Energieprofil. */
export function MechanismViewer({ rdkit, mechanism }: Props) {
  const [activeStep, setActiveStep] = useState<number | undefined>(undefined);
  const hasEnergies = mechanism.steps.some((step) => step.relativeEnergy !== undefined);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">
          <h3>Mechanismus: {mechanism.type}</h3>
        </div>
        <p>{mechanism.summary}</p>

        {hasEnergies && (
          <EnergyProfile
            steps={mechanism.steps}
            productEnergy={mechanism.productEnergy}
            activeStep={activeStep}
            onSelectStep={(index) => {
              setActiveStep(index);
              document.getElementById(`mechanismus-schritt-${index}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }}
          />
        )}
      </div>

      <div>
        {mechanism.steps.map((step, index) => (
          <div
            key={step.title}
            id={`mechanismus-schritt-${index}`}
            className={`mechanism-step${step.rateDetermining ? ' rate-determining' : ''}`}
            data-step={index + 1}
            onMouseEnter={() => setActiveStep(index)}
          >
            <div className="row-between" style={{ marginBottom: 6 }}>
              <h4 style={{ margin: 0 }}>{step.title}</h4>
              <div className="row" style={{ gap: 6 }}>
                {step.rateDetermining && (
                  <span className="badge badge-elektrochemie">geschwindigkeitsbestimmend</span>
                )}
                {step.relativeEnergy !== undefined && (
                  <span className="badge">
                    {step.relativeEnergy > 0 ? '+' : ''}
                    {step.relativeEnergy} kJ/mol
                  </span>
                )}
              </div>
            </div>

            <p style={{ marginBottom: step.rxnSmiles ? 12 : 0 }}>{step.description}</p>

            {step.rxnSmiles && (
              <ReactionEquation
                rdkit={rdkit}
                rxnSmiles={step.rxnSmiles}
                text={step.rxnSmiles}
                width={620}
                height={150}
              />
            )}

            {step.electronFlow && (
              <div className="electron-flow">
                <strong>Elektronenfluss: </strong>
                {step.electronFlow}
              </div>
            )}

            {step.intermediate && (
              <p className="subtle" style={{ marginTop: 8, marginBottom: 0 }}>
                Zwischenstufe: {step.intermediate}
              </p>
            )}
          </div>
        ))}
      </div>

      {(mechanism.stereochemistry || mechanism.kinetics || mechanism.competingPathways) && (
        <div className="card">
          <h3>Einordnung</h3>
          <dl className="definition-list">
            {mechanism.stereochemistry && (
              <>
                <dt>Stereochemie</dt>
                <dd>{mechanism.stereochemistry}</dd>
              </>
            )}
            {mechanism.kinetics && (
              <>
                <dt>Kinetik</dt>
                <dd>{mechanism.kinetics}</dd>
              </>
            )}
            {mechanism.competingPathways && (
              <>
                <dt>Konkurrenz</dt>
                <dd>{mechanism.competingPathways}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
