/** Werkbank «PDF-Ideen»: Stoffe in einem PDF erkennen und Reaktionen und Synthesen vorschlagen. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MainModule } from '@rdkit/rdkit';
import initRDKitModule from '@rdkit/rdkit';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanText, recognizeSubstances, validCas } from '../textSubstances';
import { findReactionIdeas, findSynthesisIdeas, ideaScore } from '../pdfIdeas';
import { extractText, type PdfLibrary } from '../../services/pdfText';
import { loadCatalog } from '../../data/catalog';
import { substanceById } from '../../data/substances';
import type { Substance } from '../../data/types';

let rdkit: MainModule;

beforeAll(async () => {
  rdkit = await initRDKitModule();
}, 60_000);

function get(id: string): Substance {
  const substance = substanceById(id);
  if (!substance) throw new Error(`Stoff ${id} fehlt`);
  return substance;
}

const names = (text: string) => recognizeSubstances(text).map((entry) => entry.substance.name);

describe('Stoffe im Text erkennen', () => {
  it('liest eine Chemikalienliste aus einem PDF', async () => {
    const data = new Uint8Array(readFileSync(resolve(__dirname, '../../__tests__/fixtures/chemikalienliste.pdf')));
    const pdf = await extractText(pdfjs as unknown as PdfLibrary, data);
    expect(pdf.pages).toBe(1);
    expect(pdf.emptyPages).toBe(0);
    expect(pdf.text).toContain('Salzsäure');
    const found = recognizeSubstances(pdf.text);
    const ids = found.map((entry) => entry.substance.id);
    expect(ids).toEqual(
      expect.arrayContaining(['natriumhydroxid', 'salzsaeure', 'eisen', 'zink', 'silbernitrat', 'natriumchlorid', 'ethanol', 'essigsaeure', 'kaliumiodid', 'magnesium']),
    );
    // Kochsalz: Name, Synonym und CAS-Nummer – am häufigsten, steht vorn
    expect(found[0].substance.id).toBe('natriumchlorid');
    expect(found[0].count).toBe(3);
    // Summenformel H2SO4
    expect(ids).toContain('schwefelsaeure');
  });

  it('Beugung, Trennung am Zeilenende, Darreichungsform und Kürzel', () => {
    expect(names('Die Dichte des Ethanols ist geringer.')).toContain('Ethanol');
    expect(names('Man gibt Natrium-\nchlorid dazu.')).toContain('Natriumchlorid');
    expect(names('Kupferblech und Eisenpulver')).toEqual(expect.arrayContaining(['Kupfer', 'Eisen']));
    expect(names('In CuSO₄-Lösung')).toEqual([]); // Formel mit Anhang: keine sichere Zuordnung
    expect(names('gelöst in CuSO₄ und NaCl')).toEqual(expect.arrayContaining(['Natriumchlorid']));
    expect(cleanText('Salz­säure')).toBe('Salzsäure');
  });

  it('allgemeine Wörter sind keine Stoffe', () => {
    expect(names('Eine Base und eine Säure bilden ein Salz. Das Glas ist aus Metall; die Probe liegt im Eis.')).toEqual([]);
  });

  it('CAS-Nummern nur mit gültiger Prüfziffer', () => {
    expect(validCas('7647-14-5')).toBe(true);
    expect(validCas('7732-18-5')).toBe(true);
    expect(validCas('7647-14-6')).toBe(false);
    expect(names('CAS 7647-14-6')).toEqual([]);
  });
});

describe('Ideen aus der Stoffliste', () => {
  it('findet spannende Reaktionen: Niederschlag mit Silbernitrat, Metall in Säure', async () => {
    const substances = ['silbernitrat', 'natriumchlorid', 'kaliumiodid', 'kupfersulfat', 'natriumhydroxid', 'eisen', 'salzsaeure', 'magnesium'].map(get);
    let lastProgress = 0;
    const ideas = await findReactionIdeas(rdkit, null, substances, { onProgress: (done) => (lastProgress = done) });
    expect(lastProgress).toBe(28);
    expect(ideas.length).toBeGreaterThan(5);
    for (let i = 1; i < ideas.length; i++) expect(ideas[i - 1].score).toBeGreaterThanOrEqual(ideas[i].score);
    const silver = ideas.find((idea) => idea.substances.some((entry) => entry.id === 'silbernitrat') && idea.substances.some((entry) => entry.id === 'natriumchlorid'));
    expect(silver?.highlights).toContain('Niederschlag');
    expect(silver?.needs).toEqual([]);
    expect(ideas.some((idea) => idea.substances.some((entry) => entry.id === 'magnesium') && idea.highlights.includes('Gas'))).toBe(true);
    // Physikalische Vorgänge (bloßes Lösen) sind keine Idee
    expect(ideas.every((idea) => idea.reaction.kind !== 'physikalisch')).toBe(true);
  }, 120_000);

  it('schlägt gefährliche Mischungen nie vor', async () => {
    const ideas = await findReactionIdeas(rdkit, null, ['natriumhypochlorit', 'salzsaeure'].map(get));
    expect(ideas).toEqual([]);
  }, 60_000);

  it('findet Synthesen, deren Edukte in der Liste stehen', async () => {
    const catalog = await loadCatalog();
    const ideas = findSynthesisIdeas(catalog, ['ethanol', 'essigsaeure', 'salicylsaeure'].map(get));
    expect(ideas.length).toBeGreaterThan(0);
    const ester = ideas.find((idea) => idea.synthesis.educts.every((educt) => ['ethanol', 'essigsaeure'].includes(educt.id)) && /ester/i.test(idea.synthesis.ruleName));
    expect(ester).toBeDefined();
    expect(ester?.missing).toEqual([]);
    for (const idea of ideas) expect(idea.missing.length).toBeLessThanOrEqual(1);
    // Vollständige Synthesen vor denen, denen ein Edukt fehlt
    const firstIncomplete = ideas.findIndex((idea) => idea.missing.length);
    if (firstIncomplete >= 0) expect(ideas.slice(firstIncomplete).every((idea) => idea.missing.length)).toBe(true);
  }, 60_000);

  it('Bewertung: vollständige Lehrbuchreaktion vor Vorhersage mit fehlender Bedingung', () => {
    const base = {
      id: 'x', kind: 'anorganisch' as const, title: 'x', reactionType: 'x', equation: 'x', products: [], explanation: '', conditions: '',
      hazards: [], tags: [], catalysisMatched: false, evidenceNote: '',
    };
    const textbook = ideaScore({ ...base, observation: 'Ein weißer Niederschlag fällt aus.', safetyLevel: 'Schulversuch', missing: [], evidence: 'lehrbuch' });
    const predicted = ideaScore({ ...base, observation: 'Keine sichtbare Änderung.', safetyLevel: 'Fortgeschritten', missing: ['Erhitzen nötig'], evidence: 'vorhersage' });
    expect(textbook).toBeGreaterThan(predicted);
    expect(ideaScore({ ...base, kind: 'physikalisch', observation: '', safetyLevel: 'Schulversuch', missing: [], evidence: 'vorhersage' })).toBe(-Infinity);
  });
});
