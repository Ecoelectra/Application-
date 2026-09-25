import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRDKit } from '../hooks/useRDKit';
import { useRecentSubstances } from '../hooks/useRecentSubstances';
import { analyzeSubstance, type ReactionSuggestion } from '../chem/reactionEngine';
import { describeMolecule, type MoleculeInfo } from '../chem/rdkit';
import { elementalComposition, molarMass } from '../chem/formula';
import { RESTRICTION_NOTICE } from '../chem/safety';
import { MoleculeStructure } from '../components/MoleculeStructure';
import { ReactionCard } from '../components/ReactionCard';
import { Callout } from '../components/Callout';
import { GhsPictograms } from '../components/GhsPictograms';
import { SubstanceSearch } from '../components/SubstanceSearch';
import { SynthesisCard } from '../components/SynthesisCard';
import { DocumentedRoutes } from '../components/DocumentedRoutes';
import { structureOf } from '../chem/substanceStructures';
import { useCatalog } from '../hooks/useCatalog';
import { reactionsFrom, routesTo } from '../data/catalog';
import { substanceByName, SUBSTANCES } from '../data/substances';
import {
  compoundByCid,
  compoundPageUrl,
  findCompound,
  ghsInformation,
  type GhsInformation,
  type PubChemCompound,
} from '../services/pubchem';
import type { Substance } from '../data/types';
import { formatNumber } from '../chem/format';

type Resolution = {
  name: string;
  smiles?: string;
  formula?: string;
  cid?: number;
  local?: Substance;
  remote?: PubChemCompound;
  loading: boolean;
  notFound: boolean;
};

const CATEGORY_FILTERS = [
  { id: 'alle', label: 'Alle' },
  { id: 'organisch', label: 'Organisch' },
  { id: 'elektrochemie', label: 'Elektrochemie' },
  { id: 'anorganisch', label: 'Anorganisch' },
  { id: 'technisch', label: 'Technisch' },
];

export function SubstancePage() {
  const [params, setParams] = useSearchParams();
  const { rdkit, status } = useRDKit();
  const { remember } = useRecentSubstances();
  const { catalog } = useCatalog();

  const name = params.get('name') ?? '';
  const smilesParam = params.get('smiles') ?? undefined;
  const formulaParam = params.get('formel') ?? undefined;
  const cidParam = params.get('cid');

  const [resolution, setResolution] = useState<Resolution>({
    name,
    smiles: smilesParam,
    formula: formulaParam,
    cid: cidParam ? Number(cidParam) : undefined,
    loading: false,
    notFound: false,
  });
  const [ghs, setGhs] = useState<GhsInformation | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('alle');

  // Stoff auflösen: lokale Datenbank zuerst, danach PubChem
  useEffect(() => {
    let active = true;
    setGhs(null);
    setActiveGroup(null);

    const local = substanceByName(name);
    const base: Resolution = {
      name,
      smiles: smilesParam ?? local?.smiles,
      formula: formulaParam ?? local?.formula,
      cid: cidParam ? Number(cidParam) : local?.pubchemCid,
      local,
      loading: false,
      notFound: false,
    };

    if (base.smiles || base.formula) {
      setResolution(base);
    } else {
      setResolution({ ...base, loading: true });
    }

    const needsRemote = !base.smiles && !base.formula;
    if (!needsRemote && !base.cid) return;

    (async () => {
      const compound = base.cid ? await compoundByCid(base.cid) : await findCompound(name);
      if (!active) return;

      if (!compound) {
        setResolution((current) => ({
          ...current,
          loading: false,
          notFound: needsRemote,
        }));
        return;
      }

      setResolution((current) => ({
        ...current,
        smiles: current.smiles ?? compound.smiles ?? compound.connectivitySmiles,
        formula: current.formula ?? compound.formula,
        cid: compound.cid,
        remote: compound,
        loading: false,
        notFound: false,
      }));

      const hazards = await ghsInformation(compound.cid);
      if (active && hazards) setGhs(hazards);
    })();

    return () => {
      active = false;
    };
  }, [name, smilesParam, formulaParam, cidParam]);

  useEffect(() => {
    if (name) {
      remember({
        label: name,
        smiles: resolution.smiles,
        formula: resolution.formula,
        cid: resolution.cid,
      });
    }
    // Nur beim Wechsel des Stoffes merken
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, resolution.smiles]);

  const analysis = useMemo(
    () =>
      analyzeSubstance(rdkit, {
        name: resolution.name,
        smiles: resolution.smiles,
        formula: resolution.formula,
      }),
    [rdkit, resolution.name, resolution.smiles, resolution.formula],
  );

  const molecule: MoleculeInfo | null = useMemo(() => {
    if (!rdkit || !resolution.smiles) return null;
    return describeMolecule(rdkit, resolution.smiles);
  }, [rdkit, resolution.smiles]);

  const mass = useMemo(() => {
    if (resolution.remote?.molecularWeight) return resolution.remote.molecularWeight;
    if (resolution.local?.molarMass) return resolution.local.molarMass;
    if (molecule?.molecularWeight) return molecule.molecularWeight;
    if (resolution.formula) {
      try {
        return molarMass(resolution.formula);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [resolution, molecule]);

  const composition = useMemo(() => {
    const formula = resolution.formula ?? molecule?.formula;
    if (!formula) return [];
    try {
      return elementalComposition(formula);
    } catch {
      return [];
    }
  }, [resolution.formula, molecule]);

  const highlightedAtoms = useMemo(() => {
    if (!activeGroup) return undefined;
    return analysis.groups.find((entry) => entry.group.id === activeGroup)?.atomIndices;
  }, [activeGroup, analysis.groups]);

  const suggestions: ReactionSuggestion[] = useMemo(() => {
    if (categoryFilter === 'alle') return analysis.suggestions;
    return analysis.suggestions.filter((entry) => entry.rule.category === categoryFilter);
  }, [analysis.suggestions, categoryFilter]);

  const availableCategories = useMemo(
    () => new Set<string>(analysis.suggestions.map((entry) => entry.rule.category)),
    [analysis.suggestions],
  );

  // Wege zu diesem Stoff und Reaktionen, in denen er eingesetzt wird
  const substanceId = resolution.local?.id;
  const routes = useMemo(
    () => (substanceId ? routesTo(catalog, substanceId).slice(0, 12) : []),
    [catalog, substanceId],
  );
  const usedIn = useMemo(
    () => (substanceId ? reactionsFrom(catalog, substanceId).slice(0, 8) : []),
    [catalog, substanceId],
  );

  if (!name && !smilesParam) {
    return (
      <main className="page">
        <div className="card">
          <h1>Stoff auswählen</h1>
          <SubstanceSearch
            autoFocus
            onSelect={(entry) => {
              const next = new URLSearchParams();
              next.set('name', entry.label);
              if (entry.smiles) next.set('smiles', entry.smiles);
              if (entry.formula) next.set('formel', entry.formula);
              if (entry.cid) next.set('cid', String(entry.cid));
              setParams(next);
            }}
          />
        </div>
      </main>
    );
  }

  const displayFormula = resolution.formula ?? molecule?.formula;
  const displayName = resolution.remote?.title ?? resolution.local?.name ?? name;

  return (
    <main className="page">
      <div className="card no-print" style={{ marginBottom: 18 }}>
        <SubstanceSearch
          initialValue={name}
          onSelect={(entry) => {
            const next = new URLSearchParams();
            next.set('name', entry.label);
            if (entry.smiles) next.set('smiles', entry.smiles);
            if (entry.formula) next.set('formel', entry.formula);
            if (entry.cid) next.set('cid', String(entry.cid));
            setParams(next);
          }}
        />
      </div>

      {resolution.loading && (
        <div className="card row">
          <span className="spinner" />
          <span className="muted">Stoffdaten werden bei PubChem abgerufen …</span>
        </div>
      )}

      {resolution.notFound && !resolution.loading && (
        <Callout variant="warning" title="Stoff nicht gefunden">
          <p style={{ marginBottom: 6 }}>
            Weder in der mitgelieferten Datenbank noch bei PubChem ließ sich «{name}» finden. Prüfe
            die Schreibweise oder gib die Struktur direkt als SMILES ein (z. B. <code>CCO</code> für
            Ethanol).
          </p>
          <p style={{ marginBottom: 0 }} className="subtle">
            Ohne Internetverbindung stehen nur die {SUBSTANCES.length} mitgelieferten Stoffe zur
            Verfügung.
          </p>
        </Callout>
      )}

      {(resolution.smiles || displayFormula) && (
        <>
          <section className="grid grid-2" style={{ marginBottom: 18 }}>
            <div className="card">
              <div className="card-title">
                <div>
                  <h1 style={{ marginBottom: 2 }}>{displayName}</h1>
                  <div className="subtle">
                    {displayFormula && <span className="mono">{displayFormula}</span>}
                    {mass !== undefined && <> · M = {formatNumber(mass, 2)} g/mol</>}
                  </div>
                </div>
              </div>

              {resolution.smiles ? (
                <MoleculeStructure
                  rdkit={rdkit}
                  smiles={resolution.smiles}
                  highlightAtoms={highlightedAtoms}
                  width={360}
                  height={240}
                  fallback={status === 'laden' ? 'Struktur wird geladen …' : resolution.smiles}
                />
              ) : (
                <div className="structure" style={{ minHeight: 160 }}>
                  <span className="muted small">
                    Für diesen Stoff liegt keine Strukturformel vor (typisch für Salze und
                    Ionenverbindungen).
                  </span>
                </div>
              )}

              <dl className="definition-list" style={{ marginTop: 14 }}>
                {resolution.smiles && (
                  <>
                    <dt>SMILES</dt>
                    <dd className="mono" style={{ wordBreak: 'break-all' }}>
                      {molecule?.canonicalSmiles ?? resolution.smiles}
                    </dd>
                  </>
                )}
                {resolution.local?.cas && (
                  <>
                    <dt>CAS</dt>
                    <dd className="mono">{resolution.local.cas}</dd>
                  </>
                )}
                {resolution.remote?.inchiKey && (
                  <>
                    <dt>InChIKey</dt>
                    <dd className="mono" style={{ wordBreak: 'break-all' }}>
                      {resolution.remote.inchiKey}
                    </dd>
                  </>
                )}
                {resolution.cid && (
                  <>
                    <dt>PubChem</dt>
                    <dd>
                      <a href={compoundPageUrl(resolution.cid)} target="_blank" rel="noreferrer">
                        CID {resolution.cid}
                      </a>
                    </dd>
                  </>
                )}
              </dl>

              {resolution.local?.description && (
                <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
                  {resolution.local.description}
                </p>
              )}
            </div>

            <div className="stack">
              <div className="card">
                <h3>Eigenschaften</h3>
                <div className="table-wrap">
                  <table className="data">
                    <tbody>
                      {mass !== undefined && (
                        <tr>
                          <td>Molare Masse</td>
                          <td className="num">{formatNumber(mass, 2)} g/mol</td>
                        </tr>
                      )}
                      {molecule && (
                        <>
                          <tr>
                            <td>Exakte Masse</td>
                            <td className="num">{formatNumber(molecule.exactMass, 4)} u</td>
                          </tr>
                          <tr>
                            <td>logP (berechnet)</td>
                            <td className="num">{formatNumber(molecule.logP, 2)}</td>
                          </tr>
                          <tr>
                            <td>Topologische polare Oberfläche</td>
                            <td className="num">{formatNumber(molecule.tpsa, 1)} Å²</td>
                          </tr>
                          <tr>
                            <td>H-Brücken-Donoren / -Akzeptoren</td>
                            <td className="num">
                              {molecule.numHBD} / {molecule.numHBA}
                            </td>
                          </tr>
                          <tr>
                            <td>Drehbare Bindungen</td>
                            <td className="num">{molecule.numRotatableBonds}</td>
                          </tr>
                          <tr>
                            <td>Ringe</td>
                            <td className="num">{molecule.numRings}</td>
                          </tr>
                        </>
                      )}
                      {resolution.local?.meltingPoint && (
                        <tr>
                          <td>Schmelzpunkt</td>
                          <td className="num">{resolution.local.meltingPoint}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {composition.length > 0 && (
                  <>
                    <h4 style={{ marginTop: 16 }}>Elementaranalyse</h4>
                    <div className="table-wrap">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>Element</th>
                            <th className="num">Anzahl</th>
                            <th className="num">Massenanteil</th>
                          </tr>
                        </thead>
                        <tbody>
                          {composition.map((entry) => (
                            <tr key={entry.symbol}>
                              <td>{entry.symbol}</td>
                              <td className="num">{entry.count}</td>
                              <td className="num">{formatNumber(entry.massPercent, 2)} %</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {(ghs || resolution.local?.ghs) && (
                <div className="card">
                  <h3>Gefahrenkennzeichnung</h3>
                  <GhsPictograms codes={ghs?.pictograms ?? resolution.local?.ghs ?? []} />
                  {ghs?.signalWord && (
                    <p style={{ marginTop: 10, marginBottom: 4 }}>
                      <strong>Signalwort: </strong>
                      {ghs.signalWord}
                    </p>
                  )}
                  {ghs?.hazardStatements?.length ? (
                    <ul className="small muted" style={{ paddingLeft: 18, marginBottom: 0 }}>
                      {ghs.hazardStatements.slice(0, 6).map((statement) => (
                        <li key={statement}>{statement}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="subtle" style={{ marginTop: 10, marginBottom: 0 }}>
                    Quelle: PubChem GHS-Einstufung. Verbindlich ist immer das Sicherheitsdatenblatt
                    des Herstellers.
                  </p>
                </div>
              )}
            </div>
          </section>

          {analysis.safety.notes.length > 0 && (
            <div className="stack" style={{ marginBottom: 18 }}>
              {analysis.safety.notes.map((note) => (
                <Callout key={note} variant="warning" title="Sicherheitshinweis zur Struktur">
                  {note}
                </Callout>
              ))}
            </div>
          )}

          {analysis.groups.length > 0 && (
            <section className="card" style={{ marginBottom: 18 }}>
              <div className="card-title">
                <h2>Erkannte funktionelle Gruppen</h2>
                {activeGroup && (
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={() => setActiveGroup(null)}
                  >
                    Hervorhebung aufheben
                  </button>
                )}
              </div>
              <p className="muted small">
                Tippe auf eine Gruppe, um sie in der Strukturformel hervorzuheben.
              </p>
              <div className="row">
                {analysis.groups.map((entry) => (
                  <button
                    key={entry.group.id}
                    type="button"
                    className={`chip${activeGroup === entry.group.id ? ' active' : ''}`}
                    onClick={() =>
                      setActiveGroup(activeGroup === entry.group.id ? null : entry.group.id)
                    }
                  >
                    {entry.group.name}
                    {entry.matches.length > 1 && <span className="subtle"> ×{entry.matches.length}</span>}
                  </button>
                ))}
              </div>

              {activeGroup && (
                <div className="callout callout-info" style={{ marginTop: 14 }}>
                  <span className="callout-icon">🔬</span>
                  <div>
                    <strong>
                      {analysis.groups.find((entry) => entry.group.id === activeGroup)?.group.notation}
                    </strong>
                    {analysis.groups.find((entry) => entry.group.id === activeGroup)?.group.description}
                  </div>
                </div>
              )}
            </section>
          )}

          {!analysis.safety.restricted && (
            <DocumentedRoutes
              rdkit={rdkit}
              smiles={resolution.smiles ?? (resolution.local ? structureOf(resolution.local) : undefined)}
              name={displayName}
            />
          )}

          {!analysis.safety.restricted && routes.length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <div className="row-between" style={{ marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>
                  So wird {displayName} hergestellt <span className="badge badge-warning">≈ berechnet</span>
                </h2>
                <Link className="button button-secondary button-small" to={`/synthesen?q=${encodeURIComponent(displayName)}`}>
                  Alle Wege ansehen
                </Link>
              </div>
              <div className="grid grid-2">
                {routes.map((synthesis) => (
                  <SynthesisCard key={synthesis.id} synthesis={synthesis} />
                ))}
              </div>
            </section>
          )}

          {!analysis.safety.restricted && usedIn.length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ marginBottom: 12 }}>{displayName} als Ausgangsstoff</h2>
              <div className="grid grid-2">
                {usedIn.map((synthesis) => (
                  <SynthesisCard key={synthesis.id} synthesis={synthesis} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>
                {analysis.safety.restricted
                  ? 'Keine Synthesevorschläge'
                  : `${analysis.suggestions.length} mögliche Reaktionen`}
              </h2>
              {!analysis.safety.restricted && analysis.suggestions.length > 0 && (
                <div className="row" style={{ gap: 6 }}>
                  {CATEGORY_FILTERS.filter(
                    (filter) => filter.id === 'alle' || availableCategories.has(filter.id),
                  ).map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`chip${categoryFilter === filter.id ? ' active' : ''}`}
                      onClick={() => setCategoryFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {analysis.safety.restricted ? (
              <Callout variant="danger" title={`Eingestuft als: ${analysis.safety.category}`}>
                <p>{analysis.safety.explanation}</p>
                <p style={{ marginBottom: 0 }}>{RESTRICTION_NOTICE}</p>
              </Callout>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-2">
                {suggestions.map((suggestion) => (
                  <ReactionCard
                    key={suggestion.rule.id}
                    rule={suggestion.rule}
                    score={suggestion.score}
                    matchedGroups={suggestion.matchedGroups}
                    products={suggestion.productSets[0]}
                    reason={suggestion.reason}
                    substrate={resolution.smiles}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state card">
                <span className="icon">🧪</span>
                <p>
                  Für diesen Stoff enthält die Datenbank noch keine passende Reaktion.{' '}
                  <Link to="/suche">Durchsuche die Reaktionen</Link> oder probiere einen verwandten
                  Stoff.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
