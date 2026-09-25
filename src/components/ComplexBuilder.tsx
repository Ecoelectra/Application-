import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  analyseComplex,
  CENTRAL_IONS,
  CENTRAL_ION_BY_ID,
  COMPLEX_PRESETS,
  LIGANDS,
  LIGAND_BY_ID,
  stabilityTable,
  type LigandCount,
} from '../chem/complexes';
import { Callout } from './Callout';
import { ComplexDetails } from './ComplexDetails';
import { formatNumber } from '../chem/format';

const SUPERSCRIPT: Record<string, string> = { '1': '¹', '2': '²', '3': '³', '4': '⁴', '+': '⁺' };

function ionLabel(symbol: string, charge: number): string {
  return `${symbol}${charge === 1 ? '' : SUPERSCRIPT[String(charge)]}${SUPERSCRIPT['+']}`;
}

/** Liest die Liganden aus der Adresszeile: «nh3:4,h2o:2». */
function parseLigands(text: string | null): Array<[string, number]> {
  if (!text) return [];
  return text
    .split(',')
    .map((part) => part.split(':'))
    .filter(([id, count]) => LIGAND_BY_ID.has(id) && Number(count) > 0)
    .map(([id, count]) => [id, Math.min(6, Number(count))]);
}

/**
 * Komplex-Baukasten: Zentralion wählen, Liganden anlagern, Ergebnis ansehen.
 * Teil der Werkbank (Modus «Komplexe bauen»); der Zustand steht in der Adresse.
 */
export function ComplexBuilder() {
  const [params, setParams] = useSearchParams();
  const metalId = params.get('zentral') ?? 'cu2';
  const ligandPairs = parseLigands(params.get('liganden') ?? 'nh3:4,h2o:2');
  const metal = CENTRAL_ION_BY_ID.get(metalId) ?? CENTRAL_IONS[0];

  const counts = new Map(ligandPairs);
  const ligands: LigandCount[] = ligandPairs.map(([id, count]) => ({ ligand: LIGAND_BY_ID.get(id)!, count }));
  const complex = useMemo(() => analyseComplex(metal, ligands), [metal, params]);
  const stability = useMemo(() => stabilityTable(metal.id), [metal.id]);

  const update = (nextMetal: string, nextLigands: Array<[string, number]>): void => {
    const next = new URLSearchParams();
    next.set('modus', 'komplexe');
    next.set('zentral', nextMetal);
    const text = nextLigands.filter(([, count]) => count > 0).map(([id, count]) => `${id}:${count}`).join(',');
    if (text) next.set('liganden', text);
    setParams(next, { replace: true });
  };

  const changeCount = (id: string, delta: number): void => {
    const next = new Map(counts);
    next.set(id, Math.max(0, Math.min(6, (next.get(id) ?? 0) + delta)));
    update(metal.id, Array.from(next.entries()));
  };

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        Zentralion wählen, Liganden anlagern und sehen, was daraus wird: Name, Geometrie, Farbe,
        Magnetismus und Stabilität – abgeleitet aus der Ligandenfeldtheorie. Welche Komplexe echte
        Stoffe bilden, zeigt die Werkbank im Modus «Stoffe mischen».
      </p>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Bekannte Komplexe</h3>
        <div className="row">
          {COMPLEX_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="chip"
              onClick={() => update(preset.metal, preset.ligands)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="workbench">
        <section className="stack">
          <div className="card">
            <h2>Zentralion</h2>
            <div className="ion-grid">
              {CENTRAL_IONS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`bottle${entry.id === metal.id ? ' bottle-active' : ''}`}
                  aria-pressed={entry.id === metal.id}
                  onClick={() => update(entry.id, ligandPairs)}
                >
                  <span className="bottle-name">{ionLabel(entry.symbol, entry.charge)}</span>
                  <span className="bottle-formula">
                    {entry.element}, d{entry.d === 0 ? '⁰' : ['', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰'][entry.d]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <h2>Liganden</h2>
              <span className={`badge ${complex.valid ? 'badge-success' : 'badge-warning'}`}>
                Koordinationszahl {complex.coordinationNumber}
              </span>
            </div>
            <p className="muted small">
              Sortiert nach der spektrochemischen Reihe – von schwachem zu starkem Ligandenfeld.
            </p>
            <div className="ligand-list">
              {LIGANDS.map((ligand) => {
                const count = counts.get(ligand.id) ?? 0;
                return (
                  <div key={ligand.id} className={`ligand-row${count ? ' ligand-active' : ''}`}>
                    <div>
                      <strong>{ligand.label}</strong>
                      <span className="subtle small">
                        {' '}
                        {ligand.name}
                        {ligand.denticity > 1 ? ` · ${ligand.denticity}-zähnig` : ''}
                      </span>
                    </div>
                    <div className="stepper">
                      <button type="button" aria-label={`${ligand.label} entfernen`} onClick={() => changeCount(ligand.id, -1)} disabled={!count}>
                        −
                      </button>
                      <span className="mono">{count}</span>
                      <button type="button" aria-label={`${ligand.label} hinzufügen`} onClick={() => changeCount(ligand.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="stack">
          {complex.problems.map((problem) => (
            <Callout key={problem} variant={problem.includes('ungewöhnlich') ? 'info' : 'warning'} title="Hinweis">
              {problem}
            </Callout>
          ))}

          <article className="card complex-result">
            <ComplexDetails complex={complex} />
          </article>

          {stability.length > 0 && (
            <div className="card">
              <h3>Ligandenaustausch bei {ionLabel(metal.symbol, metal.charge)}</h3>
              <p className="muted small">
                Je größer lg β, desto stabiler der Komplex. Ein Ligand weiter oben verdrängt einen
                weiter unten, wenn man ihn zugibt.
              </p>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>Komplex</th><th className="num" style={{ textTransform: 'none' }}>lg β</th><th /></tr>
                  </thead>
                  <tbody>
                    {stability.map((entry) => (
                      <tr key={entry.label}>
                        <td className="mono">{entry.label}</td>
                        <td className="num">{formatNumber(entry.logBeta, 1)}</td>
                        <td className="num">
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => update(metal.id, entry.ligands)}
                          >
                            ansehen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="subtle small" style={{ marginBottom: 0 }}>
                Literaturwerte bei 25 °C, gerundet (Martell/Smith, Critical Stability Constants).
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
