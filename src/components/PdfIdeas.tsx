import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MainModule } from '@rdkit/rdkit';
import type { ReactionModel } from '../chem/ai/model';
import { recognizeSubstances, type RecognizedSubstance } from '../chem/textSubstances';
import { MAX_IDEA_SUBSTANCES, findReactionIdeas, findSynthesisIdeas, type ReactionIdea, type SynthesisIdea } from '../chem/pdfIdeas';
import { EVIDENCE_LABELS } from '../chem/workbench';
import { loadCatalog } from '../data/catalog';
import { MAX_PDF_BYTES, readPdfText } from '../services/pdfText';
import type { Substance } from '../data/types';
import { Callout } from './Callout';

interface Props {
  rdkit: MainModule | null;
  model: ReactionModel | null;
  modelStatus: 'laden' | 'bereit' | 'fehlt';
  /** Stoffe ins Reaktionsgefäß geben und zum Mischen wechseln */
  onTry: (substances: Substance[]) => void;
}

type Phase = 'leer' | 'lesen' | 'erkannt' | 'suchen' | 'fertig';

const LEVEL_BADGE: Record<string, string> = {
  Schulversuch: 'success',
  Laborpraktikum: 'analytik',
  Fortgeschritten: 'warning',
  'Nur Fachlabor': 'danger',
};

const HIGHLIGHT_ICONS: Record<string, string> = {
  Niederschlag: '🌫',
  Farbe: '🎨',
  Gas: '🫧',
  'Licht und Feuer': '🔥',
  Kristalle: '💎',
  Geruch: '👃',
  Wärme: '🌡',
  Kälte: '❄',
};

/** PDF hochladen, Stoffe erkennen, spannende Reaktionen und Synthesen vorschlagen. */
export function PdfIdeas({ rdkit, model, modelStatus, onTry }: Props) {
  const [phase, setPhase] = useState<Phase>('leer');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [pageInfo, setPageInfo] = useState<{ pages: number; emptyPages: number; characters: number } | null>(null);
  const [recognized, setRecognized] = useState<RecognizedSubstance[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<ReactionIdea[]>([]);
  const [syntheses, setSyntheses] = useState<SynthesisIdea[]>([]);
  const [pasted, setPasted] = useState('');
  const [schoolOnly, setSchoolOnly] = useState(false);
  const [runningOnly, setRunningOnly] = useState(false);
  const [dragging, setDragging] = useState(false);
  const run = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    run.current++;
  }, []);

  const takeText = (text: string, info: { pages: number; emptyPages: number } | null): void => {
    const found = recognizeSubstances(text);
    setRecognized(found);
    setChosen(new Set(found.slice(0, MAX_IDEA_SUBSTANCES).map((entry) => entry.substance.id)));
    setPageInfo(info ? { ...info, characters: text.trim().length } : null);
    setReactions([]);
    setSyntheses([]);
    setPhase('erkannt');
  };

  const readFile = async (file: File): Promise<void> => {
    setError(null);
    setFileName(file.name);
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setError('Das ist kein PDF. Bitte eine PDF-Datei wählen.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`Das PDF ist größer als ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} MB.`);
      return;
    }
    const current = ++run.current;
    setPhase('lesen');
    setProgress(null);
    try {
      const pdf = await readPdfText(await file.arrayBuffer(), (done, total) => {
        if (current === run.current) setProgress({ done, total });
      });
      if (current !== run.current) return;
      takeText(pdf.text, pdf);
    } catch (reason) {
      if (current !== run.current) return;
      setPhase('leer');
      setError(
        /password/i.test(String(reason))
          ? 'Das PDF ist mit einem Passwort geschützt und lässt sich nicht lesen.'
          : 'Das PDF ließ sich nicht lesen. Ist die Datei beschädigt?',
      );
    }
  };

  const search = async (): Promise<void> => {
    const substances = recognized.filter((entry) => chosen.has(entry.substance.id)).map((entry) => entry.substance);
    if (!substances.length) return;
    const current = ++run.current;
    setPhase('suchen');
    setProgress({ done: 0, total: (substances.length * (substances.length - 1)) / 2 });
    const [catalog, found] = await Promise.all([
      loadCatalog(),
      findReactionIdeas(rdkit, model, substances, {
        limit: 40,
        onProgress: (done, total) => {
          if (current === run.current) setProgress({ done, total });
        },
        cancelled: () => current !== run.current,
      }),
    ]);
    if (current !== run.current) return;
    setReactions(found);
    setSyntheses(findSynthesisIdeas(catalog, substances, 30));
    setPhase('fertig');
  };

  const reset = (): void => {
    run.current++;
    setPhase('leer');
    setRecognized([]);
    setReactions([]);
    setSyntheses([]);
    setFileName('');
    setPageInfo(null);
    setError(null);
    if (input.current) input.current.value = '';
  };

  const shownReactions = useMemo(
    () =>
      reactions.filter(
        (idea) => (!schoolOnly || idea.reaction.safetyLevel === 'Schulversuch') && (!runningOnly || !idea.needs.length),
      ),
    [reactions, schoolOnly, runningOnly],
  );
  const shownSyntheses = useMemo(
    () => syntheses.filter((idea) => (!schoolOnly || idea.synthesis.safetyLevel === 'Schulversuch') && (!runningOnly || !idea.missing.length)),
    [syntheses, schoolOnly, runningOnly],
  );
  const chosenCount = chosen.size;
  const pairCount = (Math.min(chosenCount, MAX_IDEA_SUBSTANCES) * (Math.min(chosenCount, MAX_IDEA_SUBSTANCES) - 1)) / 2;

  return (
    <div className="stack pdf-ideas">
      <section className="card">
        <h2>📄 Ideen aus einem PDF</h2>
        <p className="muted">
          Eine Chemikalienliste, Versuchsanleitung oder ein Skript: Jedes Stoffpaar daraus wird in der Werkbank gemischt – mit
          Regeln, Patentbelegen und der Reaktions-KI.
        </p>

        <label
          className={`pdf-drop${dragging ? ' pdf-drop-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void readFile(file);
          }}
        >
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            aria-label="PDF auswählen"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
            }}
          />
          <span className="pdf-drop-icon" aria-hidden="true">
            📄
          </span>
          <strong>PDF auswählen</strong>
          <span className="small subtle">oder hierher ziehen · bleibt auf deinem Gerät, nichts wird hochgeladen</span>
        </label>

        <details style={{ marginTop: 10 }}>
          <summary className="small">Kein PDF zur Hand? Text einfügen</summary>
          <textarea
            className="input"
            rows={4}
            style={{ marginTop: 8, width: '100%' }}
            placeholder="z. B. eine Chemikalienliste: Kupfersulfat, Natronlauge, Eisen, Salzsäure …"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            aria-label="Text mit Stoffnamen"
          />
          <button
            type="button"
            className="button button-small"
            style={{ marginTop: 6 }}
            disabled={!pasted.trim()}
            onClick={() => {
              run.current++;
              setFileName('eingefügter Text');
              setError(null);
              takeText(pasted, null);
            }}
          >
            Stoffe im Text suchen
          </button>
        </details>

        {error && (
          <Callout variant="danger" title="Das hat nicht geklappt">
            <p style={{ margin: 0 }}>{error}</p>
          </Callout>
        )}

        {phase === 'lesen' && (
          <div className="row" style={{ marginTop: 12 }}>
            <span className="spinner" />
            <span className="muted">
              {fileName} wird gelesen{progress ? ` – Seite ${progress.done} von ${progress.total}` : ' …'}
            </span>
          </div>
        )}
      </section>

      {phase !== 'leer' && phase !== 'lesen' && (
        <section className="card">
          <div className="row-between" style={{ flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Gefundene Stoffe ({recognized.length})</h2>
            <button type="button" className="button button-secondary button-small" onClick={reset}>
              Anderes PDF
            </button>
          </div>
          <p className="small subtle">
            {fileName}
            {pageInfo ? ` · ${pageInfo.pages} Seite${pageInfo.pages === 1 ? '' : 'n'}` : ''}
          </p>
          {pageInfo && pageInfo.characters < 20 && (
            <Callout variant="warning" title="Kein Text im PDF">
              <p style={{ margin: 0 }}>
                Das PDF enthält keinen lesbaren Text – vermutlich ist es eingescannt. Texterkennung auf Bildern (OCR) kann die App
                nicht. Tipp: Die Stoffliste abtippen oder aus einem anderen Programm kopieren und oben einfügen.
              </p>
            </Callout>
          )}
          {pageInfo && pageInfo.characters >= 20 && pageInfo.emptyPages > 0 && (
            <p className="small subtle">{pageInfo.emptyPages} Seite(n) ohne Text (Bilder oder Scans) wurden übersprungen.</p>
          )}
          {!recognized.length && (!pageInfo || pageInfo.characters >= 20) && (
            <Callout variant="info" title="Keine bekannten Stoffe gefunden">
              <p style={{ margin: 0 }}>
                Im Text stehen keine Stoffe aus der Datenbank der App (Namen, Synonyme, CAS-Nummern oder Summenformeln).
              </p>
            </Callout>
          )}
          {recognized.length > 0 && (
            <>
              <p className="small" style={{ marginTop: 4 }}>
                Tippe einen Stoff an, um ihn weg- oder dazuzunehmen.
                {recognized.length > MAX_IDEA_SUBSTANCES
                  ? ` Gemischt werden höchstens ${MAX_IDEA_SUBSTANCES} Stoffe – vorausgewählt sind die, die am häufigsten vorkommen.`
                  : ''}
              </p>
              <div className="row" style={{ gap: 6 }}>
                {recognized.map(({ substance, count, spellings }) => {
                  const active = chosen.has(substance.id);
                  const full = !active && chosenCount >= MAX_IDEA_SUBSTANCES;
                  return (
                    <button
                      key={substance.id}
                      type="button"
                      className={`chip chip-small${active ? ' active' : ''}`}
                      aria-pressed={active}
                      disabled={full}
                      title={`${count}× im Text, als «${spellings.join('», «')}»`}
                      onClick={() =>
                        setChosen((current) => {
                          const next = new Set(current);
                          if (next.has(substance.id)) next.delete(substance.id);
                          else next.add(substance.id);
                          return next;
                        })
                      }
                    >
                      {active ? '✓ ' : ''}
                      {substance.name}
                      {count > 1 ? ` · ${count}×` : ''}
                    </button>
                  );
                })}
              </div>
              <div className="row" style={{ marginTop: 12, gap: 10 }}>
                <button type="button" className="button" disabled={chosenCount < 1 || phase === 'suchen'} onClick={() => void search()}>
                  💡 Spannende Reaktionen finden
                </button>
                <span className="small subtle">
                  {chosenCount} Stoffe · {pairCount.toLocaleString('de-DE')} Paare
                  {modelStatus === 'bereit' ? ' · mit Reaktions-KI' : modelStatus === 'laden' ? ' · KI wird geladen …' : ''}
                </span>
              </div>
            </>
          )}
          {phase === 'suchen' && progress && (
            <div style={{ marginTop: 12 }}>
              <progress max={Math.max(1, progress.total)} value={progress.done} style={{ width: '100%' }} />
              <span className="small muted">
                Paar {progress.done.toLocaleString('de-DE')} von {progress.total.toLocaleString('de-DE')} wird gemischt …
              </span>
            </div>
          )}
        </section>
      )}

      {phase === 'fertig' && (
        <>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className={`chip${schoolOnly ? ' active' : ''}`} aria-pressed={schoolOnly} onClick={() => setSchoolOnly((value) => !value)}>
              Nur Schulversuche
            </button>
            <button type="button" className={`chip${runningOnly ? ' active' : ''}`} aria-pressed={runningOnly} onClick={() => setRunningOnly((value) => !value)}>
              Nur ohne Zusatz
            </button>
          </div>

          <section className="stack">
            <h2 style={{ margin: 0 }}>⚗ Reaktionen zum Ausprobieren ({shownReactions.length})</h2>
            {!shownReactions.length && (
              <Callout variant="info" title="Keine Reaktion gefunden">
                <p style={{ margin: 0 }}>
                  {reactions.length
                    ? 'Mit diesen Filtern bleibt nichts übrig.'
                    : 'Diese Stoffe reagieren paarweise nicht miteinander – oder nur so, dass die Werkbank es aus Sicherheitsgründen nicht simuliert.'}
                </p>
              </Callout>
            )}
            {shownReactions.map((idea) => (
              <ReactionIdeaCard key={idea.key} idea={idea} onTry={onTry} />
            ))}
          </section>

          <section className="stack">
            <h2 style={{ margin: 0 }}>🧪 Synthesen mit diesen Stoffen ({shownSyntheses.length})</h2>
            {!shownSyntheses.length && (
              <Callout variant="info" title="Keine passende Synthese im Katalog">
                <p style={{ margin: 0 }}>Für keine Synthese des Katalogs sind (fast) alle Edukte in der Liste.</p>
              </Callout>
            )}
            {shownSyntheses.map((idea) => (
              <SynthesisIdeaCard key={idea.synthesis.id} idea={idea} chosen={recognized.map((entry) => entry.substance)} onTry={onTry} />
            ))}
          </section>

          <Callout variant="warning" title="Vor jedem Versuch">
            <p style={{ margin: 0 }}>
              Die Vorschläge sind aus Regeln, Patentbelegen und der Reaktions-KI berechnet. Vor einem echten Versuch Anleitung,
              Sicherheitsdatenblätter und Schutzausrüstung prüfen und nur unter Aufsicht arbeiten. Gefährliche Mischungen schlägt
              die App nie vor.
            </p>
          </Callout>
        </>
      )}
    </div>
  );
}

function ReactionIdeaCard({ idea, onTry }: { idea: ReactionIdea; onTry: (substances: Substance[]) => void }) {
  const { reaction } = idea;
  return (
    <article className="card idea-card">
      <div className="card-title">
        <div>
          <h3 style={{ marginBottom: 2 }}>{reaction.title}</h3>
          <div className="small subtle">{idea.substances.map((entry) => entry.name).join(' + ')}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className={`badge badge-${reaction.evidence === 'ki' ? 'ai' : reaction.evidence === 'belegt' ? 'success' : reaction.evidence === 'lehrbuch' ? 'analytik' : 'warning'}`}>
            {reaction.evidence === 'ki' ? '🤖 ' : ''}
            {EVIDENCE_LABELS[reaction.evidence]}
          </span>
          <span className={`badge badge-${LEVEL_BADGE[reaction.safetyLevel] ?? 'warning'}`}>{reaction.safetyLevel}</span>
        </div>
      </div>
      <div className="equation-scroll">
        <div className="equation-text">{reaction.equation}</div>
      </div>
      {idea.highlights.length > 0 && (
        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          {idea.highlights.map((label) => (
            <span key={label} className="badge badge-technisch">
              {HIGHLIGHT_ICONS[label] ?? '✨'} {label}
            </span>
          ))}
        </div>
      )}
      <p style={{ marginTop: 8, marginBottom: 0 }}>👁 {reaction.observation}</p>
      {idea.needs.length > 0 && (
        <p className="small" style={{ marginTop: 6, marginBottom: 0 }}>
          <strong>Dafür nötig:</strong> {idea.needs.join('; ')}
        </p>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="button button-small" onClick={() => onTry(idea.substances)}>
          ⚗ In der Werkbank mischen
        </button>
      </div>
    </article>
  );
}

function SynthesisIdeaCard({ idea, chosen, onTry }: { idea: SynthesisIdea; chosen: Substance[]; onTry: (substances: Substance[]) => void }) {
  const { synthesis } = idea;
  const ids = new Set(chosen.map((entry) => entry.id));
  return (
    <article className="card idea-card">
      <div className="card-title">
        <div>
          <h3 style={{ marginBottom: 2 }}>{synthesis.product}</h3>
          <div className="small subtle">{synthesis.ruleName}</div>
        </div>
        <span className={`badge badge-${LEVEL_BADGE[synthesis.safetyLevel] ?? 'warning'}`}>{synthesis.safetyLevel}</span>
      </div>
      <div className="equation-scroll">
        <div className="equation-text">{synthesis.equation}</div>
      </div>
      <p className="small" style={{ marginTop: 8, marginBottom: 0 }}>
        <strong>Edukte:</strong>{' '}
        {[...synthesis.educts.map((educt) => `${ids.has(educt.id) ? '✓' : '✗'} ${educt.name}`), ...synthesis.otherEducts.map((name) => `✗ ${name}`)].join(' · ')}
      </p>
      {idea.missing.length > 0 && (
        <p className="small" style={{ marginTop: 4, marginBottom: 0 }}>
          <strong>Zusätzlich nötig:</strong> {idea.missing.join(', ')}
        </p>
      )}
      <p className="small subtle" style={{ marginTop: 4, marginBottom: 0 }}>
        {synthesis.conditions}
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="button button-small" onClick={() => onTry(synthesis.educts)}>
          ⚗ Edukte ins Gefäß
        </button>
        <Link className="button button-secondary button-small" to={`/synthesen?${new URLSearchParams({ q: synthesis.product }).toString()}`}>
          Im Synthesekatalog
        </Link>
      </div>
    </article>
  );
}
