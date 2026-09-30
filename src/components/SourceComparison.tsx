import { useEffect, useState } from 'react';
import type { MainModule } from '@rdkit/rdkit';
import { inchiKeyOf } from '../chem/externalSubstances';
import { structureKey } from '../chem/reactionKeys';
import { SOURCES, crossReference, type SourceHit, type SourceId } from '../services/substanceSources';

interface Props {
  rdkit: MainModule | null;
  smiles: string;
}

const COMPARED: SourceId[] = ['pubchem', 'wikidata', 'chembl', 'cactus'];

/**
 * Derselbe Stoff in mehreren Online-Datenbanken: Über den InChIKey wird er in
 * PubChem, Wikidata, ChEMBL und beim NCI nachgeschlagen; jede Quelle zeigt,
 * ob ihre Struktur mit der der App übereinstimmt.
 */
export function SourceComparison({ rdkit, smiles }: Props) {
  const [state, setState] = useState<{ key: string | null; hits: SourceHit[]; loading: boolean } | null>(null);

  useEffect(() => {
    if (!rdkit) return;
    const key = inchiKeyOf(rdkit, smiles);
    if (!key) {
      setState({ key: null, hits: [], loading: false });
      return;
    }
    let active = true;
    setState({ key, hits: [], loading: true });
    crossReference(key).then((result) => {
      if (active) setState({ key, hits: result.hits, loading: false });
    });
    return () => {
      active = false;
    };
  }, [rdkit, smiles]);

  if (!rdkit || !state) return null;
  if (!state.key) return null;
  const own = structureKey(rdkit, smiles);
  const matches = (hit: SourceHit) => Boolean(hit.smiles && own && structureKey(rdkit, hit.smiles) === own);
  const agreeing = state.hits.filter(matches).length;

  return (
    <div className="card">
      <h3>Quellen im Vergleich</h3>
      <p className="small subtle" style={{ marginTop: 0 }}>
        InChIKey <span className="mono">{state.key}</span> – derselbe Stoff in mehreren freien Datenbanken.
      </p>
      {state.loading ? (
        <p className="small muted">
          <span className="spinner" /> PubChem, Wikidata, ChEMBL und NCI werden abgefragt …
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data source-table">
              <thead>
                <tr>
                  <th>Quelle</th>
                  <th>Eintrag</th>
                  <th>Formel</th>
                  <th>Struktur</th>
                </tr>
              </thead>
              <tbody>
                {COMPARED.map((source) => {
                  const hit = state.hits.find((entry) => entry.source === source);
                  return (
                    <tr key={source}>
                      <td title={SOURCES[source].description}>{SOURCES[source].label}</td>
                      <td>
                        {hit ? (
                          <a href={hit.url} target="_blank" rel="noreferrer">
                            {hit.name}
                          </a>
                        ) : (
                          <span className="muted">nicht gefunden</span>
                        )}
                        {hit?.cas && <div className="small subtle">CAS {hit.cas}</div>}
                      </td>
                      <td className="mono">{hit?.formula ?? '–'}</td>
                      <td>
                        {!hit ? (
                          '–'
                        ) : matches(hit) ? (
                          <span className="source-ok">✓ gleich</span>
                        ) : (
                          <span className="source-diff" title={hit.smiles}>
                            ≠ abweichend
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="small" style={{ marginBottom: 0 }}>
            {state.hits.length
              ? `${agreeing} von ${state.hits.length} Quellen, die den Stoff kennen, liefern genau diese Struktur.`
              : navigator.onLine === false
                ? 'Offline – die Online-Datenbanken sind gerade nicht erreichbar.'
                : 'Keine der Datenbanken kennt diesen InChIKey – oder sie sind gerade nicht erreichbar.'}
          </p>
        </>
      )}
    </div>
  );
}
