import { formatNumber, formatSigned } from '../chem/format';
import { describeEnthalpy, type EnthalpySource, type ReactionEnthalpy } from '../chem/thermo';
import { THERMO_SOURCE } from '../data/thermoData';

interface Props {
  enthalpy: ReactionEnthalpy | null | undefined;
  /** Stoffe ohne Bildungsenthalpie, falls nicht gerechnet werden konnte */
  missing?: string[];
  compact?: boolean;
}

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };

/** «SO4^2-» → «SO₄²⁻» */
export function prettySpecies(formula: string): string {
  const [body, charge] = formula.split('^');
  const lowered = body.replace(/([A-Za-z)\]])(\d+)/g, (_, before: string, digits: string) => before + [...digits].map((digit) => SUB[digit]).join(''));
  return charge ? `${lowered}${[...charge].map((char) => SUP[char] ?? char).join('')}` : lowered;
}

/** Gleichung in Caret-Schreibweise lesbar machen. */
export function prettyEquation(equation: string): string {
  return equation
    .split(' ')
    .map((part) => {
      const match = part.match(/^(.+?)(\((?:aq|s|l|g)\))$/);
      return match ? `${prettySpecies(match[1])}${match[2]}` : /^[A-Z[(]/.test(part) ? prettySpecies(part) : part;
    })
    .join(' ');
}

/** Typografisches Minus statt Bindestrich */
const minus = (text: string) => text.replace(/^-/, '−');

const PHASE_WORDS: Record<string, string> = { s: 'fest', l: 'flüssig', g: 'gasförmig', aq: 'gelöst' };
const SOURCE_TEXT: Record<EnthalpySource, string> = {
  Tabelle: 'Tabellenwert',
  Element: 'Element (0)',
  'Joback-Schätzung': 'geschätzt',
  'Ionen in Lösung': 'Summe der Ionen',
};

/** Reaktionsenthalpie mit Einordnung und aufklappbarer Rechnung (Satz von Hess). */
export function EnthalpyPanel({ enthalpy, missing, compact }: Props) {
  if (!enthalpy) {
    if (!missing?.length) return null;
    return (
      <p className="small subtle enthalpy-missing">
        ΔrH° nicht berechenbar: Für {missing.slice(0, 3).map(prettySpecies).join(', ')} ist keine Standardbildungsenthalpie hinterlegt.
      </p>
    );
  }
  const exo = enthalpy.deltaH < 0;
  const neutral = Math.abs(enthalpy.deltaH) < 5;
  const symbol = enthalpy.kind === 'Lösungsenthalpie' ? 'ΔlösH°' : 'ΔrH°';
  const tone = neutral ? 'neutral' : exo ? 'exo' : 'endo';
  return (
    <div className={`enthalpy enthalpy-${tone}${compact ? ' enthalpy-compact' : ''}`}>
      <div className="enthalpy-head">
        <span className="enthalpy-icon" aria-hidden="true">{neutral ? '≈' : exo ? '🔥' : '❄'}</span>
        <div>
          <div>
            <strong>
              {enthalpy.kind}: {symbol} = {minus(formatSigned(enthalpy.deltaH, 1))} kJ/mol
            </strong>
            {enthalpy.estimated && <span className="badge badge-warning" style={{ marginLeft: 8 }} title="Mindestens eine Bildungsenthalpie ist nach Joback geschätzt">geschätzt</span>}
          </div>
          <div className="small">{describeEnthalpy(enthalpy)}</div>
        </div>
      </div>
      <details className="small enthalpy-details">
        <summary>Rechnung (Satz von Hess)</summary>
        <div className="equation-scroll" style={{ marginTop: 6 }}>
          <span className="mono">{prettyEquation(enthalpy.equation)}</span>
        </div>
        <div className="table-wrap" style={{ marginTop: 6 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Stoff</th>
                <th>Zustand</th>
                <th>ν</th>
                <th>ΔfH° in kJ/mol</th>
                <th>Herkunft</th>
              </tr>
            </thead>
            <tbody>
              {enthalpy.terms.map((term, index) => (
                <tr key={`${term.side}-${term.formula}-${index}`}>
                  <td>
                    {term.side === 'edukt' ? '− ' : '+ '}
                    {term.label !== term.formula ? `${term.label} (${prettySpecies(term.formula)})` : prettySpecies(term.formula)}
                  </td>
                  <td>{PHASE_WORDS[term.phase]}</td>
                  <td>{formatNumber(term.coefficient, Number.isInteger(term.coefficient) ? 0 : 1)}</td>
                  <td>{minus(formatNumber(term.value, 1))}</td>
                  <td>{SOURCE_TEXT[term.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="subtle" style={{ marginBottom: 0 }}>
          ΔrH° = Σ ν·ΔfH°(Produkte) − Σ ν·ΔfH°(Edukte), je Formelumsatz der Gleichung, bei Standardbedingungen (25 °C, 1 bar). Werte: {THERMO_SOURCE}.
          {enthalpy.estimated &&
            ' Fehlende organische Werte sind nach der Gruppenbeitragsmethode von Joback geschätzt (Abweichung meist unter 10, im Mittel etwa 20 kJ/mol).'}
          {enthalpy.terms.some((term) => term.source === 'Ionen in Lösung') &&
            ' In Wasser gelöste Salze, starke Säuren und Basen sind als Ionen gerechnet.'}
          {enthalpy.note ? ` ${enthalpy.note}` : ''}
        </p>
      </details>
    </div>
  );
}
