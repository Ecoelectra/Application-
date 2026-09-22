/**
 * Elementdaten nach IUPAC (Standardatomgewichte, gerundet auf die in der
 * Laborpraxis übliche Stellenzahl). Die Tabelle wird als kompakte Zeichenkette
 * gehalten und beim Laden des Moduls einmalig geparst.
 *
 * Spalten: Ordnungszahl | Symbol | deutscher Name | Atommasse | Gruppe | Periode | Kategorie
 */

export type ElementCategory =
  | 'Alkalimetall'
  | 'Erdalkalimetall'
  | 'Übergangsmetall'
  | 'Lanthanoid'
  | 'Actinoid'
  | 'Metall'
  | 'Halbmetall'
  | 'Nichtmetall'
  | 'Halogen'
  | 'Edelgas';

export interface ChemElement {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  group: number;
  period: number;
  category: ElementCategory;
}

const TABLE = `
1|H|Wasserstoff|1.008|1|1|Nichtmetall
2|He|Helium|4.0026|18|1|Edelgas
3|Li|Lithium|6.94|1|2|Alkalimetall
4|Be|Beryllium|9.0122|2|2|Erdalkalimetall
5|B|Bor|10.81|13|2|Halbmetall
6|C|Kohlenstoff|12.011|14|2|Nichtmetall
7|N|Stickstoff|14.007|15|2|Nichtmetall
8|O|Sauerstoff|15.999|16|2|Nichtmetall
9|F|Fluor|18.998|17|2|Halogen
10|Ne|Neon|20.180|18|2|Edelgas
11|Na|Natrium|22.990|1|3|Alkalimetall
12|Mg|Magnesium|24.305|2|3|Erdalkalimetall
13|Al|Aluminium|26.982|13|3|Metall
14|Si|Silicium|28.085|14|3|Halbmetall
15|P|Phosphor|30.974|15|3|Nichtmetall
16|S|Schwefel|32.06|16|3|Nichtmetall
17|Cl|Chlor|35.45|17|3|Halogen
18|Ar|Argon|39.95|18|3|Edelgas
19|K|Kalium|39.098|1|4|Alkalimetall
20|Ca|Calcium|40.078|2|4|Erdalkalimetall
21|Sc|Scandium|44.956|3|4|Übergangsmetall
22|Ti|Titan|47.867|4|4|Übergangsmetall
23|V|Vanadium|50.942|5|4|Übergangsmetall
24|Cr|Chrom|51.996|6|4|Übergangsmetall
25|Mn|Mangan|54.938|7|4|Übergangsmetall
26|Fe|Eisen|55.845|8|4|Übergangsmetall
27|Co|Cobalt|58.933|9|4|Übergangsmetall
28|Ni|Nickel|58.693|10|4|Übergangsmetall
29|Cu|Kupfer|63.546|11|4|Übergangsmetall
30|Zn|Zink|65.38|12|4|Übergangsmetall
31|Ga|Gallium|69.723|13|4|Metall
32|Ge|Germanium|72.630|14|4|Halbmetall
33|As|Arsen|74.922|15|4|Halbmetall
34|Se|Selen|78.971|16|4|Nichtmetall
35|Br|Brom|79.904|17|4|Halogen
36|Kr|Krypton|83.798|18|4|Edelgas
37|Rb|Rubidium|85.468|1|5|Alkalimetall
38|Sr|Strontium|87.62|2|5|Erdalkalimetall
39|Y|Yttrium|88.906|3|5|Übergangsmetall
40|Zr|Zirconium|91.224|4|5|Übergangsmetall
41|Nb|Niob|92.906|5|5|Übergangsmetall
42|Mo|Molybdän|95.95|6|5|Übergangsmetall
43|Tc|Technetium|98|7|5|Übergangsmetall
44|Ru|Ruthenium|101.07|8|5|Übergangsmetall
45|Rh|Rhodium|102.91|9|5|Übergangsmetall
46|Pd|Palladium|106.42|10|5|Übergangsmetall
47|Ag|Silber|107.87|11|5|Übergangsmetall
48|Cd|Cadmium|112.41|12|5|Übergangsmetall
49|In|Indium|114.82|13|5|Metall
50|Sn|Zinn|118.71|14|5|Metall
51|Sb|Antimon|121.76|15|5|Halbmetall
52|Te|Tellur|127.60|16|5|Halbmetall
53|I|Iod|126.90|17|5|Halogen
54|Xe|Xenon|131.29|18|5|Edelgas
55|Cs|Caesium|132.91|1|6|Alkalimetall
56|Ba|Barium|137.33|2|6|Erdalkalimetall
57|La|Lanthan|138.91|3|6|Lanthanoid
58|Ce|Cer|140.12|3|6|Lanthanoid
59|Pr|Praseodym|140.91|3|6|Lanthanoid
60|Nd|Neodym|144.24|3|6|Lanthanoid
61|Pm|Promethium|145|3|6|Lanthanoid
62|Sm|Samarium|150.36|3|6|Lanthanoid
63|Eu|Europium|151.96|3|6|Lanthanoid
64|Gd|Gadolinium|157.25|3|6|Lanthanoid
65|Tb|Terbium|158.93|3|6|Lanthanoid
66|Dy|Dysprosium|162.50|3|6|Lanthanoid
67|Ho|Holmium|164.93|3|6|Lanthanoid
68|Er|Erbium|167.26|3|6|Lanthanoid
69|Tm|Thulium|168.93|3|6|Lanthanoid
70|Yb|Ytterbium|173.05|3|6|Lanthanoid
71|Lu|Lutetium|174.97|3|6|Lanthanoid
72|Hf|Hafnium|178.49|4|6|Übergangsmetall
73|Ta|Tantal|180.95|5|6|Übergangsmetall
74|W|Wolfram|183.84|6|6|Übergangsmetall
75|Re|Rhenium|186.21|7|6|Übergangsmetall
76|Os|Osmium|190.23|8|6|Übergangsmetall
77|Ir|Iridium|192.22|9|6|Übergangsmetall
78|Pt|Platin|195.08|10|6|Übergangsmetall
79|Au|Gold|196.97|11|6|Übergangsmetall
80|Hg|Quecksilber|200.59|12|6|Übergangsmetall
81|Tl|Thallium|204.38|13|6|Metall
82|Pb|Blei|207.2|14|6|Metall
83|Bi|Bismut|208.98|15|6|Metall
84|Po|Polonium|209|16|6|Halbmetall
85|At|Astat|210|17|6|Halogen
86|Rn|Radon|222|18|6|Edelgas
87|Fr|Francium|223|1|7|Alkalimetall
88|Ra|Radium|226|2|7|Erdalkalimetall
89|Ac|Actinium|227|3|7|Actinoid
90|Th|Thorium|232.04|3|7|Actinoid
91|Pa|Protactinium|231.04|3|7|Actinoid
92|U|Uran|238.03|3|7|Actinoid
93|Np|Neptunium|237|3|7|Actinoid
94|Pu|Plutonium|244|3|7|Actinoid
95|Am|Americium|243|3|7|Actinoid
96|Cm|Curium|247|3|7|Actinoid
97|Bk|Berkelium|247|3|7|Actinoid
98|Cf|Californium|251|3|7|Actinoid
99|Es|Einsteinium|252|3|7|Actinoid
100|Fm|Fermium|257|3|7|Actinoid
101|Md|Mendelevium|258|3|7|Actinoid
102|No|Nobelium|259|3|7|Actinoid
103|Lr|Lawrencium|266|3|7|Actinoid
104|Rf|Rutherfordium|267|4|7|Übergangsmetall
105|Db|Dubnium|268|5|7|Übergangsmetall
106|Sg|Seaborgium|269|6|7|Übergangsmetall
107|Bh|Bohrium|270|7|7|Übergangsmetall
108|Hs|Hassium|269|8|7|Übergangsmetall
109|Mt|Meitnerium|278|9|7|Übergangsmetall
110|Ds|Darmstadtium|281|10|7|Übergangsmetall
111|Rg|Roentgenium|282|11|7|Übergangsmetall
112|Cn|Copernicium|285|12|7|Übergangsmetall
113|Nh|Nihonium|286|13|7|Metall
114|Fl|Flerovium|289|14|7|Metall
115|Mc|Moscovium|290|15|7|Metall
116|Lv|Livermorium|293|16|7|Metall
117|Ts|Tenness|294|17|7|Halogen
118|Og|Oganesson|294|18|7|Edelgas
`.trim();

export const ELEMENTS: ChemElement[] = TABLE.split('\n').map((line) => {
  const [z, symbol, name, mass, group, period, category] = line.split('|');
  return {
    z: Number(z),
    symbol,
    name,
    mass: Number(mass),
    group: Number(group),
    period: Number(period),
    category: category as ElementCategory,
  };
});

export const ELEMENT_BY_SYMBOL: ReadonlyMap<string, ChemElement> = new Map(
  ELEMENTS.map((e) => [e.symbol, e]),
);

export function elementBySymbol(symbol: string): ChemElement | undefined {
  return ELEMENT_BY_SYMBOL.get(symbol);
}

/** Atommasse in g/mol; wirft bei unbekanntem Symbol. */
export function atomicMass(symbol: string): number {
  const el = ELEMENT_BY_SYMBOL.get(symbol);
  if (!el) throw new Error(`Unbekanntes Element: ${symbol}`);
  return el.mass;
}

export const METAL_CATEGORIES: ReadonlySet<ElementCategory> = new Set<ElementCategory>([
  'Alkalimetall',
  'Erdalkalimetall',
  'Übergangsmetall',
  'Lanthanoid',
  'Actinoid',
  'Metall',
]);

export function isMetal(symbol: string): boolean {
  const el = ELEMENT_BY_SYMBOL.get(symbol);
  return el ? METAL_CATEGORIES.has(el.category) : false;
}
