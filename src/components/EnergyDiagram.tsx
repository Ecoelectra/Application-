import { useId } from 'react';

interface Props {
  eaUncatalyzed: number;
  eaCatalyzed: number | null;
  catalystName?: string | null;
  /** Energie, die bei der eingestellten Temperatur in einer Stunde überwunden wird */
  reachable?: number;
  requiresCatalyst?: boolean;
}

/**
 * Energiediagramm mit und ohne Katalysator (schematisch): Die Höhe der Berge
 * entspricht den Aktivierungsenergien, die gestrichelte Linie zeigt, welche
 * Barriere bei der eingestellten Temperatur noch überwunden wird.
 */
export function EnergyDiagram({ eaUncatalyzed, eaCatalyzed, catalystName, reachable, requiresCatalyst }: Props) {
  const id = useId();
  const width = 340;
  const height = 190;
  const left = 36;
  const right = width - 12;
  const top = 18;
  const baseline = height - 44;
  const productLevel = baseline + 18;
  const max = Math.max(eaUncatalyzed, eaCatalyzed ?? 0, reachable ?? 0) * 1.12 || 1;
  const y = (energy: number) => baseline - (energy / max) * (baseline - top);
  const peakX = (left + right) / 2;

  const curve = (ea: number) => {
    const peak = y(ea);
    return `M ${left} ${baseline} L ${left + 30} ${baseline} C ${peakX - 40} ${baseline}, ${peakX - 34} ${peak}, ${peakX} ${peak} C ${peakX + 34} ${peak}, ${peakX + 40} ${productLevel}, ${right - 30} ${productLevel} L ${right} ${productLevel}`;
  };

  return (
    <figure className="energy-diagram">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>
          {`Energiediagramm: Aktivierungsenergie ohne Katalysator ${Math.round(eaUncatalyzed)} kJ/mol${eaCatalyzed !== null ? `, mit Katalysator ${Math.round(eaCatalyzed)} kJ/mol` : ''}`}
        </title>
        <line x1={left} y1={top - 6} x2={left} y2={baseline + 24} className="axis" />
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
        <text x={left + 4} y={baseline + 16} className="axis-label">
          Edukte
        </text>
        <text x={right - 4} y={productLevel - 6} className="axis-label" textAnchor="end">
          Produkte
        </text>
      </svg>
      <figcaption className="small subtle">
        <span className="legend-swatch legend-uncatalyzed" /> ohne Katalysator
        {eaCatalyzed !== null && (
          <>
            {'  '}
            <span className="legend-swatch legend-catalyzed" /> mit {catalystName ?? 'Katalysator'}
          </>
        )}
        {' · '}schematisch, Höhen nach Richtwerten
      </figcaption>
    </figure>
  );
}
