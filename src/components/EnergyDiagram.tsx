import { useId } from 'react';

interface Props {
  eaUncatalyzed: number;
  eaCatalyzed: number | null;
  catalystName?: string | null;
  /** Energie, die bei der eingestellten Temperatur in einer Stunde überwunden wird */
  reachable?: number;
  requiresCatalyst?: boolean;
  /** Reaktionsenthalpie in kJ/mol: setzt die Höhe der Produkte */
  deltaH?: number | null;
}

/**
 * Energiediagramm mit und ohne Katalysator (schematisch): Die Höhe der Berge
 * entspricht den Aktivierungsenergien, die gestrichelte Linie zeigt, welche
 * Barriere bei der eingestellten Temperatur noch überwunden wird.
 */
export function EnergyDiagram({ eaUncatalyzed, eaCatalyzed, catalystName, reachable, requiresCatalyst, deltaH }: Props) {
  const id = useId();
  const width = 340;
  const height = 190;
  const left = 36;
  const right = width - 12;
  const top = 18;
  const bottom = height - 26;
  const known = deltaH !== undefined && deltaH !== null && Number.isFinite(deltaH);
  const barrierMax = Math.max(eaUncatalyzed, eaCatalyzed ?? 0, reachable ?? 0, known ? (deltaH as number) : 0);
  // ohne bekannte Enthalpie: Produkte schematisch etwas tiefer als die Edukte
  const productEnergy = known ? (deltaH as number) : -barrierMax * 0.12;
  const min = Math.min(0, productEnergy);
  const max = barrierMax * 1.12 || 1;
  const y = (energy: number) => bottom - ((energy - min) / (max - min)) * (bottom - top);
  const baseline = y(0);
  const productLevel = y(productEnergy);
  const peakX = (left + right) / 2;

  const curve = (ea: number) => {
    // Der Übergangszustand liegt immer über den Produkten
    const peak = Math.min(y(ea), productLevel - 6);
    return `M ${left} ${baseline} L ${left + 30} ${baseline} C ${peakX - 40} ${baseline}, ${peakX - 34} ${peak}, ${peakX} ${peak} C ${peakX + 34} ${peak}, ${peakX + 40} ${productLevel}, ${right - 30} ${productLevel} L ${right} ${productLevel}`;
  };

  return (
    <figure className="energy-diagram">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>
          {`Energiediagramm: Aktivierungsenergie ohne Katalysator ${Math.round(eaUncatalyzed)} kJ/mol${eaCatalyzed !== null ? `, mit Katalysator ${Math.round(eaCatalyzed)} kJ/mol` : ''}`}
        </title>
        <line x1={left} y1={top - 6} x2={left} y2={bottom + 4} className="axis" />
        <text x={12} y={top + 4} className="axis-label" transform={`rotate(-90 12 ${top + 4})`} textAnchor="end">
          Energie
        </text>
        <text x={right} y={height - 8} className="axis-label" textAnchor="end">
          Reaktionsverlauf →
        </text>
        {reachable !== undefined && reachable < max && (
          <g>
            <line x1={left} y1={y(reachable)} x2={right} y2={y(reachable)} className="reachable" />
            <text x={left + 6} y={y(reachable) - 4} className="reachable-label">
              erreichbar bei eingestellter Temperatur
            </text>
          </g>
        )}
        <path d={curve(eaUncatalyzed)} className={`curve-uncatalyzed${requiresCatalyst ? ' blocked' : ''}`} />
        {eaCatalyzed !== null && <path d={curve(eaCatalyzed)} className="curve-catalyzed" />}
        <line x1={peakX + 2} y1={baseline} x2={peakX + 2} y2={y(eaUncatalyzed)} className="ea-arrow" />
        <text x={peakX + 8} y={y(eaUncatalyzed) + 12} className="ea-label">
          ohne: {Math.round(eaUncatalyzed)} kJ/mol
        </text>
        {eaCatalyzed !== null && (
          <>
            <line x1={peakX - 2} y1={baseline} x2={peakX - 2} y2={y(eaCatalyzed)} className="ea-arrow ea-arrow-catalyzed" />
            <text x={peakX + 8} y={Math.max(y(eaCatalyzed) + 14, y(eaUncatalyzed) + 26)} className="ea-label ea-label-catalyzed">
              mit: {Math.round(eaCatalyzed)} kJ/mol
            </text>
          </>
        )}
        <text x={left + 4} y={baseline + 14} className="axis-label">
          Edukte
        </text>
        <text x={right - (known ? 12 : 4)} y={productLevel - 6} className="axis-label" textAnchor="end">
          Produkte
        </text>
        {known && Math.abs(baseline - productLevel) > 4 && (
          <g>
            <line x1={right - 40} y1={baseline} x2={right} y2={baseline} className="ea-arrow" />
            <line x1={right - 6} y1={baseline} x2={right - 6} y2={productLevel} className="dh-arrow" />
          </g>
        )}
      </svg>
      <figcaption className="small subtle">
        <span className="legend-swatch legend-uncatalyzed" /> ohne Katalysator
        {eaCatalyzed !== null && (
          <>
            {'  '}
            <span className="legend-swatch legend-catalyzed" /> mit {catalystName ?? 'Katalysator'}
          </>
        )}
        {' · '}
        {known ? (
          <>
            <span className="dh-caption">ΔH = {deltaH! > 0 ? '+' : '−'}{Math.abs(Math.round(deltaH!))} kJ/mol</span> berechnet, Ea nach Richtwerten
          </>
        ) : (
          'schematisch, Höhen nach Richtwerten'
        )}
      </figcaption>
    </figure>
  );
}
