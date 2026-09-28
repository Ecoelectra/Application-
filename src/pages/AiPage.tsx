import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { maximumBarrier } from '../chem/ai/activation';
import { SOURCE_LABELS } from '../chem/ai/model';
import { predictFromKnowledge, predictWithModel, type AiProposal } from '../chem/ai/reactionAI';
import { AiProposalCard } from '../components/AiProposalCard';
import { Callout } from '../components/Callout';
import { SubstancePicker } from '../components/SubstancePicker';
import { useRDKit } from '../hooks/useRDKit';
import { useReactionModel } from '../hooks/useReactionModel';
import { substanceById } from '../data/substances';
import type { Substance } from '../data/types';

const EXAMPLES: Array<[string, string]> = [
  ['benzoesaeure', 'benzylamin'],
  ['brombenzol', 'phenylboronsaeure'],
  ['essigsaeure', 'ethanol'],
  ['nitrobenzol', 'wasserstoff'],
  ['cyclohexen', 'wasserstoff'],
  ['benzaldehyd', 'anilin'],
  ['wasserstoffperoxid', 'mangandioxid'],
  ['stickstoff', 'wasserstoff'],
];

function percent(value: number): string {
  return `${(value * 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })} %`;
}

/** Werkzeug «Reaktions-KI»: Produkte, Katalysatoren und Aktivierungsenergie vorhersagen. */
export function AiPage() {
  const { rdkit } = useRDKit();
  const { model, status } = useReactionModel();
  const [params] = useSearchParams();
  // Stoffe aus der Adresse, z. B. #/ki?stoffe=brombenzol,phenylboronsaeure
  const fromUrl = (params.get('stoffe') ?? '').split(',').map((id) => substanceById(id)).filter((entry): entry is Substance => Boolean(entry));
  const [first, setFirst] = useState<Substance | null>(() => fromUrl[0] ?? substanceById('benzoesaeure') ?? null);
  const [second, setSecond] = useState<Substance | null>(() => (fromUrl.length ? (fromUrl[1] ?? null) : (substanceById('benzylamin') ?? null)));
  const [temperature, setTemperature] = useState(20);
  const [proposals, setProposals] = useState<AiProposal[] | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const substances = [first, second].filter((entry): entry is Substance => Boolean(entry));
    if (!substances.length || !rdkit) {
      setProposals(null);
      return;
    }
    setRunning(true);
    const timer = window.setTimeout(() => {
      const knowledge = predictFromKnowledge(substances, { temperatureC: temperature, rdkit });
      const learned = model ? predictWithModel(rdkit, model, substances, { temperatureC: temperature, limit: 5 }) : [];
      setProposals([...knowledge, ...learned]);
      setRunning(false);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [first, second, temperature, rdkit, model]);

  const chosen = [first, second].filter((entry): entry is Substance => Boolean(entry));

  return (
    <main className="page">
      <header className="page-header">
        <h1>Reaktions-KI</h1>
        <p>
          Ein neuronales Netz sagt vorher, was aus zwei Stoffen entsteht und welcher Katalysator dafür nötig ist. Es hat an
          {model ? ` ${model.metrics.trainingReactions.toLocaleString('de-DE')} ` : ' rund einer Million '}
          Reaktionen gelernt{model?.sources && Object.keys(model.sources).length > 1 ? ` aus ${Object.keys(model.sources).length} Quellen – US-Patente, Enzymdatenbanken und Hochdurchsatzversuche` : ' aus US-Patenten'}. Dazu kommt eine Abschätzung der Aktivierungsenergie: Läuft die Reaktion bei der
          eingestellten Temperatur, oder braucht es einen Katalysator?
        </p>
      </header>

      <section className="card">
        <div className="grid grid-2">
          <SubstancePicker label="Stoff 1" value={first} onChange={setFirst} rdkit={rdkit} />
          <SubstancePicker label="Stoff 2 (optional)" value={second} onChange={setSecond} rdkit={rdkit} />
        </div>
        <div className="row" style={{ marginTop: 10, gap: 6 }}>
          <span className="small subtle">Beispiele:</span>
          {EXAMPLES.map(([a, b]) => {
            const x = substanceById(a);
            const y = substanceById(b);
            if (!x || !y) return null;
            return (
              <button
                key={`${a}-${b}`}
                type="button"
                className="chip chip-small"
                onClick={() => {
                  setFirst(x);
                  setSecond(y);
                }}
              >
                {x.name} + {y.name}
              </button>
            );
          })}
        </div>
        <h3 style={{ marginTop: 16 }}>
          <label htmlFor="ki-temperatur">Temperatur</label>
        </h3>
        <div className="regler">
          <input id="ki-temperatur" type="range" min={-80} max={600} step={5} value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
          <div className="regler-wert">
            <input
              className="input"
              type="number"
              value={temperature}
              min={-100}
              max={1200}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) setTemperature(Math.max(-100, Math.min(1200, value)));
              }}
              aria-label="Temperatur in Grad Celsius"
            />
            <span>°C</span>
          </div>
        </div>
        <p className="small subtle" style={{ marginBottom: 0 }}>
          Bei {temperature.toLocaleString('de-DE')} °C wird in einer Stunde eine Barriere von etwa{' '}
          {Math.round(maximumBarrier(temperature)).toLocaleString('de-DE')} kJ/mol überwunden.
        </p>
        {chosen.length > 0 && (
          <Link className="button button-secondary button-small" style={{ marginTop: 12 }} to={`/werkbank?${new URLSearchParams({ stoffe: chosen.map((entry) => entry.id).join(',') }).toString()}`}>
            ⚗ In der Werkbank ansehen
          </Link>
        )}
      </section>

      {status === 'laden' && (
        <div className="card row" style={{ marginTop: 16 }}>
          <span className="spinner" /> <span className="muted">KI-Modell wird geladen (etwa 1 MB, danach offline) …</span>
        </div>
      )}
      {status === 'fehlt' && (
        <Callout variant="warning" title="KI-Modell nicht verfügbar">
          <p style={{ margin: 0 }}>Das Modell ließ sich nicht laden. Die Katalyse-Wissensbasis funktioniert trotzdem.</p>
        </Callout>
      )}

      <section className="stack" style={{ marginTop: 16 }}>
        {running && (
          <div className="row">
            <span className="spinner" /> <span className="muted">Die KI rechnet …</span>
          </div>
        )}
        {!running && proposals && proposals.length === 0 && (
          <Callout variant="info" title="Keine Reaktion gefunden">
            <p style={{ margin: 0 }}>
              Weder das neuronale Netz noch die Wissensbasis kennen eine Umsetzung dieser Stoffe. Ein Katalysator hilft hier nicht:
              Er beschleunigt nur Reaktionen, die grundsätzlich möglich sind. Die Werkbank sagt dir, was beim Mischen physikalisch
              passiert.
            </p>
          </Callout>
        )}
        {proposals?.map((proposal) => (
          <AiProposalCard key={proposal.id} proposal={proposal} rdkit={rdkit} temperatureC={temperature} onSetTemperature={setTemperature} />
        ))}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>So arbeitet die KI</h2>
        <ol>
          <li>
            <strong>Reaktionsvorlagen lernen.</strong> Aus {model ? model.metrics.trainingReactions.toLocaleString('de-DE') : 'rund einer Million'} Reaktionen
            wurde jeweils das Reaktionszentrum herausgeschnitten – die Atome, deren Bindungen sich ändern, mit ihren Nachbarn.
            {model ? ` ${model.templates.length.toLocaleString('de-DE')} Vorlagen` : ' Die Vorlagen'}, die mindestens 25-mal vorkommen (aus den kleineren Quellen 8-mal), kennt das Netz.
          </li>
          <li>
            <strong>Neuronales Netz.</strong> Es liest den molekularen Fingerabdruck der Edukte (2048 Bit, Morgan-Radius 2) und
            schätzt für jede Vorlage, wie wahrscheinlich sie greift. Eine zweite Ausgabe schätzt, welche Katalysatoren, Basen oder
            Reagenzien dafür gebraucht werden.
          </li>
          <li>
            <strong>Prüfen mit RDKit.</strong> Die wahrscheinlichsten Vorlagen werden auf die echten Moleküle angewendet. Nur
            chemisch gültige Produkte bleiben; gesperrte Stoffe (Sprengstoffe, Kampfstoffe, Betäubungsmittel) zeigt die App nie.
          </li>
          <li>
            <strong>Aktivierungsenergie.</strong> Jede Vorlage gehört zu einer Reaktionsfamilie mit Richtwerten für die Barriere
            mit und ohne Katalysator. Über die Arrhenius-Gleichung folgt, ob die Reaktion bei der eingestellten Temperatur
            abläuft. Für anorganische und technische Katalyse (Haber-Bosch, Kontaktverfahren, Wasserstoffperoxid-Zerfall …)
            gibt es eine eigene Wissensbasis mit Lehrbuchwerten.
          </li>
        </ol>
        {model?.sources && Object.keys(model.sources).length > 1 && (
          <>
            <h3>Woher die Reaktionen stammen</h3>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Quelle</th>
                    <th className="num">verschiedene Reaktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(model.sources)
                    .sort((a, b) => b[1] - a[1])
                    .map(([id, count]) => (
                      <tr key={id}>
                        <td>{SOURCE_LABELS[id] ?? id}</td>
                        <td className="num">{count.toLocaleString('de-DE')}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {model && (
          <>
            <h3>Wie gut ist sie?</h3>
            <p className="small">
              Geprüft an Patentreaktionen des USPTO-MIT-Testsatzes, die das Netz beim Lernen nicht gesehen hat
              ({model.metrics.productSample.toLocaleString('de-DE')} Stichproben):
            </p>
            <div className="grid grid-3">
              <div className="stat">
                <div className="stat-value">{percent(model.metrics.productTop1)}</div>
                <div className="small subtle">richtiges Produkt auf Platz 1</div>
              </div>
              <div className="stat">
                <div className="stat-value">{percent(model.metrics.productTop3)}</div>
                <div className="small subtle">richtiges Produkt unter den ersten 3</div>
              </div>
              <div className="stat">
                <div className="stat-value">{percent(model.metrics.catalystTop1)}</div>
                <div className="small subtle">richtige Katalysatorart auf Platz 1</div>
              </div>
            </div>
          </>
        )}
        <Callout variant="warning" title="Grenzen">
          <p style={{ margin: 0 }}>
            Die KI kennt vor allem, was in Patenten der organischen Synthese häufig vorkommt; Enzym- und Stoffwechselreaktionen
            machen nur einen kleinen Teil der Trainingsdaten aus. Sie sagt, was chemisch naheliegt – nicht,
            ob es im Einzelfall klappt, wie hoch die Ausbeute ist oder welche Nebenprodukte entstehen. Die Aktivierungsenergien sind
            Richtwerte der Reaktionsfamilie (± 10–20 kJ/mol). Jedes Ergebnis ist deshalb als Vorhersage gekennzeichnet.
          </p>
        </Callout>
      </section>
    </main>
  );
}
