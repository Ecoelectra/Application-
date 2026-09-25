import type { ComplexAnalysis } from '../chem/complexes';
import { formatNumber } from '../chem/format';
import { ComplexGeometry, OrbitalDiagram } from './ComplexGeometry';

/**
 * Darstellung eines Komplexes: Farbe, Formel, Name, räumlicher Bau,
 * d-Orbital-Schema und Kennzahlen. Wird im Komplex-Baukasten und in den
 * Ergebnissen der Werkbank genutzt.
 */
export function ComplexDetails({ complex, compact = false }: { complex: ComplexAnalysis; compact?: boolean }) {
  const table = (
    <div className="table-wrap" style={{ marginTop: 12 }}>
      <table className="data">
        <tbody>
          <tr><td>Oxidationszahl des Zentralions</td><td className="num">+{complex.oxidationState}</td></tr>
          <tr><td>Ladung des Komplexes</td><td className="num">{complex.charge > 0 ? '+' : ''}{complex.charge}</td></tr>
          <tr><td>Koordinationszahl</td><td className="num">{complex.coordinationNumber}</td></tr>
          <tr><td>Geometrie</td><td className="num">{complex.geometry}</td></tr>
          <tr><td>d-Elektronen</td><td className="num">{complex.dElectrons}</td></tr>
          <tr><td>Ungepaarte Elektronen</td><td className="num">{complex.unpaired}</td></tr>
          <tr>
            <td>Magnetisches Moment (spin-only)</td>
            <td className="num">{formatNumber(complex.magneticMoment, 2)} μB · {complex.magnetism}</td>
          </tr>
          {complex.lfse !== undefined && (
            <tr>
              <td>Ligandenfeld-Stabilisierungsenergie</td>
              <td className="num">{formatNumber(complex.lfse, 1)} Δ</td>
            </tr>
          )}
          {complex.delta && (
            <tr>
              <td>Aufspaltung Δ ({complex.deltaSource})</td>
              <td className="num">
                {formatNumber(complex.delta, 0)} cm⁻¹ · Absorption bei {complex.absorbedNm} nm
              </td>
            </tr>
          )}
          <tr><td>Farbe</td><td className="num">{complex.color}</td></tr>
          {complex.logBeta !== undefined && (
            <tr><td>Stabilitätskonstante lg β</td><td className="num">{formatNumber(complex.logBeta, 1)}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="complex-details">
      <div className="complex-head">
        <span
          className="color-swatch"
          style={{ background: complex.swatch === 'transparent' ? 'var(--bg-sunken)' : complex.swatch }}
          title={`Farbe: ${complex.color}`}
          aria-hidden="true"
        />
        <div style={{ minWidth: 0 }}>
          <div className="complex-formula">{complex.formulaPretty}</div>
          <div className="muted">{complex.name}</div>
          {complex.trivialName && <div className="subtle small">{complex.trivialName}</div>}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <figure style={{ margin: 0, textAlign: 'center' }}>
          <ComplexGeometry complex={complex} size={compact ? 210 : 260} />
          <figcaption className="small muted">{complex.geometry}</figcaption>
        </figure>
        <figure style={{ margin: 0, textAlign: 'center' }}>
          <OrbitalDiagram complex={complex} width={compact ? 250 : 300} />
          <figcaption className="small muted">
            d{complex.dElectrons}-Konfiguration
            {complex.spin !== 'keine Wahl' ? `, ${complex.spin}` : ''}
          </figcaption>
        </figure>
      </div>

      {compact ? (
        <details style={{ marginTop: 10 }}>
          <summary>Kennzahlen des Komplexes</summary>
          {table}
        </details>
      ) : (
        table
      )}

      {!compact && complex.formation && (
        <>
          <h3 style={{ marginTop: 16 }}>Bildung aus dem Aquakomplex</h3>
          <div className="equation-scroll">
            <div className="equation-text">{complex.formation}</div>
          </div>
        </>
      )}

      {!compact && complex.note && (
        <div className="callout callout-info" style={{ marginTop: 14 }}>
          <span className="callout-icon">🔬</span>
          <div>{complex.note}</div>
        </div>
      )}

      {complex.isomers.map((isomer) => (
        <div key={isomer.kind} className="callout callout-success" style={{ marginTop: 10 }}>
          <span className="callout-icon">⇄</span>
          <div>
            <strong>{isomer.kind}{isomer.count ? ` (${isomer.count} Isomere)` : ''}: </strong>
            {isomer.description}
          </div>
        </div>
      ))}

      {complex.chelate && (
        <p className="small muted" style={{ marginTop: 12 }}>
          Chelatkomplex: Mehrzähnige Liganden umklammern das Zentralion. Solche Komplexe sind meist
          deutlich stabiler als vergleichbare mit einzähnigen Liganden, weil bei ihrer Bildung mehr
          Teilchen frei werden (Chelateffekt).
        </p>
      )}

      {!compact && (
        <details style={{ marginTop: 12 }}>
          <summary>Wie wird das bestimmt?</summary>
          <div className="small muted" style={{ marginTop: 8 }}>
            <p>
              Die Geometrie folgt aus der Koordinationszahl; bei vier Liganden sind d⁸-Ionen mit
              starkem Feld sowie 4d- und 5d-Metalle quadratisch-planar, sonst tetraedrisch.
            </p>
            <p>
              Ob sich Elektronen paaren (low-spin), hängt davon ab, ob die Aufspaltung Δ größer ist
              als die Paarungsenergie. Bei 3d-Metallen ist das nur mit starken Liganden der Fall
              (CN⁻, CO, NO₂⁻, bei Eisen(II) auch bipy und phen); Cobalt(III) ist fast immer
              low-spin, 4d- und 5d-Metalle immer.
            </p>
            <p>
              Gemessene Aufspaltungen haben Vorrang. Sonst wird Δ nach der Jørgensen-Regel
              abgeschätzt (Δ ≈ f · g), und die sichtbare Farbe ist die Komplementärfarbe des
              absorbierten Lichts. d⁰- und d¹⁰-Ionen sind farblos, weil keine d-d-Übergänge
              möglich sind.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
