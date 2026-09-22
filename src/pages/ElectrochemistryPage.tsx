import { useMemo, useState } from 'react';
import {
  evaluateCell,
  faradayElectrolysis,
  hydrogenElectrodePotential,
  nernstPotential,
  nernstSlope,
  specificEnergyDemand,
} from '../chem/electro';
import { molarMass } from '../chem/formula';
import { POTENTIALS_BY_STRENGTH, STANDARD_POTENTIALS } from '../data/potentials';
import { REACTIONS } from '../data/reactions';
import { ReactionCard } from '../components/ReactionCard';
import { Callout } from '../components/Callout';
import { formatExponential, formatNumber, formatSigned } from '../chem/format';

type Tab = 'spannungsreihe' | 'nernst' | 'zelle' | 'faraday' | 'synthesen';

const num = (value: string): number => Number(value.replace(',', '.'));

export function ElectrochemistryPage() {
  const [tab, setTab] = useState<Tab>('spannungsreihe');

  return (
    <main className="page">
      <header className="page-header">
        <h1>Elektrochemie</h1>
        <p>
          Spannungsreihe, Nernst-Gleichung, Zellspannung und Faradaysche Gesetze – und die
          Elektrosynthesen, bei denen der Strom das Reagenz ersetzt.
        </p>
      </header>

      <div className="tabs" role="tablist">
        {([
          ['spannungsreihe', 'Spannungsreihe'],
          ['nernst', 'Nernst-Gleichung'],
          ['zelle', 'Galvanische Zelle'],
          ['faraday', 'Elektrolyse'],
          ['synthesen', 'Elektrosynthesen'],
        ] as Array<[Tab, string]>).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'spannungsreihe' && <PotentialTable />}
      {tab === 'nernst' && <NernstCalculator />}
      {tab === 'zelle' && <CellCalculator />}
      {tab === 'faraday' && <FaradayCalculator />}
      {tab === 'synthesen' && <ElectroSyntheses />}
    </main>
  );
}

function PotentialTable() {
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return POTENTIALS_BY_STRENGTH;
    return POTENTIALS_BY_STRENGTH.filter(
      (entry) =>
        entry.halfReaction.toLowerCase().includes(needle) ||
        entry.oxidized.toLowerCase().includes(needle) ||
        entry.reduced.toLowerCase().includes(needle),
    );
  }, [filter]);

  return (
    <div className="stack">
      <div className="card">
        <input
          className="input"
          type="search"
          value={filter}
          placeholder="Halbzelle suchen, z. B. Cu, MnO4, Chlor …"
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Spannungsreihe durchsuchen"
        />
        <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
          Standardpotentiale gegen die Normalwasserstoffelektrode bei 25 °C. Oben stehen die
          stärksten Oxidationsmittel, unten die stärksten Reduktionsmittel. Je weiter zwei
          Halbzellen auseinanderliegen, desto größer ist die Zellspannung.
        </p>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th className="wrap">Reduktionsgleichung</th>
                <th className="num">z</th>
                <th className="num">E° in V</th>
                <th>Gruppe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.halfReaction}>
                  <td className="wrap mono">{entry.halfReaction}</td>
                  <td className="num">{entry.electrons}</td>
                  <td className="num" style={{ color: entry.potential > 0 ? 'var(--organic)' : 'var(--danger)' }}>
                    {formatSigned(entry.potential, 3)}
                  </td>
                  <td className="subtle">{entry.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NernstCalculator() {
  const [standardPotential, setStandardPotential] = useState('0,342');
  const [electrons, setElectrons] = useState('2');
  const [oxidized, setOxidized] = useState('0,001');
  const [reduced, setReduced] = useState('1');
  const [temperature, setTemperature] = useState('25');
  const [pH, setPH] = useState('7');

  const result = useMemo(() => {
    const temperatureK = num(temperature) + 273.15;
    const quotient = num(oxidized) / num(reduced);
    try {
      return {
        potential: nernstPotential({
          standardPotential: num(standardPotential),
          electrons: num(electrons),
          quotient,
          temperature: temperatureK,
        }),
        slope: nernstSlope(temperatureK),
        quotient,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [standardPotential, electrons, oxidized, reduced, temperature]);

  return (
    <div className="stack">
      <div className="card">
        <h3>Nernst-Gleichung</h3>
        <div className="equation-scroll">
          <div className="equation-text">E = E° + (R·T)/(z·F) · ln([Ox]/[Red])</div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 14 }}>
          <div className="field">
            <label htmlFor="n-e0">Standardpotential E° in V</label>
            <input id="n-e0" className="input" inputMode="decimal" value={standardPotential}
              onChange={(event) => setStandardPotential(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="n-z">Elektronen z</label>
            <input id="n-z" className="input" inputMode="numeric" value={electrons}
              onChange={(event) => setElectrons(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="n-t">Temperatur in °C</label>
            <input id="n-t" className="input" inputMode="decimal" value={temperature}
              onChange={(event) => setTemperature(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="n-ox">c(oxidierte Form) in mol/L</label>
            <input id="n-ox" className="input" inputMode="decimal" value={oxidized}
              onChange={(event) => setOxidized(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="n-red">c(reduzierte Form) in mol/L</label>
            <input id="n-red" className="input" inputMode="decimal" value={reduced}
              onChange={(event) => setReduced(event.target.value)} />
          </div>
        </div>

        {'error' in result ? (
          <Callout variant="warning">{result.error}</Callout>
        ) : (
          <div className="table-wrap" style={{ marginTop: 6 }}>
            <table className="data">
              <tbody>
                <tr>
                  <td>Reaktionsquotient [Ox]/[Red]</td>
                  <td className="num">{formatExponential(result.quotient, 3)}</td>
                </tr>
                <tr>
                  <td>Nernst-Faktor (R·T/F)·ln10</td>
                  <td className="num">{formatNumber(result.slope, 4)} V</td>
                </tr>
                <tr>
                  <td><strong>Potential E</strong></td>
                  <td className="num"><strong>{formatNumber(result.potential, 4)} V</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Wasserstoffelektrode und pH-Wert</h3>
        <p className="muted small">
          Für 2 H⁺ + 2 e⁻ ⇌ H₂ gilt E = −0,0592 V · pH. Das erklärt, warum Wasser im Neutralen
          erst bei −0,41 V reduziert wird.
        </p>
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="n-ph">pH-Wert</label>
          <input id="n-ph" className="input" inputMode="decimal" value={pH}
            onChange={(event) => setPH(event.target.value)} />
        </div>
        <p style={{ marginTop: 10, marginBottom: 0 }}>
          E(H⁺/H₂) = <strong>{formatNumber(hydrogenElectrodePotential(num(pH)), 4)} V</strong>
        </p>
      </div>
    </div>
  );
}

function CellCalculator() {
  const [cathode, setCathode] = useState('Cu2+|Cu');
  const [anode, setAnode] = useState('Zn2+|Zn');

  const cathodeEntry = STANDARD_POTENTIALS.find((e) => `${e.oxidized}|${e.reduced}` === cathode);
  const anodeEntry = STANDARD_POTENTIALS.find((e) => `${e.oxidized}|${e.reduced}` === anode);

  const electrons = Math.max(cathodeEntry?.electrons ?? 1, anodeEntry?.electrons ?? 1);
  const result =
    cathodeEntry && anodeEntry
      ? evaluateCell(cathodeEntry.potential, anodeEntry.potential, electrons)
      : null;

  return (
    <div className="stack">
      <div className="card">
        <h3>Zellspannung berechnen</h3>
        <p className="muted small">
          Wähle zwei Halbzellen. An der Kathode läuft die Reduktion, an der Anode die Oxidation.
          E°(Zelle) = E°(Kathode) − E°(Anode).
        </p>

        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="z-kathode">Kathode (Reduktion, Pluspol)</label>
            <select id="z-kathode" className="select" value={cathode}
              onChange={(event) => setCathode(event.target.value)}>
              {POTENTIALS_BY_STRENGTH.map((entry) => (
                <option key={`k-${entry.halfReaction}`} value={`${entry.oxidized}|${entry.reduced}`}>
                  {entry.halfReaction} ({formatSigned(entry.potential, 2)} V)
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="z-anode">Anode (Oxidation, Minuspol)</label>
            <select id="z-anode" className="select" value={anode}
              onChange={(event) => setAnode(event.target.value)}>
              {POTENTIALS_BY_STRENGTH.map((entry) => (
                <option key={`a-${entry.halfReaction}`} value={`${entry.oxidized}|${entry.reduced}`}>
                  {entry.halfReaction} ({formatSigned(entry.potential, 2)} V)
                </option>
              ))}
            </select>
          </div>
        </div>

        {result && (
          <>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="data">
                <tbody>
                  <tr>
                    <td>Zellspannung E°</td>
                    <td className="num">
                      <strong>{formatNumber(result.cellPotential, 3)} V</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>Übertragene Elektronen z</td>
                    <td className="num">{electrons}</td>
                  </tr>
                  <tr>
                    <td>Freie Reaktionsenthalpie ΔG° = −z·F·E°</td>
                    <td className="num">{formatNumber(result.gibbsEnergy, 1)} kJ/mol</td>
                  </tr>
                  <tr>
                    <td>Gleichgewichtskonstante K</td>
                    <td className="num">
                      {Number.isFinite(result.equilibriumConstant)
                        ? formatExponential(result.equilibriumConstant, 2)
                        : 'praktisch vollständig'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14 }}>
              <Callout variant={result.spontaneous ? 'success' : 'warning'}>
                {result.spontaneous
                  ? 'Die Zellspannung ist positiv: Die Reaktion läuft freiwillig ab – das ist ein galvanisches Element.'
                  : 'Die Zellspannung ist negativ: Die Reaktion läuft nur erzwungen ab. Es wird mindestens diese Spannung als Zersetzungsspannung benötigt (plus Überspannungen).'}
              </Callout>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FaradayCalculator() {
  const [current, setCurrent] = useState('2');
  const [minutes, setMinutes] = useState('60');
  const [electrons, setElectrons] = useState('2');
  const [formula, setFormula] = useState('Cu');
  const [efficiency, setEfficiency] = useState('100');
  const [voltage, setVoltage] = useState('3,1');

  const result = useMemo(() => {
    let molar = 0;
    try {
      molar = formula ? molarMass(formula) : 0;
    } catch {
      molar = 0;
    }
    const currentValue = num(current);
    if (!Number.isFinite(currentValue) || currentValue <= 0 || !molar) return null;
    const faraday = faradayElectrolysis({
      current: currentValue,
      time: num(minutes) * 60,
      electrons: num(electrons),
      molarMass: molar,
      efficiency: num(efficiency) / 100,
    });
    return {
      ...faraday,
      molar,
      specific: specificEnergyDemand(num(voltage), num(electrons), molar, num(efficiency) / 100),
    };
  }, [current, minutes, electrons, formula, efficiency, voltage]);

  return (
    <div className="stack">
      <div className="card">
        <h3>Faradaysche Gesetze</h3>
        <div className="equation-scroll">
          <div className="equation-text">n = (I · t · η) / (z · F)   und   m = n · M</div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 14 }}>
          <div className="field">
            <label htmlFor="f-i">Stromstärke in A</label>
            <input id="f-i" className="input" inputMode="decimal" value={current}
              onChange={(event) => setCurrent(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-t">Dauer in min</label>
            <input id="f-t" className="input" inputMode="decimal" value={minutes}
              onChange={(event) => setMinutes(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-z">Elektronen z</label>
            <input id="f-z" className="input" inputMode="numeric" value={electrons}
              onChange={(event) => setElectrons(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-m">Stoff (Summenformel)</label>
            <input id="f-m" className="input" value={formula}
              onChange={(event) => setFormula(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-eta">Stromausbeute in %</label>
            <input id="f-eta" className="input" inputMode="decimal" value={efficiency}
              onChange={(event) => setEfficiency(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-u">Zellspannung in V</label>
            <input id="f-u" className="input" inputMode="decimal" value={voltage}
              onChange={(event) => setVoltage(event.target.value)} />
          </div>
        </div>

        {result ? (
          <div className="table-wrap">
            <table className="data">
              <tbody>
                <tr>
                  <td>Ladungsmenge Q</td>
                  <td className="num">{formatNumber(result.charge, 0)} C</td>
                </tr>
                <tr>
                  <td>Stoffmenge n</td>
                  <td className="num">{formatNumber(result.amount, 5)} mol</td>
                </tr>
                <tr>
                  <td>Masse m (M = {formatNumber(result.molar, 2)} g/mol)</td>
                  <td className="num"><strong>{formatNumber(result.mass, 3)} g</strong></td>
                </tr>
                <tr>
                  <td>Gasvolumen bei Normbedingungen</td>
                  <td className="num">{formatNumber(result.gasVolumeSTP, 3)} L</td>
                </tr>
                <tr>
                  <td>Spezifischer Energiebedarf</td>
                  <td className="num">{formatNumber(result.specific, 2)} kWh/kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="subtle">Bitte gültige Werte und eine bekannte Summenformel eingeben.</p>
        )}
      </div>
    </div>
  );
}

function ElectroSyntheses() {
  const electroReactions = REACTIONS.filter((rule) => rule.electro);

  return (
    <div className="stack">
      <Callout variant="info" title="Warum elektrochemisch synthetisieren?">
        Das Elektron ist das sauberste Reagenz: Es hinterlässt keine Nebenprodukte, und über das
        Potential lässt sich die Reaktionstiefe genau einstellen. Statt stöchiometrischer Oxidations-
        oder Reduktionsmittel braucht man nur Strom, zwei Elektroden und ein Leitsalz.
      </Callout>

      <div className="grid grid-2">
        {electroReactions.map((rule) => (
          <ReactionCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}
