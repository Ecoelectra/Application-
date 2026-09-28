import type { MainModule } from '@rdkit/rdkit';
import { maximumBarrier } from '../chem/ai/activation';
import { energyText, withCatalyst, type AiProposal, type CatalystSuggestion, type EnergyProfile } from '../chem/ai/reactionAI';
import { substanceById } from '../data/substances';
import type { Substance } from '../data/types';
import type { Catalysis } from '../data/workbenchSpecs';
import { CATALYSIS_LABELS } from '../data/workbenchSpecs';
import { Callout } from './Callout';
import { EnergyDiagram } from './EnergyDiagram';
import { EnthalpyPanel } from './EnthalpyPanel';
import { MoleculeStructure } from './MoleculeStructure';

interface Props {
  proposal: AiProposal;
  rdkit: MainModule | null;
  temperatureC: number;
  /** Stoff ins Gefäß geben (Werkbank) */
  onAddSubstance?: (substance: Substance) => void;
  onSetCatalysis?: (catalysis: Catalysis) => void;
  onSetTemperature?: (temperatureC: number) => void;
  compact?: boolean;
}

const ROLE_ICONS: Record<string, string> = {
  Katalysator: '⚙',
  Säure: 'H⁺',
  Base: 'OH⁻',
  Aktivierungsreagenz: '⚡',
  Reduktionsmittel: '↓e⁻',
  Oxidationsmittel: '↑e⁻',
  Halogenierungsmittel: 'X',
  Ligand: 'L',
  Reagenz: '•',
  Lösungsmittel: '~',
};

function percent(value: number): string {
  return `${Math.round(value * 100)} %`;
}

/** Karte mit einem Vorschlag der Reaktions-KI: Produkt, Katalysator, Energie. */
export function AiProposalCard({ proposal, rdkit, temperatureC, onAddSubstance, onSetCatalysis, onSetTemperature, compact }: Props) {
  const energy = proposal.energy;
  const reachable = maximumBarrier(temperatureC, energy?.bimolecular ?? true, energy?.preExponential);
  const suggestedTemperature =
    energy && !energy.catalystPresent && energy.catalystNeeded
      ? null
      : energy && energy.uncatalyzed.speed !== 'schnell' && energy.uncatalyzed.speed !== 'praktikabel'
        ? (energy.catalystPresent ? energy.temperatureCatalyzed : energy.temperatureUncatalyzed)
        : null;

  return (
    <article className="card ai-card">
      <div className="card-title">
        <div>
          <h3 style={{ marginBottom: 2 }}>{proposal.title}</h3>
          <div className="subtle">{proposal.equation}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {proposal.source === 'ki' ? (
            <span className="badge badge-ai" title="Vorhersage des neuronalen Netzes – nicht einzeln belegt">
              🤖 KI-Vorhersage
            </span>
          ) : (
            <span className="badge badge-anorganisch" title="Aus der Katalyse-Wissensbasis (Lehrbuchwerte)">
              📘 Katalyse-Wissen
            </span>
          )}
          {proposal.source === 'ki' && (
            <span
              className={`badge badge-${proposal.confidence >= 0.4 ? 'success' : proposal.confidence >= 0.1 ? 'warning' : 'danger'}`}
              title="Wie sicher sich das Netz ist, dass genau diese Reaktion abläuft"
            >
              Sicherheit {percent(proposal.confidence)}
            </span>
          )}
        </div>
      </div>

      {rdkit && proposal.products.some((product) => product.smiles) && (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          {proposal.products
            .filter((product) => product.smiles)
            .map((product) => (
              <figure key={product.smiles} style={{ margin: 0 }}>
                <MoleculeStructure rdkit={rdkit} smiles={product.smiles as string} width={compact ? 180 : 220} height={compact ? 130 : 150} fallback={product.smiles} />
                <figcaption className="small" style={{ textAlign: 'center' }}>
                  {product.name}
                  {product.formula && product.formula !== product.name ? <span className="subtle mono"> · {product.formula}</span> : null}
                </figcaption>
              </figure>
            ))}
        </div>
      )}

      {energy && (
        <>
          <EnergyVerdict energy={energy} temperatureC={temperatureC} />
          <div className="ai-energy">
            <EnergyDiagram
              eaUncatalyzed={energy.eaUncatalyzed}
              eaCatalyzed={energy.eaCatalyzed}
              catalystName={energy.catalystName}
              reachable={reachable}
              requiresCatalyst={energy.requiresCatalyst}
              deltaH={proposal.enthalpy?.deltaH}
            />
            <div>
              <p className="small" style={{ marginTop: 0 }}>{energyText(energy, temperatureC)}</p>
              <p className="small subtle" style={{ marginBottom: 0 }}>
                {energy.reliability}. Halbwertszeiten nach Arrhenius bei 1 mol/L.
              </p>
              {onSetTemperature && suggestedTemperature !== null && suggestedTemperature > temperatureC && suggestedTemperature < 1200 && (
                <button type="button" className="button button-secondary button-small" style={{ marginTop: 8 }} onClick={() => onSetTemperature(Math.ceil(suggestedTemperature / 10) * 10)}>
                  🌡 Auf {Math.ceil(suggestedTemperature / 10) * 10} °C erhitzen
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <EnthalpyPanel enthalpy={proposal.enthalpy} compact />

      {proposal.catalysts.length > 0 && (
        <>
          <h4 style={{ marginBottom: 6 }}>{proposal.source === 'ki' ? 'Katalysator und Hilfsstoffe (von der KI vorhergesagt)' : 'Katalysatoren'}</h4>
          <ul className="catalyst-list">
            {proposal.catalysts.map((catalyst) => (
              <CatalystItem key={`${catalyst.category}-${catalyst.label}`} catalyst={catalyst} onAddSubstance={onAddSubstance} onSetCatalysis={onSetCatalysis} />
            ))}
          </ul>
        </>
      )}

      {!compact && <p style={{ marginTop: 12 }}>{proposal.explanation}</p>}
      {compact && <p className="small" style={{ marginTop: 10 }}>{proposal.explanation}</p>}

      {proposal.conditions && <p className="small subtle">Bedingungen: {proposal.conditions}</p>}
      {proposal.hazards.length > 0 && (
        <Callout variant="danger" title="Sicherheit">
          <ul style={{ margin: 0 }}>
            {proposal.hazards.map((hazard) => (
              <li key={hazard}>{hazard}</li>
            ))}
          </ul>
        </Callout>
      )}

      {proposal.example && (
        <details className="small" style={{ marginTop: 10 }}>
          <summary>Beispiel aus den Patentdaten ({proposal.exampleSource})</summary>
          <p className="mono" style={{ wordBreak: 'break-all' }}>{proposal.example.replace('>>', ' → ')}</p>
        </details>
      )}
    </article>
  );
}

function speedOk(speed: string): boolean {
  return speed === 'schnell' || speed === 'praktikabel';
}

/** Kurzurteil: Läuft die Reaktion – und was fehlt dafür? */
function EnergyVerdict({ energy, temperatureC }: { energy: EnergyProfile; temperatureC: number }) {
  const T = `${Math.round(temperatureC)} °C`;
  const warm = (value: number | null) => (value !== null ? ` ab etwa ${Math.round(Math.max(value, -50) / 10) * 10} °C` : ' bei höherer Temperatur');
  const catalyzedOk = energy.catalyzed ? speedOk(energy.catalyzed.speed) : false;
  if (energy.catalystPresent && energy.catalyzed) {
    return catalyzedOk ? (
      <Callout variant="success" title={energy.presentRole === 'Katalysator' ? 'Katalysator ist da' : 'Nötiger Hilfsstoff ist da'}>
        <p style={{ margin: 0 }}>
          {energy.catalystName}: Die Barriere sinkt auf etwa {Math.round(energy.eaCatalyzed ?? 0)} kJ/mol – bei {T} läuft die Reaktion.
        </p>
      </Callout>
    ) : (
      <Callout variant="warning" title="Katalysator ist da – aber noch zu kalt">
        <p style={{ margin: 0 }}>
          {energy.catalystName} senkt die Barriere auf etwa {Math.round(energy.eaCatalyzed ?? 0)} kJ/mol; zügig läuft es{warm(energy.temperatureCatalyzed)}.
        </p>
      </Callout>
    );
  }
  if (energy.requiresCatalyst || energy.catalystNeeded) {
    const title = energy.requiresCatalyst ? 'Ohne Katalysator nicht möglich' : `Aktivierungsenergie zu hoch für ${T}`;
    return (
      <Callout variant="warning" title={catalyzedOk ? title : `${title} – Katalysator und Wärme nötig`}>
        <p style={{ margin: 0 }}>
          {energy.requiresCatalyst ? 'Ohne Katalysator gibt es keinen gangbaren Reaktionsweg. ' : 'Ohne Katalysator ist die Reaktion bei dieser Temperatur zu langsam. '}
          {catalyzedOk
            ? `${withCatalyst(energy.catalystName).replace(/^m/, 'M')} läuft sie schon bei ${T}.`
            : `${withCatalyst(energy.catalystName).replace(/^m/, 'M')} läuft sie${warm(energy.temperatureCatalyzed)}.`}
        </p>
      </Callout>
    );
  }
  if (speedOk(energy.uncatalyzed.speed)) {
    return (
      <Callout variant="success" title="Läuft auch ohne Katalysator">
        <p style={{ margin: 0 }}>Die Barriere ist bei {T} klein genug.</p>
      </Callout>
    );
  }
  return (
    <Callout variant="warning" title="Zu langsam">
      <p style={{ margin: 0 }}>Es braucht mehr Wärme: zügig{warm(energy.temperatureUncatalyzed)}.</p>
    </Callout>
  );
}

function CatalystItem({
  catalyst,
  onAddSubstance,
  onSetCatalysis,
}: {
  catalyst: CatalystSuggestion;
  onAddSubstance?: (substance: Substance) => void;
  onSetCatalysis?: (catalysis: Catalysis) => void;
}) {
  const substances = catalyst.substanceIds.map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry)).slice(0, 3);
  return (
    <li className={`catalyst-item${catalyst.present ? ' present' : ''}`}>
      <div className="row-between" style={{ gap: 6 }}>
        <strong>
          <span className="catalyst-icon" aria-hidden="true">{ROLE_ICONS[catalyst.role] ?? '•'}</span> {catalyst.label}
        </strong>
        <span className="small subtle">
          {catalyst.role}
          {catalyst.share > 0 ? ` · in ${percent(catalyst.share)} der Patente` : ''}
          {catalyst.present ? ' · ✓ vorhanden' : ''}
        </span>
      </div>
      {catalyst.examples.length > 0 && <div className="small">z. B. {catalyst.examples.join(', ')}</div>}
      <div className="small subtle">{catalyst.purpose}</div>
      {!catalyst.present && (onAddSubstance || onSetCatalysis) && (
        <div className="row" style={{ gap: 6, marginTop: 6 }}>
          {onAddSubstance &&
            substances.map((substance) => (
              <button key={substance.id} type="button" className="button button-secondary button-small" onClick={() => onAddSubstance(substance)}>
                ＋ {substance.name}
              </button>
            ))}
          {onSetCatalysis && catalyst.catalysis && (
            <button type="button" className="button button-secondary button-small" onClick={() => onSetCatalysis(catalyst.catalysis as Catalysis)}>
              Katalyse: {CATALYSIS_LABELS[catalyst.catalysis]}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
