import { useNavigate } from 'react-router-dom';
import { SubstanceSearch, type SelectedSubstance } from '../components/SubstanceSearch';
import { useRecentSubstances } from '../hooks/useRecentSubstances';
import { useRDKit } from '../hooks/useRDKit';
import { REACTIONS } from '../data/reactions';
import { SUBSTANCES } from '../data/substances';

const QUICK_PICKS = [
  'Ethanol',
  'Essigsäure',
  'Aceton',
  'Benzaldehyd',
  'Toluol',
  'Cyclohexen',
  'Natriumchlorid',
  'Anilin',
];

export function HomePage() {
  const navigate = useNavigate();
  const { recent, remember } = useRecentSubstances();
  const { status } = useRDKit();

  const open = (entry: SelectedSubstance): void => {
    const params = new URLSearchParams();
    params.set('name', entry.label);
    if (entry.smiles) params.set('smiles', entry.smiles);
    if (entry.formula) params.set('formel', entry.formula);
    if (entry.cid) params.set('cid', String(entry.cid));
    remember({ label: entry.label, smiles: entry.smiles, formula: entry.formula, cid: entry.cid });
    navigate(`/stoff?${params.toString()}`);
  };

  const openByName = (name: string): void => {
    const substance = SUBSTANCES.find((entry) => entry.name === name);
    open({
      label: name,
      smiles: substance?.smiles,
      formula: substance?.formula,
      cid: substance?.pubchemCid,
      source: 'lokal',
    });
  };

  const electroCount = REACTIONS.filter((rule) => rule.electro).length;

  return (
    <main className="page">
      <section className="page-header">
        <h1>Welche Reaktion passt zu deinem Stoff?</h1>
        <p>
          Gib einen Stoff ein – als Name, Summenformel, CAS-Nummer oder SMILES. Die App erkennt die
          funktionellen Gruppen, berechnet mögliche Produkte und zeigt zu jeder Reaktion die
          Gleichung, den Mechanismus und eine ausführliche Arbeitsanleitung.
        </p>
      </section>

      <div className="card" style={{ marginBottom: 20 }}>
        <SubstanceSearch onSelect={open} autoFocus />
        <div className="row" style={{ marginTop: 14 }}>
          <span className="subtle">Schnellzugriff:</span>
          {QUICK_PICKS.map((name) => (
            <button key={name} type="button" className="chip" onClick={() => openByName(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">
            <h3>Zuletzt angesehen</h3>
          </div>
          <div className="row">
            {recent.map((entry) => (
              <button
                key={entry.label}
                type="button"
                className="chip"
                onClick={() =>
                  open({
                    label: entry.label,
                    smiles: entry.smiles,
                    formula: entry.formula,
                    cid: entry.cid,
                    source: 'lokal',
                  })
                }
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-3">
        <div className="card">
          <h3>Werkbank</h3>
          <p className="muted small">
            Stoffe ins Reaktionsgefäß geben und sehen, was entsteht – abgeglichen mit 100 000
            belegten Reaktionen aus Patenten. Jedes Ergebnis sagt, ob es belegt oder nur vorhergesagt ist.
          </p>
          <a className="button button-small" href="#/werkbank">
            Werkbank öffnen
          </a>
        </div>

        <div className="card">
          <h3>Über 7000 berechnete Synthesen</h3>
          <p className="muted small">
            Für jeden Stoff nachschlagen, wie er hergestellt wird. Alle Wege sind aus den
            Reaktionsvorschriften berechnet und die Gleichungen exakt ausgeglichen.
          </p>
          <a className="button button-secondary button-small" href="#/synthesen">
            Synthesen durchsuchen
          </a>
        </div>

        <div className="card">
          <h3>{REACTIONS.length} Reaktionstypen</h3>
          <p className="muted small">
            Organische Synthesen, Namensreaktionen, technische Verfahren und Elektrosynthesen – jede
            mit Mechanismus, Bedingungen und Sicherheitshinweisen.
          </p>
          <a className="button button-secondary button-small" href="#/suche">
            Datenbank durchsuchen
          </a>
        </div>

        <div className="card">
          <h3>{electroCount} Elektrosynthesen</h3>
          <p className="muted small">
            Von der Kolbe-Elektrolyse bis zur Chloralkali-Elektrolyse, mit Elektrodenmaterial,
            Stromdichte und Ladungsbedarf. Dazu Nernst- und Faraday-Rechner.
          </p>
          <a className="button button-secondary button-small" href="#/elektrochemie">
            Zur Elektrochemie
          </a>
        </div>

        <div className="card">
          <h3>Werkzeuge</h3>
          <p className="muted small">
            Reaktionsgleichungen ausgleichen, Redoxgleichungen über Halbreaktionen aufstellen,
            Molmassen und Ansätze berechnen.
          </p>
          <a className="button button-secondary button-small" href="#/werkzeuge">
            Werkzeuge öffnen
          </a>
        </div>
      </div>

      <p className="subtle" style={{ marginTop: 20 }}>
        {status === 'laden' && 'Strukturberechnung wird geladen …'}
        {status === 'bereit' &&
          `Strukturberechnung aktiv · ${SUBSTANCES.length} Stoffe offline verfügbar · PubChem-Suche bei bestehender Verbindung`}
        {status === 'fehler' &&
          'Die Strukturberechnung konnte nicht geladen werden – Reaktionsdatenbank und Rechner funktionieren trotzdem.'}
      </p>
    </main>
  );
}
