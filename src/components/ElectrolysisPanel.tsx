import { useMemo, useState } from 'react';
import {
  chargePerMole,
  electrolysisEnergy,
  faradayElectrolysis,
  FARADAY,
} from '../chem/electro';
import { molarMass } from '../chem/formula';
import type { ElectroSpec, ReactionRule } from '../data/types';
import { Callout } from './Callout';

interface Props {
  spec: ElectroSpec;
  rule: ReactionRule;
}

/** Zellparameter und Faraday-Rechner für eine elektrochemische Reaktion. */
export function ElectrolysisPanel({ spec, rule }: Props) {
  const [current, setCurrent] = useState('0,5');
  const [time, setTime] = useState('60');
  const [formula, setFormula] = useState(
    rule.fixedEquation?.products[0] ?? rule.reagents.find((r) => r.formula)?.formula ?? '',
  );
  const [efficiency, setEfficiency] = useState('80');
  const [voltage, setVoltage] = useState('3,0');

  const electrons = spec.electrons ?? 2;

  const result = useMemo(() => {
    const currentValue = Number(current.replace(',', '.'));
    const minutes = Number(time.replace(',', '.'));
    const efficiencyValue = Number(efficiency.replace(',', '.')) / 100;
    let molar = 0;
    try {
      molar = formula ? molarMass(formula) : 0;
    } catch {
      molar = 0;
    }
    if (!Number.isFinite(currentValue) || !Number.isFinite(minutes) || currentValue <= 0) {
      return null;
    }
    const faraday = faradayElectrolysis({
      current: currentValue,
      time: minutes * 60,
      electrons,
      molarMass: molar,
      efficiency: Number.isFinite(efficiencyValue) ? efficiencyValue : 1,
    });
    const cellVoltage = Number(voltage.replace(',', '.'));
    return {
      ...faraday,
      molar,
      energy: Number.isFinite(cellVoltage)
        ? electrolysisEnergy(cellVoltage, faraday.charge)
        : null,
    };
  }, [current, time, formula, efficiency, voltage, electrons]);

  return (
    <div className="stack">
      <div className="card">
        <h3>Zellparameter</h3>
        <div className="table-wrap">
          <table className="data">
            <tbody>
              <tr>
                <td>Zelle</td>
                <td className="wrap">{spec.cellType}</td>
              </tr>
              <tr>
                <td>Anode</td>
                <td className="wrap">{spec.anode}</td>
              </tr>
              <tr>
                <td>Kathode</td>
                <td className="wrap">{spec.cathode}</td>
              </tr>
              <tr>
                <td>Elektrolyt</td>
                <td className="wrap">{spec.electrolyte}</td>
              </tr>
              <tr>
                <td>Betriebsart</td>
                <td>{spec.mode}</td>
              </tr>
              {spec.currentDensity && (
                <tr>
                  <td>Stromdichte</td>
                  <td>{spec.currentDensity}</td>
                </tr>
              )}
              {spec.potential && (
                <tr>
                  <td>Potential / Spannung</td>
                  <td className="wrap">{spec.potential}</td>
                </tr>
              )}
              {spec.charge && (
                <tr>
                  <td>Ladungsbedarf</td>
                  <td>{spec.charge}</td>
                </tr>
              )}
              {spec.faradaicEfficiency && (
                <tr>
                  <td>Stromausbeute</td>
                  <td>{spec.faradaicEfficiency}</td>
                </tr>
              )}
              {spec.mediator && (
                <tr>
                  <td>Mediator</td>
                  <td className="wrap">{spec.mediator}</td>
                </tr>
              )}
              <tr>
                <td>Übertragene Elektronen</td>
                <td>{electrons} e⁻ je Formelumsatz</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Faraday-Rechner</h3>
        <p className="muted small">
          n = (I · t · η) / (z · F) mit F = {FARADAY.toFixed(0)} C/mol. Die Ladungsmenge bestimmt
          den Umsatz, die Zellspannung den Energiebedarf.
        </p>

        <div className="grid grid-3" style={{ marginBottom: 14 }}>
          <div className="field">
            <label htmlFor="el-strom">Stromstärke in A</label>
            <input id="el-strom" className="input" inputMode="decimal" value={current}
              onChange={(event) => setCurrent(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="el-zeit">Dauer in min</label>
            <input id="el-zeit" className="input" inputMode="decimal" value={time}
              onChange={(event) => setTime(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="el-formel">Produktformel</label>
            <input id="el-formel" className="input" value={formula}
              onChange={(event) => setFormula(event.target.value)} placeholder="z. B. Cl2" />
          </div>
          <div className="field">
            <label htmlFor="el-ausbeute">Stromausbeute in %</label>
            <input id="el-ausbeute" className="input" inputMode="decimal" value={efficiency}
              onChange={(event) => setEfficiency(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="el-spannung">Zellspannung in V</label>
            <input id="el-spannung" className="input" inputMode="decimal" value={voltage}
              onChange={(event) => setVoltage(event.target.value)} />
          </div>
        </div>

        {result ? (
          <div className="table-wrap">
            <table className="data">
              <tbody>
                <tr>
                  <td>Ladungsmenge Q = I · t</td>
                  <td className="num">{result.charge.toFixed(0)} C</td>
                </tr>
                <tr>
                  <td>Umgesetzte Stoffmenge</td>
                  <td className="num">{result.amount.toFixed(5)} mol</td>
                </tr>
                {result.molar > 0 && (
                  <tr>
                    <td>Produktmasse (M = {result.molar.toFixed(2)} g/mol)</td>
                    <td className="num">{result.mass.toFixed(3)} g</td>
                  </tr>
                )}
                <tr>
                  <td>Gasvolumen bei Normbedingungen</td>
                  <td className="num">{result.gasVolumeSTP.toFixed(3)} L</td>
                </tr>
                <tr>
                  <td>Ladungsbedarf</td>
                  <td className="num">{chargePerMole(electrons).toFixed(1)} F/mol</td>
                </tr>
                {result.energy !== null && (
                  <tr>
                    <td>Elektrische Arbeit</td>
                    <td className="num">{result.energy.toFixed(4)} kWh</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="subtle">Bitte Stromstärke und Dauer angeben.</p>
        )}

        <div style={{ marginTop: 14 }}>
          <Callout variant="info" title="Warum weicht die Praxis ab?">
            Die reale Zellspannung liegt über der Zersetzungsspannung: Überspannungen an beiden
            Elektroden und der ohmsche Spannungsabfall im Elektrolyten kommen hinzu. Genau darüber
            lässt sich die Selektivität steuern – etwa wenn an der Kathode Wasserstoff statt des
            gewünschten Produkts entsteht.
          </Callout>
        </div>
      </div>
    </div>
  );
}
