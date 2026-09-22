interface Props {
  codes: string[];
}

const PICTOGRAMS: Record<string, { symbol: string; label: string }> = {
  GHS01: { symbol: '💥', label: 'Explosiv' },
  GHS02: { symbol: '🔥', label: 'Entzündbar' },
  GHS03: { symbol: '⭕', label: 'Brandfördernd' },
  GHS04: { symbol: '🛢', label: 'Gas unter Druck' },
  GHS05: { symbol: '🧪', label: 'Ätzend' },
  GHS06: { symbol: '☠️', label: 'Giftig' },
  GHS07: { symbol: '❗', label: 'Gesundheitsschädlich' },
  GHS08: { symbol: '🫁', label: 'Gesundheitsgefahr' },
  GHS09: { symbol: '🐟', label: 'Umweltgefährlich' },
};

/** Zeigt die GHS-Gefahrenkennzeichen als Rautensymbole. */
export function GhsPictograms({ codes }: Props) {
  const normalized = Array.from(
    new Set(
      codes
        .map((code) => {
          const match = /GHS0\d/.exec(code.toUpperCase());
          return match ? match[0] : null;
        })
        .filter((code): code is string => Boolean(code)),
    ),
  );

  if (!normalized.length) return null;

  return (
    <div className="ghs-list">
      {normalized.map((code) => {
        const entry = PICTOGRAMS[code];
        return (
          <div className="ghs-entry" key={code}>
            <div className="ghs-pictogram" title={entry?.label ?? code}>
              <span aria-hidden="true">{entry?.symbol ?? '!'}</span>
            </div>
            <span className="label">{entry?.label ?? code}</span>
          </div>
        );
      })}
    </div>
  );
}
