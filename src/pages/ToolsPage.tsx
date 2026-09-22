import { useMemo, useState } from 'react';
import { balanceEquation } from '../chem/balance';
import { balanceRedox, formatOxidationState, oxidationStates, type Medium } from '../chem/redox';
import { elementalComposition, molarMass } from '../chem/formula';
import { dilutionVolume, limitingReagent, massForSolution, percentYield } from '../chem/stoichiometry';
import { Callout } from '../components/Callout';

type Tab = 'ausgleichen' | 'redox' | 'molmasse' | 'stoechiometrie';

const num = (value: string): number => Number(value.replace(',', '.'));

export function ToolsPage() {
  const [tab, setTab] = useState<Tab>('ausgleichen');

  return (
    <main className="page">
      <header className="page-header">
        <h1>Werkzeuge</h1>
        <p>
          Gleichungen ausgleichen, Redoxreaktionen über Halbreaktionen aufstellen, Molmassen und
          Ansätze berechnen – alles offline verfügbar.
        </p>
      </header>

      <div className="tabs" role="tablist">
        {([
          ['ausgleichen', 'Gleichung ausgleichen'],
          ['redox', 'Redoxgleichungen'],
          ['molmasse', 'Molmasse & Analyse'],
          ['stoechiometrie', 'Stöchiometrie'],
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

      {tab === 'ausgleichen' && <EquationBalancer />}
      {tab === 'redox' && <RedoxBalancer />}
      {tab === 'molmasse' && <MolarMassTool />}
      {tab === 'stoechiometrie' && <StoichiometryTools />}
    </main>
  );
}

const EXAMPLES = [
  'C3H8 + O2 -> CO2 + H2O',
  'Al + Fe2O3 -> Al2O3 + Fe',
  'MnO4^- + Fe2+ + H+ -> Mn2+ + Fe3+ + H2O',
  'NH3 + O2 -> NO + H2O',
  'CO2 + H2O -> C6H12O6 + O2',
];

function EquationBalancer() {
  const [input, setInput] = useState('C3H8 + O2 -> CO2 + H2O');

  const result = useMemo(() => {
    try {
      return { value: balanceEquation(input) };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [input]);

  return (
    <div className="stack">
      <div className="card">
        <h3>Reaktionsgleichung ausgleichen</h3>
        <p className="muted small">
          Schreibe die Gleichung mit «+» zwischen den Stoffen und «-&gt;» als Reaktionspfeil.
          Ladungen werden als <code>Fe3+</code> oder <code>SO4^2-</code> geschrieben, Kristallwasser
          als <code>CuSO4·5H2O</code>.
        </p>

        <input
          className="input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Reaktionsgleichung"
          spellCheck={false}
        />

        <div className="row" style={{ marginTop: 10 }}>
          <span className="subtle">Beispiele:</span>
          {EXAMPLES.map((example) => (
            <button key={example} type="button" className="chip" onClick={() => setInput(example)}>
              {example.split('->')[0].trim()} →
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {'error' in result ? (
            <Callout variant="warning" title="Das hat nicht geklappt">
              {result.error}
            </Callout>
          ) : (
            <>
              <div className="equation-scroll">
                <div className="equation-text">{result.value.equation}</div>
              </div>
              {result.value.warnings.map((warning) => (
                <div key={warning} style={{ marginTop: 10 }}>
                  <Callout variant="info">{warning}</Callout>
                </div>
              ))}
              <div className="table-wrap" style={{ marginTop: 14 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Stoff</th>
                      <th className="num">Koeffizient</th>
                      <th className="num">M in g/mol</th>
                      <th>Seite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...result.value.reactants.map((entry) => ({ ...entry, side: 'Edukt' })),
                      ...result.value.products.map((entry) => ({ ...entry, side: 'Produkt' })),
                    ].map((entry) => {
                      let mass = 0;
                      try {
                        mass = molarMass(entry.formula);
                      } catch {
                        mass = 0;
                      }
                      return (
                        <tr key={`${entry.side}-${entry.formula}`}>
                          <td className="mono">{entry.formula}</td>
                          <td className="num">{entry.coefficient}</td>
                          <td className="num">{mass ? mass.toFixed(2) : '–'}</td>
                          <td className="subtle">{entry.side}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RedoxBalancer() {
  const [oxidationFrom, setOxidationFrom] = useState('Fe2+');
  const [oxidationTo, setOxidationTo] = useState('Fe3+');
  const [reductionFrom, setReductionFrom] = useState('MnO4^-');
  const [reductionTo, setReductionTo] = useState('Mn2+');
  const [medium, setMedium] = useState<Medium>('sauer');

  const result = useMemo(() => {
    try {
      return {
        value: balanceRedox(
          { from: oxidationFrom, to: oxidationTo },
          { from: reductionFrom, to: reductionTo },
          medium,
        ),
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [oxidationFrom, oxidationTo, reductionFrom, reductionTo, medium]);

  const states = useMemo(() => {
    const entries: Array<[string, string]> = [];
    for (const species of [oxidationFrom, oxidationTo, reductionFrom, reductionTo]) {
      try {
        const values = oxidationStates(species);
        if (values) {
          entries.push([
            species,
            Object.entries(values)
              .map(([element, value]) => `${element}: ${formatOxidationState(value)}`)
              .join(', '),
          ]);
        }
      } catch {
        /* unlesbare Formel überspringen */
      }
    }
    return entries;
  }, [oxidationFrom, oxidationTo, reductionFrom, reductionTo]);

  return (
    <div className="stack">
      <div className="card">
        <h3>Redoxgleichung nach der Halbreaktionsmethode</h3>
        <p className="muted small">
          Gib die Teilchen an, die sich verändern. Sauerstoff wird mit Wasser, Wasserstoff mit
          Protonen und die Ladung mit Elektronen ausgeglichen.
        </p>

        <div className="grid grid-2">
          <div className="card" style={{ background: 'var(--bg-sunken)' }}>
            <h4>Oxidation (gibt Elektronen ab)</h4>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input className="input" value={oxidationFrom} spellCheck={false}
                onChange={(event) => setOxidationFrom(event.target.value)} aria-label="Oxidation, Edukt" />
              <span>→</span>
              <input className="input" value={oxidationTo} spellCheck={false}
                onChange={(event) => setOxidationTo(event.target.value)} aria-label="Oxidation, Produkt" />
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-sunken)' }}>
            <h4>Reduktion (nimmt Elektronen auf)</h4>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input className="input" value={reductionFrom} spellCheck={false}
                onChange={(event) => setReductionFrom(event.target.value)} aria-label="Reduktion, Edukt" />
              <span>→</span>
              <input className="input" value={reductionTo} spellCheck={false}
                onChange={(event) => setReductionTo(event.target.value)} aria-label="Reduktion, Produkt" />
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <span className="subtle">Milieu:</span>
          {(['sauer', 'basisch'] as Medium[]).map((entry) => (
            <button
              key={entry}
              type="button"
              className={`chip${medium === entry ? ' active' : ''}`}
              onClick={() => setMedium(entry)}
            >
              {entry}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {'error' in result ? (
            <Callout variant="warning" title="Das hat nicht geklappt">
              {result.error}
            </Callout>
          ) : (
            <div className="stack">
              <div>
                <div className="subtle">Oxidation</div>
                <div className="equation-scroll">
                  <div className="equation-text">{result.value.oxidation.equation}</div>
                </div>
              </div>
              <div>
                <div className="subtle">Reduktion</div>
                <div className="equation-scroll">
                  <div className="equation-text">{result.value.reduction.equation}</div>
                </div>
              </div>
              <div>
                <div className="subtle">
                  Gesamtgleichung ({result.value.transferredElectrons} übertragene Elektronen)
                </div>
                <div className="equation-scroll">
                  <div className="equation-text">{result.value.equation}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {states.length > 0 && (
        <div className="card">
          <h3>Oxidationszahlen</h3>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {states.map(([species, values]) => (
                  <tr key={species}>
                    <td className="mono">{species}</td>
                    <td>{values}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MolarMassTool() {
  const [formula, setFormula] = useState('CuSO4·5H2O');

  const result = useMemo(() => {
    try {
      return { mass: molarMass(formula), composition: elementalComposition(formula) };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [formula]);

  return (
    <div className="card">
      <h3>Molmasse und Elementaranalyse</h3>
      <input
        className="input"
        value={formula}
        spellCheck={false}
        onChange={(event) => setFormula(event.target.value)}
        aria-label="Summenformel"
      />
      <div className="row" style={{ marginTop: 10 }}>
        {['H2O', 'C6H12O6', 'KMnO4', 'Ca(NO3)2', 'K4[Fe(CN)6]', 'CuSO4·5H2O'].map((example) => (
          <button key={example} type="button" className="chip" onClick={() => setFormula(example)}>
            {example}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {'error' in result ? (
          <Callout variant="warning">{result.error}</Callout>
        ) : (
          <>
            <p style={{ fontSize: '1.2rem' }}>
              M = <strong>{result.mass.toFixed(3)} g/mol</strong>
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Element</th>
                    <th className="num">Atome</th>
                    <th className="num">Masse</th>
                    <th className="num">Anteil</th>
                  </tr>
                </thead>
                <tbody>
                  {result.composition.map((entry) => (
                    <tr key={entry.symbol}>
                      <td>{entry.symbol}</td>
                      <td className="num">{entry.count}</td>
                      <td className="num">{entry.massContribution.toFixed(3)} g/mol</td>
                      <td className="num">{entry.massPercent.toFixed(2)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StoichiometryTools() {
  const [reactantA, setReactantA] = useState({ name: 'H2', amount: '3', coefficient: '2' });
  const [reactantB, setReactantB] = useState({ name: 'O2', amount: '1', coefficient: '1' });
  const [actual, setActual] = useState('8,5');
  const [theoretical, setTheoretical] = useState('10');
  const [stock, setStock] = useState('2');
  const [target, setTarget] = useState('0,1');
  const [targetVolume, setTargetVolume] = useState('500');
  const [solutionFormula, setSolutionFormula] = useState('NaOH');
  const [solutionConcentration, setSolutionConcentration] = useState('0,1');
  const [solutionVolume, setSolutionVolume] = useState('1000');

  const limiting = useMemo(() => {
    try {
      return {
        value: limitingReagent([
          { name: reactantA.name, amount: num(reactantA.amount), coefficient: num(reactantA.coefficient) },
          { name: reactantB.name, amount: num(reactantB.amount), coefficient: num(reactantB.coefficient) },
        ]),
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [reactantA, reactantB]);

  const solutionMass = useMemo(() => {
    try {
      return massForSolution(num(solutionConcentration), num(solutionVolume), molarMass(solutionFormula));
    } catch {
      return null;
    }
  }, [solutionConcentration, solutionVolume, solutionFormula]);

  return (
    <div className="stack">
      <div className="card">
        <h3>Unterschussreagenz</h3>
        <p className="muted small">
          Trage Stoffmenge und Koeffizient aus der ausgeglichenen Gleichung ein.
        </p>
        {[
          { state: reactantA, setState: setReactantA, id: 'a' },
          { state: reactantB, setState: setReactantB, id: 'b' },
        ].map(({ state, setState, id }) => (
          <div className="grid grid-3" key={id} style={{ marginBottom: 10 }}>
            <div className="field">
              <label htmlFor={`edukt-${id}`}>Stoff</label>
              <input id={`edukt-${id}`} className="input" value={state.name}
                onChange={(event) => setState({ ...state, name: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor={`menge-${id}`}>Stoffmenge in mol</label>
              <input id={`menge-${id}`} className="input" inputMode="decimal" value={state.amount}
                onChange={(event) => setState({ ...state, amount: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor={`koeff-${id}`}>Koeffizient</label>
              <input id={`koeff-${id}`} className="input" inputMode="decimal" value={state.coefficient}
                onChange={(event) => setState({ ...state, coefficient: event.target.value })} />
            </div>
          </div>
        ))}

        {'error' in limiting ? (
          <Callout variant="warning">{limiting.error}</Callout>
        ) : (
          <Callout variant="info" title={`Unterschuss: ${limiting.value.limiting}`}>
            Maximal {limiting.value.maxProductAmount.toFixed(3)} mol Produkt. Ausnutzung:{' '}
            {Object.entries(limiting.value.utilisation)
              .map(([name, value]) => `${name} ${(value * 100).toFixed(0)} %`)
              .join(', ')}
            .
          </Callout>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Ausbeute</h3>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="y-ist">Tatsächlich in g</label>
              <input id="y-ist" className="input" inputMode="decimal" value={actual}
                onChange={(event) => setActual(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="y-soll">Theoretisch in g</label>
              <input id="y-soll" className="input" inputMode="decimal" value={theoretical}
                onChange={(event) => setTheoretical(event.target.value)} />
            </div>
          </div>
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            Ausbeute:{' '}
            <strong>
              {num(theoretical) > 0 ? `${percentYield(num(actual), num(theoretical)).toFixed(1)} %` : '–'}
            </strong>
          </p>
        </div>

        <div className="card">
          <h3>Verdünnen</h3>
          <div className="grid grid-3">
            <div className="field">
              <label htmlFor="v-stamm">c(Stamm) mol/L</label>
              <input id="v-stamm" className="input" inputMode="decimal" value={stock}
                onChange={(event) => setStock(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="v-ziel">c(Ziel) mol/L</label>
              <input id="v-ziel" className="input" inputMode="decimal" value={target}
                onChange={(event) => setTarget(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="v-vol">V(Ziel) mL</label>
              <input id="v-vol" className="input" inputMode="decimal" value={targetVolume}
                onChange={(event) => setTargetVolume(event.target.value)} />
            </div>
          </div>
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            {(() => {
              try {
                const volume = dilutionVolume(num(stock), num(target), num(targetVolume));
                return (
                  <>
                    <strong>{volume.toFixed(1)} mL</strong> Stammlösung auf {num(targetVolume)} mL
                    auffüllen.
                  </>
                );
              } catch (error) {
                return <span className="muted">{(error as Error).message}</span>;
              }
            })()}
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Einwaage für eine Maßlösung</h3>
        <div className="grid grid-3">
          <div className="field">
            <label htmlFor="m-formel">Summenformel</label>
            <input id="m-formel" className="input" value={solutionFormula}
              onChange={(event) => setSolutionFormula(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="m-c">Konzentration in mol/L</label>
            <input id="m-c" className="input" inputMode="decimal" value={solutionConcentration}
              onChange={(event) => setSolutionConcentration(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="m-v">Volumen in mL</label>
            <input id="m-v" className="input" inputMode="decimal" value={solutionVolume}
              onChange={(event) => setSolutionVolume(event.target.value)} />
          </div>
        </div>
        <p style={{ marginTop: 10, marginBottom: 0 }}>
          {solutionMass !== null ? (
            <>
              Einwaage: <strong>{solutionMass.toFixed(3)} g</strong>
            </>
          ) : (
            <span className="muted">Formel konnte nicht gelesen werden.</span>
          )}
        </p>
      </div>
    </div>
  );
}
