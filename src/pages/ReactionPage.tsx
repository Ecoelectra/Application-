import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useRDKit } from '../hooks/useRDKit';
import { reactionById } from '../data/reactions';
import { functionalGroupName } from '../data/functionalGroups';
import { applyRule } from '../chem/reactionEngine';
import { MoleculeStructure } from '../components/MoleculeStructure';
import { ReactionEquation } from '../components/ReactionEquation';
import { MechanismViewer } from '../components/MechanismViewer';
import { Callout } from '../components/Callout';
import { GhsPictograms } from '../components/GhsPictograms';
import { StoichiometryPanel } from '../components/StoichiometryPanel';
import { ElectrolysisPanel } from '../components/ElectrolysisPanel';

type Tab = 'uebersicht' | 'anleitung' | 'mechanismus' | 'sicherheit' | 'elektro';

export function ReactionPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { rdkit } = useRDKit();
  const [tab, setTab] = useState<Tab>('uebersicht');

  const rule = id ? reactionById(id) : undefined;
  const substrate = params.get('substrat') ?? undefined;

  const computed = useMemo(() => {
    if (!rule || !rdkit || !substrate || !rule.smirks) return null;
    for (const slot of rule.substrateSlots ?? [0]) {
      const result = applyRule(rdkit, rule, substrate, slot);
      if (result.productSets.length) return { ...result, slot };
    }
    return null;
  }, [rule, rdkit, substrate]);

  if (!rule) {
    return (
      <main className="page">
        <div className="empty-state">
          <span className="icon">🔍</span>
          <p>Diese Reaktion ist nicht in der Datenbank.</p>
          <Link className="button" to="/suche">
            Zur Reaktionssuche
          </Link>
        </div>
      </main>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'uebersicht', label: 'Übersicht' },
    { id: 'anleitung', label: 'Anleitung' },
    { id: 'mechanismus', label: 'Mechanismus' },
    { id: 'sicherheit', label: 'Sicherheit' },
    ...(rule.electro ? [{ id: 'elektro' as Tab, label: 'Elektrolyse' }] : []),
  ];

  return (
    <main className="page">
      <nav className="subtle no-print" style={{ marginBottom: 10 }}>
        <Link to="/suche">Reaktionen</Link> › {rule.name}
      </nav>

      <header className="page-header">
        <div className="row" style={{ marginBottom: 8 }}>
          <span className={`badge badge-${rule.category}`}>{rule.category}</span>
          <span className="badge">{rule.reactionType}</span>
          {rule.typicalYield && <span className="badge badge-success">Ausbeute {rule.typicalYield}</span>}
          <span className={`badge ${rule.safety.level === 'Schulversuch' ? 'badge-success' : rule.safety.level === 'Nur Fachlabor' ? 'badge-danger' : 'badge-warning'}`}>
            {rule.safety.level}
          </span>
        </div>
        <h1>{rule.name}</h1>
        {rule.aliases?.length ? <p className="subtle">auch: {rule.aliases.join(' · ')}</p> : null}
        <p>{rule.summary}</p>
      </header>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Reaktionsgleichung</h3>
        <ReactionEquation
          rdkit={rdkit}
          rxnSmiles={rule.example?.rxnSmiles}
          text={rule.fixedEquation?.balanced ?? rule.generalEquation}
          caption={rule.example?.caption}
        />
      </div>

      {substrate && (
        <div className="card no-print" style={{ marginBottom: 18 }}>
          <div className="card-title">
            <h3>Auf deinen Stoff angewendet</h3>
          </div>
          <div className="grid grid-2">
            <div>
              <h4 className="subtle">Edukt</h4>
              <MoleculeStructure rdkit={rdkit} smiles={substrate} width={300} height={200} />
              <p className="mono small" style={{ marginTop: 8 }}>{substrate}</p>
            </div>
            <div>
              <h4 className="subtle">Berechnetes Produkt</h4>
              {computed?.productSets[0]?.length ? (
                <>
                  <div className="grid" style={{ gap: 10 }}>
                    {computed.productSets[0].slice(0, 2).map((product) => (
                      <div key={product}>
                        <MoleculeStructure rdkit={rdkit} smiles={product} width={300} height={200} />
                        <p className="mono small" style={{ marginTop: 6 }}>{product}</p>
                      </div>
                    ))}
                  </div>
                  {computed.coReactants.length > 0 && (
                    <p className="subtle" style={{ marginTop: 8 }}>
                      Gerechnet mit dem Reaktionspartner{' '}
                      <code>{computed.coReactants.join(', ')}</code>.
                    </p>
                  )}
                  {computed.productSets.length > 1 && (
                    <p className="subtle">
                      Die Vorschrift kann an {computed.productSets.length} Stellen des Moleküls
                      angreifen – hier ist eine Möglichkeit dargestellt.
                    </p>
                  )}
                </>
              ) : (
                <div className="structure" style={{ minHeight: 180 }}>
                  <span className="muted small">
                    Für dieses Substrat lässt sich kein Produkt automatisch berechnen.
                  </span>
                </div>
              )}
            </div>
          </div>
          <Callout variant="info">
            Die Produktstruktur ergibt sich aus der hinterlegten Reaktionsvorschrift. Ob die Reaktion
            im Labor tatsächlich so abläuft, hängt von Schutzgruppen, Sterik und Konkurrenzreaktionen
            ab – prüfe das Ergebnis immer fachlich.
          </Callout>
        </div>
      )}

      <div className="tabs no-print" role="tablist">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={`tab${tab === entry.id ? ' active' : ''}`}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'uebersicht' && (
        <div className="stack">
          <div className="card">
            <h3>Allgemeine Gleichung</h3>
            <div className="equation-scroll">
              <div className="equation-text">{rule.generalEquation}</div>
            </div>
            {rule.fixedEquation && (
              <div className="equation-scroll" style={{ marginTop: 8 }}>
                <div className="equation-text">{rule.fixedEquation.balanced}</div>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Reagenzien</h3>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Stoff</th>
                    <th>Rolle</th>
                    <th>Menge</th>
                    <th className="wrap">Hinweis</th>
                  </tr>
                </thead>
                <tbody>
                  {rule.reagents.map((reagent) => (
                    <tr key={reagent.name}>
                      <td>
                        {reagent.name}
                        {reagent.formula && <span className="subtle mono"> {reagent.formula}</span>}
                      </td>
                      <td>{reagent.role}</td>
                      <td>{reagent.equivalents ?? '–'}</td>
                      <td className="wrap subtle">{reagent.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Bedingungen</h3>
            <dl className="definition-list">
              <dt>Temperatur</dt>
              <dd>{rule.conditions.temperature}</dd>
              {rule.conditions.duration && (
                <>
                  <dt>Dauer</dt>
                  <dd>{rule.conditions.duration}</dd>
                </>
              )}
              {rule.conditions.solvent && (
                <>
                  <dt>Lösungsmittel</dt>
                  <dd>{rule.conditions.solvent}</dd>
                </>
              )}
              {rule.conditions.pressure && (
                <>
                  <dt>Druck</dt>
                  <dd>{rule.conditions.pressure}</dd>
                </>
              )}
              {rule.conditions.atmosphere && (
                <>
                  <dt>Atmosphäre</dt>
                  <dd>{rule.conditions.atmosphere}</dd>
                </>
              )}
              {rule.conditions.apparatus && (
                <>
                  <dt>Apparatur</dt>
                  <dd>{rule.conditions.apparatus}</dd>
                </>
              )}
              {rule.conditions.monitoring && (
                <>
                  <dt>Kontrolle</dt>
                  <dd>{rule.conditions.monitoring}</dd>
                </>
              )}
              {rule.conditions.workup && (
                <>
                  <dt>Aufarbeitung</dt>
                  <dd>{rule.conditions.workup}</dd>
                </>
              )}
              {rule.conditions.purification && (
                <>
                  <dt>Reinigung</dt>
                  <dd>{rule.conditions.purification}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="card">
            <h3>Einordnung</h3>
            <dl className="definition-list">
              <dt>Funktionelle Gruppen</dt>
              <dd>{rule.functionalGroups.map(functionalGroupName).join(', ') || '–'}</dd>
              <dt>Einsatzbereich</dt>
              <dd>{rule.scale.join(', ')}</dd>
              <dt>Stichwörter</dt>
              <dd>{rule.keywords.join(', ')}</dd>
              {rule.thermodynamics?.note && (
                <>
                  <dt>Thermodynamik</dt>
                  <dd>{rule.thermodynamics.note}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="card">
            <h3>Quellen</h3>
            <ul className="small" style={{ paddingLeft: 18, marginBottom: 0 }}>
              {rule.references.map((reference) => (
                <li key={reference.title}>
                  {reference.url ? (
                    <a href={reference.url} target="_blank" rel="noreferrer">
                      {reference.title}
                    </a>
                  ) : (
                    reference.title
                  )}
                  <span className="subtle"> — {reference.source}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'anleitung' && (
        <div className="stack">
          <Callout variant="warning" title="Vor dem Start">
            Diese Anleitung ersetzt keine Gefährdungsbeurteilung. Arbeite nur mit Erlaubnis und
            Aufsicht deiner Einrichtung, lies vorher die Sicherheitsdatenblätter aller Stoffe und
            halte die im Reiter «Sicherheit» genannte Schutzausrüstung bereit.
          </Callout>

          <div className="card">
            <h3>Durchführung</h3>
            {rule.procedure.map((step, index) => (
              <div className="procedure-step" key={step.title}>
                <div className="procedure-number">{index + 1}</div>
                <div className="procedure-body">
                  <h4>{step.title}</h4>
                  <p style={{ marginBottom: step.caution || step.tip ? 10 : 0 }}>{step.detail}</p>
                  {step.caution && (
                    <Callout variant="danger" title="Achtung">
                      {step.caution}
                    </Callout>
                  )}
                  {step.tip && (
                    <div style={{ marginTop: step.caution ? 8 : 0 }}>
                      <Callout variant="info" title="Tipp">
                        {step.tip}
                      </Callout>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <StoichiometryPanel rule={rule} />
        </div>
      )}

      {tab === 'mechanismus' && <MechanismViewer rdkit={rdkit} mechanism={rule.mechanism} />}

      {tab === 'sicherheit' && (
        <div className="stack">
          <div className="card">
            <div className="card-title">
              <h3>Gefahren</h3>
              <span
                className={`badge ${
                  rule.safety.level === 'Schulversuch'
                    ? 'badge-success'
                    : rule.safety.level === 'Nur Fachlabor'
                      ? 'badge-danger'
                      : 'badge-warning'
                }`}
              >
                {rule.safety.level}
              </span>
            </div>
            <GhsPictograms codes={rule.safety.ghs} />
            <ul style={{ paddingLeft: 18, marginTop: 14 }}>
              {rule.safety.hazards.map((hazard) => (
                <li key={hazard}>{hazard}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Schutzmaßnahmen</h3>
            <ul style={{ paddingLeft: 18 }}>
              {rule.safety.precautions.map((precaution) => (
                <li key={precaution}>{precaution}</li>
              ))}
            </ul>
            <h4>Persönliche Schutzausrüstung</h4>
            <div className="row">
              {rule.safety.ppe.map((item) => (
                <span key={item} className="badge">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Entsorgung</h3>
            <p style={{ marginBottom: 0 }}>{rule.safety.waste}</p>
          </div>
        </div>
      )}

      {tab === 'elektro' && rule.electro && <ElectrolysisPanel spec={rule.electro} rule={rule} />}
    </main>
  );
}
