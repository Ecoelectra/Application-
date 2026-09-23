/**
 * Sicherheitsprüfung für eingegebene Stoffe.
 *
 * Die App ist ein Lern- und Laborwerkzeug. Für Stoffgruppen, deren Herstellung
 * rechtlich reglementiert ist oder deren einziger Zweck die Schädigung von
 * Menschen ist, werden weiterhin Eigenschaften und Gefahrenhinweise angezeigt,
 * aber keine Synthesevorschriften.
 */
import type { MainModule } from '@rdkit/rdkit';
import { matchSmarts } from './rdkit';

export type RestrictionCategory =
  | 'Chemiewaffe'
  | 'Explosivstoff'
  | 'Betäubungsmittel'
  | 'Hochtoxisch';

export interface RestrictionRule {
  id: string;
  category: RestrictionCategory;
  /** SMARTS-Muster, das auf die Stoffgruppe anspricht */
  smarts?: string;
  /** Mindestanzahl an Treffern, ab der die Regel greift */
  minMatches?: number;
  /** Namensbestandteile (kleingeschrieben) */
  nameFragments?: string[];
  explanation: string;
}

export interface SafetyAssessment {
  restricted: boolean;
  category?: RestrictionCategory;
  explanation?: string;
  /** Allgemeine Hinweise, die unabhängig von einer Sperre gelten */
  notes: string[];
}

const RESTRICTIONS: RestrictionRule[] = [
  {
    id: 'phosphorsaeureester-kampfstoff',
    category: 'Chemiewaffe',
    smarts: '[PX4](=[OX1])([F,C#N])',
    explanation:
      'Struktur eines phosphororganischen Nervenkampfstoffs (Chemiewaffenübereinkommen, Liste 1).',
  },
  {
    id: 'schwefellost',
    category: 'Chemiewaffe',
    smarts: '[Cl,Br]CC[SX2]CC[Cl,Br]',
    explanation: 'Struktur eines Schwefel-Lost-Derivats (Hautkampfstoff, CWÜ Liste 1).',
  },
  {
    id: 'stickstofflost',
    category: 'Chemiewaffe',
    smarts: '[Cl,Br]CC[NX3](CC[Cl,Br])',
    explanation: 'Struktur eines Stickstoff-Lost-Derivats (Hautkampfstoff, CWÜ Liste 1).',
  },
  {
    id: 'polynitroaromat',
    category: 'Explosivstoff',
    smarts: '[c][$([NX3](=O)=O),$([NX3+](=O)[O-])]',
    minMatches: 3,
    explanation:
      'Mehrfach nitrierter Aromat – typische Struktur eines Sprengstoffs (z. B. TNT, Pikrinsäure).',
  },
  {
    id: 'salpetersaeureester',
    category: 'Explosivstoff',
    smarts: '[CX4][OX2][$([NX3](=O)=O),$([NX3+](=O)[O-])]',
    minMatches: 2,
    explanation: 'Mehrfacher Salpetersäureester – Struktur eines brisanten Sprengstoffs (z. B. Nitroglycerin).',
  },
  {
    id: 'peroxid-explosivstoff',
    category: 'Explosivstoff',
    smarts: '[OX2][OX2][CX4]([CX4])([CX4])[OX2][OX2]',
    explanation: 'Cyclisches Peroxid – hochempfindlicher Primärexplosivstoff.',
  },
  {
    id: 'nitramin',
    category: 'Explosivstoff',
    smarts: '[NX3]([$([NX3](=O)=O),$([NX3+](=O)[O-])])',
    minMatches: 3,
    explanation: 'Mehrfaches Nitramin – Struktur militärischer Sprengstoffe (z. B. RDX, HMX).',
  },
  {
    id: 'btm-namen',
    category: 'Betäubungsmittel',
    nameFragments: [
      'heroin',
      'diacetylmorphin',
      'fentanyl',
      'carfentanil',
      'methamphetamin',
      'amphetamin',
      'mdma',
      'lysergsäurediethylamid',
      'lsd',
      'kokain',
      'cocain',
    ],
    explanation:
      'Betäubungsmittel nach BtMG bzw. international kontrollierter Stoff – Herstellung ist ohne Erlaubnis strafbar.',
  },
  {
    id: 'kampfstoff-namen',
    category: 'Chemiewaffe',
    nameFragments: ['sarin', 'soman', 'tabun', 'nowitschok', 'novichok', 'vx-kampfstoff', 'senfgas', 'lost', 'phosgen'],
    explanation: 'Als chemischer Kampfstoff eingestufter Stoff (Chemiewaffenübereinkommen).',
  },
  {
    id: 'explosivstoff-namen',
    category: 'Explosivstoff',
    nameFragments: [
      'trinitrotoluol',
      'nitroglycerin',
      'nitroglyzerin',
      'hexogen',
      'octogen',
      'tetranitro',
      'bleiazid',
      'knallquecksilber',
      'acetonperoxid',
      'triacetontriperoxid',
    ],
    explanation: 'Explosivstoff – Herstellung unterliegt dem Sprengstoffgesetz.',
  },
];

/**
 * Prüft einen Stoff anhand von Struktur und Name.
 * Ohne RDKit-Instanz wird nur der Name geprüft.
 */
export function assessSubstance(
  name: string | undefined,
  smiles: string | undefined,
  rdkit: MainModule | null,
): SafetyAssessment {
  const notes: string[] = [];
  const lowerName = (name ?? '').toLowerCase();

  for (const rule of RESTRICTIONS) {
    if (rule.nameFragments?.some((fragment) => lowerName.includes(fragment))) {
      return { restricted: true, category: rule.category, explanation: rule.explanation, notes };
    }
    if (rule.smarts && smiles && rdkit) {
      const matches = matchSmarts(rdkit, smiles, rule.smarts);
      if (matches.length >= (rule.minMatches ?? 1)) {
        return { restricted: true, category: rule.category, explanation: rule.explanation, notes };
      }
    }
  }

  if (smiles && rdkit) {
    if (matchSmarts(rdkit, smiles, '[OX2][OX2]').length > 0) {
      notes.push(
        'Peroxidgruppe erkannt: nicht erhitzen, nicht eindampfen und vor Reibung schützen. Peroxidtest vor dem Einengen durchführen.',
      );
    }
    if (matchSmarts(rdkit, smiles, '[N-]=[N+]=[N-,N]').length > 0) {
      notes.push('Azidgruppe erkannt: stoß- und reibungsempfindlich, niemals mit Schwermetallen kombinieren.');
    }
    if (matchSmarts(rdkit, smiles, '[$([NX3](=O)=O),$([NX3+](=O)[O-])]').length > 0) {
      notes.push('Nitrogruppe erkannt: thermisch belastbare Ansätze klein halten und Temperatur streng kontrollieren.');
    }
    if (matchSmarts(rdkit, smiles, '[CX2]#[NX1]').length > 0) {
      notes.push('Nitril/Cyanid erkannt: niemals mit Säuren zusammenbringen – Gefahr der Blausäureentwicklung.');
    }
  }

  return { restricted: false, notes };
}

/** Standardhinweis, der bei gesperrten Stoffen angezeigt wird. */
export const RESTRICTION_NOTICE =
  'Für diesen Stoff zeigt die App bewusst keine Synthesevorschriften an. Eigenschaften, Sicherheitsdaten ' +
  'und Literaturhinweise bleiben verfügbar. Wenn du in einem zugelassenen Labor damit arbeitest, nutze bitte ' +
  'die geprüften Vorschriften deiner Einrichtung.';

/**
 * Stoffpaare, die im Labor nicht zusammengebracht werden dürfen.
 *
 * Die Werkbank verweigert für diese Kombinationen jede Simulation und zeigt
 * stattdessen den Gefahrenhinweis. Es sind dieselben Angaben, die auf den
 * Gefäßen und auf jedem Sicherheitsplakat stehen – bewusst ohne Mengen,
 * Bedingungen oder Durchführung.
 */
export interface MixtureWarning {
  /** Kennungen der beteiligten Stoffe (Reihenfolge unerheblich) */
  substances: [string, string];
  hazard: string;
}

const NEVER_MIX: MixtureWarning[] = [
  {
    substances: ['natriumhypochlorit', 'salzsaeure'],
    hazard: 'Hypochlorit und Säure setzen Chlor frei – ein giftiges Atemgift. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['natriumhypochlorit', 'schwefelsaeure'],
    hazard: 'Hypochlorit und Säure setzen Chlor frei – ein giftiges Atemgift. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['natriumhypochlorit', 'essigsaeure'],
    hazard: 'Auch schwache Säuren setzen aus Hypochlorit Chlor frei. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['natriumhypochlorit', 'ammoniak'],
    hazard: 'Hypochlorit und Ammoniak bilden Chloramine – stark reizende, giftige Gase. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['natriumcyanid', 'salzsaeure'],
    hazard: 'Cyanidsalze setzen mit Säuren Blausäure frei, die schon in kleinsten Mengen tödlich wirkt. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['natriumcyanid', 'schwefelsaeure'],
    hazard: 'Cyanidsalze setzen mit Säuren Blausäure frei, die schon in kleinsten Mengen tödlich wirkt. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['kaliumcyanid', 'salzsaeure'],
    hazard: 'Cyanidsalze setzen mit Säuren Blausäure frei, die schon in kleinsten Mengen tödlich wirkt. Diese Mischung wird nicht simuliert.',
  },
  {
    substances: ['kaliumcyanid', 'schwefelsaeure'],
    hazard: 'Cyanidsalze setzen mit Säuren Blausäure frei, die schon in kleinsten Mengen tödlich wirkt. Diese Mischung wird nicht simuliert.',
  },
];

/** Prüft, ob zwei Stoffe zusammen eine akute Gefahr darstellen. */
export function mixtureWarning(substanceIds: string[]): MixtureWarning | undefined {
  return NEVER_MIX.find(
    (entry) =>
      substanceIds.includes(entry.substances[0]) && substanceIds.includes(entry.substances[1]),
  );
}

/**
 * Prüft ein berechnetes Produkt, bevor es in den Synthesekatalog aufgenommen
 * oder in der Werkbank angezeigt wird.
 *
 * Der Katalog wird aus geprüften Stoffen und geprüften Reaktionsvorschriften
 * erzeugt; diese Prüfung ist die zweite Sicherung für den Fall, dass eine
 * Vorschrift auf ein Substrat trifft, dessen Produkt nicht gezeigt werden soll.
 */
export function isPublishableProduct(
  smiles: string | undefined,
  rdkit: MainModule | null,
): boolean {
  if (!smiles) return true;
  return !assessSubstance(undefined, smiles, rdkit).restricted;
}
