import type { MetalPrediction } from '../chem/metalCatalystPrediction';
import type { MetalCatalyst } from '../data/metalCatalysts';

/** Vorhersage des Metallkatalysators für eine Reaktion; ein Klick öffnet die Anleitung */
export function MetalCatalystPanel({ prediction, onOpen }: { prediction: MetalPrediction; onOpen: (catalyst: MetalCatalyst) => void }) {
  return (
    <div className={`metal-panel${prediction.needed ? '' : ' metal-panel-none'}`}>
      <div className="metal-panel-title">
        <span aria-hidden="true">⚙</span> <strong>Metallkatalysator-Vorhersage</strong>
      </div>
      {prediction.needed ? (
        <>
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            {prediction.picks.map((entry, index) => (
              <button
                key={entry.catalyst.id}
                type="button"
                className={`chip${index === 0 ? ' active' : ''}`}
                onClick={() => onOpen(entry.catalyst)}
                title="Anleitung zur Herstellung öffnen"
              >
                {index === 0 ? '★ ' : ''}
                {entry.catalyst.short}
                {entry.role === 'Cokatalysator' ? ' (Cokatalysator)' : ''}
              </button>
            ))}
          </div>
          <p className="small" style={{ margin: '8px 0 0' }}>
            <strong>Empfehlung:</strong> {prediction.summary}
          </p>
          <ul className="small metal-reasons">
            {prediction.picks.map((entry) => (
              <li key={entry.catalyst.id}>
                <button type="button" className="link-button" onClick={() => onOpen(entry.catalyst)}>
                  {entry.catalyst.short}
                </button>
                : {entry.reason}
                {entry.evidence && <span className="subtle"> 🤖 {entry.evidence}</span>}
              </li>
            ))}
          </ul>
          <p className="small subtle" style={{ margin: 0 }}>
            Tippe auf einen Katalysator für die Anleitung, wie du ihn herstellst.
          </p>
        </>
      ) : (
        <p className="small" style={{ margin: '6px 0 0' }}>
          {prediction.summary}
        </p>
      )}
    </div>
  );
}
