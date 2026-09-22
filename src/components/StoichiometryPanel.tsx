import { useMemo, useState } from 'react';
import { molarMass } from '../chem/formula';
import { planReagents } from '../chem/stoichiometry';
import type { ReactionRule } from '../data/types';

interface Props {
  rule: ReactionRule;
}

/** Liest "1,2 Äq." oder "5–10 Äq." und liefert die erste Zahl. */
function parseEquivalents(text: string | undefined): number | null {
  if (!text) return null;
  const match = /(\d+(?:[.,]\d+)?)/.exec(text);
  return match ? Number(match[1].replace(',', '.')) : null;
}

/** Rechnet den Ansatz aus der Substratmenge auf alle Reagenzien um. */
export function StoichiometryPanel({ rule }: Props) {
  const [substrateMass, setSubstrateMass] = useState('5');
  const [substrateFormula, setSubstrateFormula] = useState(
    rule.reagents.find((reagent) => reagent.formula)?.formula ?? '',
  );

  const substrateMolarMass = useMemo(() => {
    if (!substrateFormula.trim()) return null;
    try {
      return molarMass(substrateFormula);
    } catch {
      return null;
    }
  }, [substrateFormula]);

  const mass = Number(substrateMass.replace(',', '.'));
  const amount =
    substrateMolarMass && Number.isFinite(mass) && mass > 0 ? mass / substrateMolarMass : null;

  const plan = useMemo(() => {
    if (!amount) return [];
    return planReagents(
      amount,
      rule.reagents
        .filter((reagent) => parseEquivalents(reagent.equivalents) !== null)
        .map((reagent) => ({
          name: reagent.name,
          formula: reagent.formula,
          equivalents: parseEquivalents(reagent.equivalents) as number,
        })),
    );
  }, [amount, rule.reagents]);

  return (
    <div className="card">
      <div className="card-title">
        <h3>Ansatz berechnen</h3>
      </div>
      <p className="muted small">
        Gib die Einwaage des Substrats an. Die Mengen der übrigen Reagenzien ergeben sich aus den
        Äquivalenten der Vorschrift.
      </p>

      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <div className="field">
          <label htmlFor="stoech-formel">Summenformel des Substrats</label>
          <input
            id="stoech-formel"
            className="input"
            value={substrateFormula}
            onChange={(event) => setSubstrateFormula(event.target.value)}
            placeholder="z. B. C2H4O2"
          />
          <span className="hint">
            {substrateMolarMass
              ? `M = ${substrateMolarMass.toFixed(2)} g/mol`
              : 'Formel eingeben, um die molare Masse zu bestimmen'}
          </span>
        </div>

        <div className="field">
          <label htmlFor="stoech-masse">Einwaage in g</label>
          <input
            id="stoech-masse"
            className="input"
            inputMode="decimal"
            value={substrateMass}
            onChange={(event) => setSubstrateMass(event.target.value)}
          />
          <span className="hint">
            {amount ? `n = ${amount.toFixed(4)} mol` : 'Masse eingeben'}
          </span>
        </div>
      </div>

      {plan.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Reagenz</th>
                <th className="num">Äquivalente</th>
                <th className="num">Stoffmenge</th>
                <th className="num">Masse</th>
                <th className="num">Volumen</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((entry) => (
                <tr key={entry.name}>
                  <td>
                    {entry.name}
                    {entry.formula && <span className="subtle mono"> {entry.formula}</span>}
                  </td>
                  <td className="num">{entry.equivalents.toFixed(2)}</td>
                  <td className="num">{entry.amount.toFixed(4)} mol</td>
                  <td className="num">{entry.molarMass > 0 ? `${entry.mass.toFixed(2)} g` : '–'}</td>
                  <td className="num">{entry.volume ? `${entry.volume.toFixed(1)} mL` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="subtle">
          Für diese Vorschrift sind keine Äquivalente hinterlegt oder die Formel ist unvollständig.
        </p>
      )}
    </div>
  );
}
