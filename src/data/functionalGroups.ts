/**
 * Funktionelle Gruppen mit SMARTS-Mustern.
 *
 * Die Reihenfolge ist bewusst gewählt: spezifische Gruppen stehen vor den
 * allgemeinen, damit z. B. eine Carbonsäure nicht nur als "Carbonyl" erscheint.
 */
import type { FunctionalGroup } from './types';

export const FUNCTIONAL_GROUPS: FunctionalGroup[] = [
  {
    id: 'carbonsaeure',
    name: 'Carbonsäure',
    smarts: '[CX3](=[OX1])[OX2H1]',
    notation: 'R–COOH',
    description:
      'Carboxygruppe. Sauer (pKs ≈ 4–5), bildet Ester, Amide und Säurechloride; lässt sich zum Alkohol reduzieren.',
    hue: 8,
  },
  {
    id: 'carboxylat',
    name: 'Carboxylat',
    smarts: '[CX3](=[OX1])[OX1H0-]',
    notation: 'R–COO⁻',
    description:
      'Deprotonierte Carbonsäure. Ausgangspunkt der Kolbe-Elektrolyse und von Decarboxylierungen.',
    hue: 18,
  },
  {
    id: 'saeurechlorid',
    name: 'Carbonsäurechlorid',
    smarts: '[CX3](=[OX1])[Cl,Br,I]',
    notation: 'R–COCl',
    description:
      'Hochreaktives Carbonsäurederivat; reagiert mit Alkoholen und Aminen praktisch vollständig.',
    hue: 350,
  },
  {
    id: 'anhydrid',
    name: 'Carbonsäureanhydrid',
    smarts: '[CX3](=[OX1])[OX2][CX3](=[OX1])',
    notation: '(R–CO)₂O',
    description: 'Acylierungsmittel, milder als Säurechloride.',
    hue: 340,
  },
  {
    id: 'ester',
    name: 'Ester',
    smarts: '[CX3](=[OX1])[OX2][#6;!$([CX3]=[OX1])]',
    notation: 'R–COOR′',
    description:
      'Wird durch Säure oder Base hydrolysiert (Verseifung) und lässt sich zum primären Alkohol reduzieren.',
    hue: 30,
  },
  {
    id: 'amid',
    name: 'Carbonsäureamid',
    smarts: '[NX3][CX3](=[OX1])[#6]',
    notation: 'R–CONR′₂',
    description:
      'Sehr stabile Carbonylverbindung, Grundbaustein der Peptidbindung; anodisch α-funktionalisierbar (Shono).',
    hue: 45,
  },
  {
    id: 'aldehyd',
    name: 'Aldehyd',
    smarts: '[CX3H1](=[OX1])[#6]',
    notation: 'R–CHO',
    description:
      'Leicht oxidierbar zur Carbonsäure, reduzierbar zum primären Alkohol; geht Aldolreaktionen ein.',
    hue: 200,
  },
  {
    id: 'keton',
    name: 'Keton',
    smarts: '[#6][CX3](=[OX1])[#6]',
    notation: 'R–CO–R′',
    description:
      'Elektrophiles Carbonylzentrum für Grignard-, Wittig- und Reduktionsreaktionen.',
    hue: 215,
  },
  {
    id: 'alpha_ch_acid',
    name: 'α-ständiges C–H (CH-acide)',
    smarts: '[CX3](=[OX1])[CX4;H1,H2,H3]',
    notation: 'H–Cα–CO–',
    description:
      'Bildet mit Basen Enolate – Grundlage von Aldol-, Claisen- und Michael-Reaktionen.',
    hue: 190,
  },
  {
    id: 'alkohol_prim',
    name: 'primärer Alkohol',
    smarts: '[CX4;H2;!$(C[OX2H0])][OX2H1]',
    notation: 'R–CH₂–OH',
    description: 'Oxidierbar zum Aldehyd und weiter zur Carbonsäure; veresterbar.',
    hue: 120,
  },
  {
    id: 'alkohol_sek',
    name: 'sekundärer Alkohol',
    smarts: '[CX4;H1]([#6])([#6])[OX2H1]',
    notation: 'R₂CH–OH',
    description: 'Oxidierbar zum Keton; Substitution und Eliminierung möglich.',
    hue: 135,
  },
  {
    id: 'alkohol_tert',
    name: 'tertiärer Alkohol',
    smarts: '[CX4;H0]([#6])([#6])([#6])[OX2H1]',
    notation: 'R₃C–OH',
    description:
      'Nicht ohne C–C-Spaltung oxidierbar; neigt zu SN1-Substitution und E1-Eliminierung.',
    hue: 150,
  },
  {
    id: 'phenol',
    name: 'Phenol',
    smarts: '[c][OX2H1]',
    notation: 'Ar–OH',
    description:
      'Deutlich acider als Alkohole (pKs ≈ 10), stark aktivierend für elektrophile Zweitsubstitution.',
    hue: 100,
  },
  {
    id: 'amin_prim',
    name: 'primäres Amin',
    smarts: '[NX3;H2;!$(NC=[O,S,N]);!$(N[SX4](=O)=O);!$(N=*);!$([N+])]',
    notation: 'R–NH₂',
    description:
      'Nucleophil und basisch; bildet Amide, Imine und – bei Arylaminen – Diazoniumsalze.',
    hue: 265,
  },
  {
    id: 'amin_sek',
    name: 'sekundäres Amin',
    smarts: '[NX3;H1;!$(NC=[O,S,N]);!$(N[SX4](=O)=O);!$(N=*);!$([N+])]([#6])[#6]',
    notation: 'R₂NH',
    description: 'Bildet Enamine mit Carbonylverbindungen und Amide mit Acylierungsmitteln.',
    hue: 275,
  },
  {
    id: 'amin_tert',
    name: 'tertiäres Amin',
    smarts: '[NX3;H0;!$(NC=[O,S,N]);!$(N=*);!$([N+]);!$(N[a])]([#6])([#6])[#6]',
    notation: 'R₃N',
    description: 'Hilfsbase und Nucleophilkatalysator; anodisch leicht oxidierbar.',
    hue: 285,
  },
  {
    id: 'anilin',
    name: 'aromatisches Amin',
    smarts: '[c][NX3;!$(NC=O);!$([N+])]',
    notation: 'Ar–NH₂',
    description:
      'Stark aktivierender Substituent; Ausgangsstoff für Diazotierung und Azofarbstoffe.',
    hue: 300,
  },
  {
    id: 'nitro',
    name: 'Nitrogruppe',
    smarts: '[$([NX3](=O)=O),$([NX3+](=O)[O-])]',
    notation: 'R–NO₂',
    description:
      'Stark desaktivierend und meta-dirigierend; lässt sich chemisch oder kathodisch zum Amin reduzieren.',
    hue: 55,
  },
  {
    id: 'nitril',
    name: 'Nitril',
    smarts: '[NX1]#[CX2]',
    notation: 'R–C≡N',
    description:
      'Hydrolysierbar zur Carbonsäure, reduzierbar zum primären Amin; kathodisch hydrodimerisierbar.',
    hue: 240,
  },
  {
    id: 'imin',
    name: 'Imin (Schiffsche Base)',
    smarts: '[CX3]=[NX2][#6,#1]',
    notation: 'R₂C=NR′',
    description: 'Zwischenstufe der reduktiven Aminierung; hydrolyseempfindlich.',
    hue: 255,
  },
  {
    id: 'alken',
    name: 'Alken',
    smarts: '[CX3;!$(C=O);!$(C=N);!$(C=S)]=[CX3;!$(C=O)]',
    notation: 'C=C',
    description:
      'Elektronenreiche Doppelbindung für Additionen, Epoxidierung, Dihydroxylierung und Ozonolyse.',
    hue: 85,
  },
  {
    id: 'alkin',
    name: 'Alkin',
    smarts: '[CX2]#[CX2]',
    notation: 'C≡C',
    description: 'Partiell oder vollständig hydrierbar; terminal CH-acide (Sonogashira).',
    hue: 75,
  },
  {
    id: 'aromat',
    name: 'Aromat',
    smarts: 'c1ccccc1',
    notation: 'Ar–H',
    description:
      'Substitutionsträger für Nitrierung, Sulfonierung, Halogenierung und Friedel-Crafts-Reaktionen.',
    hue: 20,
  },
  {
    id: 'halogenalkan_prim',
    name: 'primäres Halogenalkan',
    smarts: '[CX4;H2][F,Cl,Br,I]',
    notation: 'R–CH₂–X',
    description: 'Bevorzugtes Substrat für SN2-Reaktionen.',
    hue: 170,
  },
  {
    id: 'halogenalkan_sek',
    name: 'sekundäres Halogenalkan',
    smarts: '[CX4;H1]([#6])([#6])[F,Cl,Br,I]',
    notation: 'R₂CH–X',
    description: 'Grenzfall zwischen SN1 und SN2; neigt zur Eliminierung.',
    hue: 165,
  },
  {
    id: 'halogenalkan_tert',
    name: 'tertiäres Halogenalkan',
    smarts: '[CX4;H0]([#6])([#6])([#6])[F,Cl,Br,I]',
    notation: 'R₃C–X',
    description: 'Reagiert über Carbeniumionen (SN1/E1).',
    hue: 160,
  },
  {
    id: 'arylhalogenid',
    name: 'Arylhalogenid',
    smarts: '[c][F,Cl,Br,I]',
    notation: 'Ar–X',
    description:
      'Substrat für palladiumkatalysierte Kreuzkupplungen (Suzuki, Heck, Sonogashira).',
    hue: 180,
  },
  {
    id: 'ether',
    name: 'Ether',
    smarts: '[OD2;!$(O[CX3]=[OX1]);!$([OX2r3])]([#6])[#6]',
    notation: 'R–O–R′',
    description: 'Reaktionsträge, gutes Lösungsmittel; spaltbar mit starken Säuren (HI, HBr).',
    hue: 110,
  },
  {
    id: 'epoxid',
    name: 'Epoxid',
    smarts: '[OX2r3]1[#6r3][#6r3]1',
    notation: 'Oxiran',
    description: 'Gespannter Dreiring, wird von Nucleophilen regioselektiv geöffnet.',
    hue: 95,
  },
  {
    id: 'thiol',
    name: 'Thiol',
    smarts: '[#16X2H]',
    notation: 'R–SH',
    description: 'Sehr gutes Nucleophil; oxidiert leicht zum Disulfid.',
    hue: 60,
  },
  {
    id: 'sulfonsaeure',
    name: 'Sulfonsäure',
    smarts: '[SX4](=[OX1])(=[OX1])[OX2H1]',
    notation: 'R–SO₃H',
    description: 'Starke Säure, Zwischenstufe bei der Sulfonierung von Aromaten.',
    hue: 40,
  },
  {
    id: 'boronsaeure',
    name: 'Boronsäure',
    smarts: '[#6][BX3]([OX2H1])[OX2H1]',
    notation: 'R–B(OH)₂',
    description: 'Transmetallierungspartner der Suzuki-Miyaura-Kupplung.',
    hue: 225,
  },
  {
    id: 'grignard',
    name: 'Grignard-Verbindung',
    smarts: '[#6][Mg][F,Cl,Br,I]',
    notation: 'R–MgX',
    description: 'Starkes Kohlenstoffnucleophil und starke Base; reagiert heftig mit Wasser.',
    hue: 320,
  },
  {
    id: 'diazonium',
    name: 'Diazoniumsalz',
    smarts: '[c][NX2+]#[NX1]',
    notation: 'Ar–N₂⁺',
    description:
      'Vielseitige Zwischenstufe: Azokupplung, Sandmeyer-Reaktion, Verkochung. Thermisch labil.',
    hue: 310,
  },
];

export const FUNCTIONAL_GROUP_BY_ID: ReadonlyMap<string, FunctionalGroup> = new Map(
  FUNCTIONAL_GROUPS.map((group) => [group.id, group]),
);

export function functionalGroupName(id: string): string {
  return FUNCTIONAL_GROUP_BY_ID.get(id)?.name ?? id;
}
