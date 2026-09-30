import { Link } from 'react-router-dom';
import type { MetalCatalyst } from '../data/metalCatalysts';
import { substanceById } from '../data/substances';
import { Callout } from './Callout';

const LEVEL_BADGE: Record<string, string> = {
  Schulversuch: 'success',
  Laborpraktikum: 'analytik',
  Fortgeschritten: 'warning',
  'Nur Fachlabor': 'danger',
};

/** Ausführliche Anleitung: Wofür, Zutaten, Geräte, Schritte, Prüfung, Lagerung, Sicherheit, Quelle */
export function CatalystGuideView({
  catalyst,
  onAddToVessel,
  headingLevel = 2,
}: {
  catalyst: MetalCatalyst;
  onAddToVessel?: (catalyst: MetalCatalyst) => void;
  headingLevel?: 2 | 3;
}) {
  const { guide } = catalyst;
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const Sub = headingLevel === 2 ? 'h3' : 'h4';
  const inVessel = catalyst.substanceIds.filter((id) => substanceById(id));
  return (
    <article className="catalyst-guide">
      <div className="card-title">
        <div>
          <H style={{ marginBottom: 2 }}>{catalyst.name}</H>
          <div className="subtle">
            <span className="mono">{catalyst.short}</span> · {catalyst.metal}
          </div>
        </div>
        <span className={`badge badge-${LEVEL_BADGE[catalyst.level] ?? 'warning'}`}>{catalyst.level}</span>
      </div>

      <p>{guide.overview}</p>

      <dl className="definition-list">
        <dt>Wofür</dt>
        <dd>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {catalyst.uses.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </dd>
        <dt>Menge im Ansatz</dt>
        <dd>{catalyst.loading}</dd>
      </dl>

      {catalyst.level === 'Nur Fachlabor' && (
        <Callout variant="danger" title="Nur im Fachlabor">
          <p style={{ margin: 0 }}>
            Diese Herstellung gehört in ein ausgestattetes Hochschul- oder Industrielabor mit Abzug, Schutzausrüstung und
            fachkundiger Aufsicht – nicht in die Schule und nicht nach Hause.
          </p>
        </Callout>
      )}

      {guide.purchaseOnly && (
        <Callout variant="warning" title="Wird gekauft, nicht selbst hergestellt">
          <p style={{ margin: 0 }}>{guide.buyAdvice}</p>
        </Callout>
      )}

      <Sub>{guide.purchaseOnly ? 'Was du brauchst' : 'Chemikalien'}</Sub>
      <div className="table-wrap">
        <table className="data guide-table">
          <tbody>
            {guide.ingredients.map((ingredient) => {
              const known = ingredient.substanceId ? substanceById(ingredient.substanceId) : undefined;
              return (
                <tr key={ingredient.name}>
                  <td>
                    {known ? <Link to={`/stoff?${new URLSearchParams({ name: known.name }).toString()}`}>{ingredient.name}</Link> : ingredient.name}
                  </td>
                  <td>{ingredient.amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sub>Geräte</Sub>
      <p style={{ marginTop: 0 }}>{guide.equipment.join(' · ')}</p>

      <Sub>{guide.purchaseOnly ? 'So setzt du ihn ein' : 'So stellst du ihn her'}</Sub>
      <ol className="guide-steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      {guide.equation && (
        <>
          <Sub>Reaktionsgleichung</Sub>
          <div className="equation-scroll">
            <div className="equation-text">{guide.equation}</div>
          </div>
        </>
      )}

      {guide.check && (
        <>
          <Sub>Hat es geklappt?</Sub>
          <p style={{ marginTop: 0 }}>{guide.check}</p>
        </>
      )}

      <Sub>Aufbewahrung</Sub>
      <p style={{ marginTop: 0 }}>{guide.storage}</p>

      <Callout variant="warning" title="Sicherheit">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {guide.hazards.map((hazard) => (
            <li key={hazard}>{hazard}</li>
          ))}
          <li>Vor dem Versuch die Sicherheitsdatenblätter aller Stoffe lesen; Schutzbrille, Kittel und Handschuhe tragen.</li>
        </ul>
      </Callout>

      {guide.buyAdvice && !guide.purchaseOnly && (
        <p className="small">
          <strong>Kaufen statt herstellen: </strong>
          {guide.buyAdvice}
        </p>
      )}

      <p className="small subtle">Quelle: {guide.source}</p>

      {onAddToVessel && inVessel.length > 0 && (
        <button type="button" className="button button-small" onClick={() => onAddToVessel(catalyst)}>
          ⚗ {substanceById(inVessel[0])?.name} ins Gefäß geben
        </button>
      )}
    </article>
  );
}
