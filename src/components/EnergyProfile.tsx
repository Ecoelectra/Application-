import { useId } from 'react';
import type { MechanismStep } from '../data/types';

interface Props {
  steps: MechanismStep[];
  /** Energieniveau der Produkte relativ zu den Edukten in kJ/mol */
  productEnergy?: number;
  onSelectStep?: (index: number) => void;
  activeStep?: number;
}

/**
 * Schematisches Energieprofil des Mechanismus.
 * Die Werte stammen aus der Datenbank und sind als Orientierung gedacht,
 * nicht als gemessene Aktivierungsenergien.
 */
export function EnergyProfile({ steps, productEnergy, onSelectStep, activeStep }: Props) {
  const gradientId = useId();
  const values = steps.map((step) => step.relativeEnergy ?? 0);
  if (!values.length) return null;

  // Kurvenverlauf: Edukte (0) → Zwischenschritte → Produkte
  const points = [0, ...values, ...(productEnergy !== undefined ? [productEnergy] : [])];
  const productIndex = productEnergy !== undefined ? points.length - 1 : -1;
  const width = Math.max(460, points.length * 130);
  const height = 220;
  const padding = { top: 26, right: 24, bottom: 42, left: 52 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const x = (index: number): number =>
    padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
  const y = (value: number): number =>
    padding.top + innerHeight - ((value - min) / span) * innerHeight;

  // Weiche Kurve über die Stützstellen
  const path = points
    .map((value, index) => {
      const px = x(index);
      const py = y(value);
      if (index === 0) return `M ${px} ${py}`;
      const prevX = x(index - 1);
      const controlX = (prevX + px) / 2;
      return `C ${controlX} ${y(points[index - 1])} ${controlX} ${py} ${px} ${py}`;
    })
    .join(' ');

  const zeroY = y(0);

  return (
    <div className="energy-profile">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img"
        aria-label="Schematisches Energieprofil der Reaktion">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--electro)" />
          </linearGradient>
        </defs>

        <line
          x1={padding.left - 8}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="var(--border-strong)"
          strokeDasharray="4 4"
        />
        <text x={8} y={zeroY + 4} fontSize="11" fill="var(--text-subtle)">
          Edukte
        </text>

        <line
          x1={padding.left - 8}
          y1={padding.top - 10}
          x2={padding.left - 8}
          y2={height - padding.bottom + 6}
          stroke="var(--border-strong)"
        />
        <text
          x={14}
          y={padding.top + 4}
          fontSize="11"
          fill="var(--text-subtle)"
        >
          E
        </text>

        <path d={path} fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />

        {points.map((value, index) => {
          const stepIndex = index - 1;
          const step = index === productIndex ? undefined : steps[stepIndex];
          const isActive = activeStep === stepIndex;
          return (
            <g key={index}>
              <circle
                cx={x(index)}
                cy={y(value)}
                r={isActive ? 7 : step?.rateDetermining ? 6 : 4.5}
                fill={
                  index === productIndex
                    ? 'var(--organic)'
                    : step?.rateDetermining
                      ? 'var(--electro)'
                      : 'var(--accent)'
                }
                stroke="var(--bg-elevated)"
                strokeWidth="2"
                style={{ cursor: step && onSelectStep ? 'pointer' : 'default' }}
                onClick={() => step && onSelectStep?.(stepIndex)}
              />
              {index > 0 && (
                <text
                  x={x(index)}
                  y={height - padding.bottom + 20}
                  fontSize="11"
                  textAnchor="middle"
                  fill="var(--text-subtle)"
                >
                  {index === productIndex ? 'Produkte' : index}
                </text>
              )}
              <text
                x={x(index)}
                y={y(value) - 12}
                fontSize="10"
                textAnchor="middle"
                fill="var(--text-muted)"
              >
                {value > 0 ? `+${value}` : value}
              </text>
            </g>
          );
        })}

        <text
          x={width / 2}
          y={height - 6}
          fontSize="11"
          textAnchor="middle"
          fill="var(--text-subtle)"
        >
          Reaktionskoordinate (Schritt)
        </text>
      </svg>
      <p className="subtle" style={{ marginTop: 4 }}>
        Relative Energien in kJ/mol, schematisch. Der violett markierte Punkt ist der
        geschwindigkeitsbestimmende Schritt.
      </p>
    </div>
  );
}
