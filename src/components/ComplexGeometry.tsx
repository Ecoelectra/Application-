import type { ComplexAnalysis } from '../chem/complexes';

/** Positionen der Liganden je Geometrie, als räumliche Projektion (x, y, Tiefe). */
const POSITIONS: Record<ComplexAnalysis['geometry'], Array<[number, number, number]>> = {
  linear: [[-1, 0, 0], [1, 0, 0]],
  tetraedrisch: [[0, -1, 0], [-0.94, 0.45, 0.4], [0.94, 0.45, 0.4], [0.2, 0.55, -1]],
  'quadratisch-planar': [[-1, 0.25, 0.3], [1, -0.25, -0.3], [0.35, 0.6, 0.6], [-0.35, -0.6, -0.6]],
  'trigonal-bipyramidal': [[0, -1, 0], [0, 1, 0], [-0.95, 0.15, 0.3], [0.95, 0.15, 0.3], [0, -0.1, -1]],
  oktaedrisch: [[0, -1, 0], [0, 1, 0], [-1, 0.2, 0.3], [1, -0.2, -0.3], [0.35, 0.55, 0.6], [-0.35, -0.55, -0.6]],
};

/** Paare benachbarter Positionen, die ein zweizähniger Ligand überspannen kann. */
const CHELATE_PAIRS: Record<ComplexAnalysis['geometry'], Array<[number, number]>> = {
  linear: [],
  tetraedrisch: [[0, 1], [2, 3]],
  'quadratisch-planar': [[0, 2], [1, 3]],
  'trigonal-bipyramidal': [[0, 2], [1, 3]],
  oktaedrisch: [[0, 2], [1, 3], [4, 5]],
};

/** Zeichnet den Komplex räumlich: Zentralion, Bindungen, Liganden. */
export function ComplexGeometry({ complex, size = 260 }: { complex: ComplexAnalysis; size?: number }) {
  const positions = POSITIONS[complex.geometry];
  const center = size / 2;
  const radius = size * 0.34;

  // Liganden auf die Positionen verteilen; mehrzähnige belegen benachbarte Plätze
  const slots: Array<{ label: string; chelateWith?: number }> = Array(positions.length).fill(null).map(() => ({ label: '' }));
  const free = new Set(positions.map((_, index) => index));
  const pairs = [...CHELATE_PAIRS[complex.geometry]];

  for (const entry of complex.ligands) {
    for (let n = 0; n < entry.count; n++) {
      if (entry.ligand.denticity === 2) {
        const pair = pairs.find(([a, b]) => free.has(a) && free.has(b));
        if (pair) {
          free.delete(pair[0]);
          free.delete(pair[1]);
          slots[pair[0]] = { label: entry.ligand.abbreviation ?? entry.ligand.label, chelateWith: pair[1] };
          slots[pair[1]] = { label: '' };
          continue;
        }
      }
      if (entry.ligand.denticity >= 4) {
        for (const index of Array.from(free)) {
          slots[index] = { label: entry.ligand.abbreviation?.toUpperCase() ?? entry.ligand.label };
          free.delete(index);
        }
        continue;
      }
      const index = free.values().next().value as number | undefined;
      if (index === undefined) continue;
      free.delete(index);
      slots[index] = { label: entry.ligand.label };
    }
  }

  const points = positions.map(([x, y, depth]) => ({
    x: center + x * radius,
    y: center + y * radius,
    depth,
  }));

  // Hintere Liganden zuerst zeichnen
  const order = points.map((_, index) => index).sort((a, b) => points[a].depth - points[b].depth);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size }}
      role="img"
      aria-label={`Räumlicher Aufbau: ${complex.geometry}`}
      className="complex-geometry"
    >
      {/* Chelatbögen */}
      {slots.map((slot, index) =>
        slot.chelateWith !== undefined ? (
          <path
            key={`bogen-${index}`}
            d={`M ${points[index].x} ${points[index].y} Q ${center + (points[index].x + points[slot.chelateWith].x - 2 * center) * 0.9} ${center + (points[index].y + points[slot.chelateWith].y - 2 * center) * 0.9} ${points[slot.chelateWith].x} ${points[slot.chelateWith].y}`}
            fill="none"
            stroke="var(--organic)"
            strokeWidth={3}
            opacity={0.7}
          />
        ) : null,
      )}

      {order.map((index) => {
        const point = points[index];
        const behind = point.depth < -0.2;
        return (
          <g key={`bindung-${index}`} opacity={behind ? 0.55 : 1}>
            <line
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="var(--text-muted)"
              strokeWidth={behind ? 2 : 3}
              strokeDasharray={behind ? '4 4' : undefined}
            />
          </g>
        );
      })}

      <circle cx={center} cy={center} r={size * 0.09} fill="var(--accent)" />
      <text x={center} y={center + 5} textAnchor="middle" fontSize={size * 0.065} fontWeight={700} fill="#fff">
        {complex.metal.symbol}
      </text>

      {order.map((index) => {
        const point = points[index];
        const slot = slots[index];
        const behind = point.depth < -0.2;
        return (
          <g key={`ligand-${index}`} opacity={behind ? 0.6 : 1}>
            <circle cx={point.x} cy={point.y} r={size * 0.075} fill="var(--bg-elevated)" stroke="var(--border-strong)" strokeWidth={1.5} />
            <text x={point.x} y={point.y + 4} textAnchor="middle" fontSize={size * 0.045} fill="var(--text)">
              {slot.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Aufspaltungsdiagramm der d-Orbitale mit Elektronen als Pfeile. */
export function OrbitalDiagram({ complex, width = 300 }: { complex: ComplexAnalysis; width?: number }) {
  const height = 210;
  const top = 26;
  const bottom = height - 30;
  const boxWidth = 30;
  const boxHeight = 26;
  const levels = complex.levels;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width }} role="img" aria-label="Aufspaltung der d-Orbitale">
      <line x1={24} y1={top} x2={24} y2={bottom} stroke="var(--border-strong)" />
      <polygon points={`20,${top + 6} 24,${top - 2} 28,${top + 6}`} fill="var(--border-strong)" />
      <text x={12} y={top + 60} fontSize={11} fill="var(--text-subtle)" transform={`rotate(-90 12 ${top + 60})`}>
        Energie
      </text>

      {levels.map((level) => {
        const y = bottom - level.energy * (bottom - top - boxHeight) - boxHeight;
        const totalWidth = level.orbitals * (boxWidth + 4);
        const startX = (width + 30) / 2 - totalWidth / 2;
        return (
          <g key={level.label}>
            {level.occupancy.map((electrons, index) => {
              const x = startX + index * (boxWidth + 4);
              return (
                <g key={index}>
                  <rect x={x} y={y} width={boxWidth} height={boxHeight} rx={4} fill="var(--bg-sunken)" stroke="var(--border-strong)" />
                  {electrons >= 1 && (
                    <text x={x + (electrons === 2 ? 9 : 15)} y={y + 19} textAnchor="middle" fontSize={16} fill="var(--accent)">
                      ↑
                    </text>
                  )}
                  {electrons === 2 && (
                    <text x={x + 21} y={y + 19} textAnchor="middle" fontSize={16} fill="var(--electro)">
                      ↓
                    </text>
                  )}
                </g>
              );
            })}
            <text x={startX + totalWidth + 6} y={y + 17} fontSize={12} fill="var(--text-muted)">
              {level.label.split(', ').map((part, index) => {
                const [main, sub] = part.split('_');
                return (
                  <tspan key={part}>
                    {index > 0 ? ', ' : ''}
                    {main}
                    {sub && (
                      <tspan baselineShift="sub" fontSize={9}>
                        {sub}
                      </tspan>
                    )}
                  </tspan>
                );
              })}
            </text>
          </g>
        );
      })}

      {(complex.geometry === 'oktaedrisch' || complex.geometry === 'tetraedrisch') && (
        <text x={width - 8} y={(top + bottom) / 2} textAnchor="end" fontSize={12} fill="var(--text-subtle)">
          {complex.geometry === 'oktaedrisch' ? 'Δₒ' : 'Δₜ'}
        </text>
      )}
    </svg>
  );
}
