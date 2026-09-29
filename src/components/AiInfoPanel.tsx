import { SOURCE_LABELS, type ReactionModel } from '../chem/ai/model';
import { Callout } from './Callout';

function percent(value: number): string {
  return `${(value * 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })} %`;
}

/** Wie die Reaktions-KI in der Werkbank rechnet: Arbeitsweise, Datenquellen, Güte und Grenzen. */
export function AiInfoPanel({ model, status }: { model: ReactionModel | null; status: 'laden' | 'bereit' | 'fehlt' }) {
  const sources = model?.sources && Object.keys(model.sources).length > 1 ? model.sources : null;
  const total = sources ? Object.values(sources).reduce((sum, count) => sum + count, 0) : (model?.metrics.trainingReactions ?? 0);
  return (
    <details className="card ai-info">
      <summary>
        <strong>🤖 So rechnet die Reaktions-KI mit</strong>
        <span className="small subtle">
          {' '}
          {status === 'bereit'
            ? `– neuronales Netz, ${total.toLocaleString('de-DE')} Reaktionen${sources ? ` aus ${Object.keys(sources).length} Quellen` : ''}, offline im Gerät`
            : status === 'laden'
              ? '– Modell wird geladen …'
              : '– Modell nicht verfügbar'}
        </span>
      </summary>
      <ol style={{ marginTop: 12 }}>
        <li>
          <strong>Reaktionsvorlagen lernen.</strong> Aus jeder Trainingsreaktion wurde das Reaktionszentrum herausgeschnitten –
          die Atome, deren Bindungen sich ändern, mit ihren Nachbarn.
          {model ? ` ${model.templates.length.toLocaleString('de-DE')} Vorlagen` : ' Die Vorlagen'}, die mindestens 25-mal
          vorkommen (aus den kleineren Quellen 8-mal), kennt das Netz.
        </li>
        <li>
          <strong>Neuronales Netz.</strong> Es liest den molekularen Fingerabdruck der Stoffe im Gefäß (2048 Bit,
          Morgan-Radius 2) und schätzt für jede Vorlage, wie wahrscheinlich sie greift – für jedes Stoffpaar. Eine zweite
          Ausgabe schätzt, welche Katalysatoren, Basen oder Reagenzien dafür gebraucht werden.
        </li>
        <li>
          <strong>Prüfen mit RDKit.</strong> Die wahrscheinlichsten Vorlagen werden auf die echten Moleküle angewendet. Nur
          chemisch gültige Produkte bleiben; gesperrte Stoffe (Sprengstoffe, Kampfstoffe, Betäubungsmittel) zeigt die App nie.
        </li>
        <li>
          <strong>Im Reaktor bewerten.</strong> Jede Vorlage gehört zu einer Reaktionsfamilie mit Richtwerten für die
          Aktivierungsenergie mit und ohne Katalysator. Über die Arrhenius-Gleichung folgt, ob die Reaktion bei der
          eingestellten Temperatur abläuft; Druck zählt bei gasförmigen Partnern und siedenden Edukten. Passt ein
          Katalysator im Gefäß oder die eingestellte Katalyse, sinkt die Barriere.
        </li>
        <li>
          <strong>Mit Regeln und Belegen abgleichen.</strong> Findet die Werkbank dasselbe Produkt schon über eine Regel oder
          einen Patentbeleg, wird die Reaktion nur einmal gezeigt – mit dem Vermerk «KI bestätigt».
        </li>
      </ol>
      {sources && (
        <>
          <h3>Woher die Reaktionen stammen</h3>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Quelle</th>
                  <th className="num">verschiedene Reaktionen</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sources)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, count]) => (
                    <tr key={id}>
                      <td>{SOURCE_LABELS[id] ?? id}</td>
                      <td className="num">{count.toLocaleString('de-DE')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {model && (
        <>
          <h3>Wie gut ist sie?</h3>
          <p className="small">
            Geprüft an Patentreaktionen des USPTO-MIT-Testsatzes, die das Netz beim Lernen nicht gesehen hat (
            {model.metrics.productSample.toLocaleString('de-DE')} Stichproben):
          </p>
          <div className="grid grid-3">
            <div className="stat">
              <div className="stat-value">{percent(model.metrics.productTop1)}</div>
              <div className="small subtle">richtiges Produkt auf Platz 1</div>
            </div>
            <div className="stat">
              <div className="stat-value">{percent(model.metrics.productTop3)}</div>
              <div className="small subtle">richtiges Produkt unter den ersten 3</div>
            </div>
            <div className="stat">
              <div className="stat-value">{percent(model.metrics.catalystTop1)}</div>
              <div className="small subtle">richtige Katalysatorart auf Platz 1</div>
            </div>
          </div>
        </>
      )}
      <Callout variant="warning" title="Grenzen">
        <p style={{ margin: 0 }}>
          Die KI kennt vor allem, was in Patenten der organischen Synthese häufig vorkommt; Enzym- und Stoffwechselreaktionen
          machen nur einen kleinen Teil der Trainingsdaten aus. Sie sagt, was chemisch naheliegt – nicht, ob es im Einzelfall
          klappt, wie hoch die Ausbeute ist oder welche Nebenprodukte entstehen. Die Aktivierungsenergien sind Richtwerte der
          Reaktionsfamilie (± 10–20 kJ/mol). Jedes Ergebnis der KI ist deshalb als Vorhersage gekennzeichnet.
        </p>
      </Callout>
    </details>
  );
}
