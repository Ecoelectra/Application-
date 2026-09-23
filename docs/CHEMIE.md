# Fachliche Grundlagen

Dieses Dokument fasst zusammen, worauf die App fachlich aufbaut: wie sie
Reaktionen findet, welche Mechanismusklassen hinterlegt sind, wie
Reaktionsgleichungen ausgeglichen werden und welche Größen die Elektrochemie
bestimmen.

---

## 1. Wie die App eine passende Reaktion findet

### 1.1 Funktionelle Gruppen als Suchschlüssel

Organische Reaktivität lässt sich fast vollständig an funktionellen Gruppen
festmachen: Ein Molekül reagiert dort, wo Elektronendichte ungleich verteilt ist.
Die App beschreibt jede Gruppe durch ein **SMARTS-Muster**, eine
Abfragesprache für Teilstrukturen.

| Gruppe | SMARTS | Warum so |
|---|---|---|
| Carbonsäure | `[CX3](=[OX1])[OX2H1]` | `X3` erzwingt drei Bindungspartner am Kohlenstoff, `OX2H1` genau eine OH-Gruppe – so wird ein Ester nicht mitgefangen |
| primärer Alkohol | `[CX4;H2;!$(C[OX2H0])][OX2H1]` | zwei Wasserstoffatome am Carbinolkohlenstoff; der negative rekursive Ausdruck schließt Halbacetale aus |
| Keton | `[#6][CX3](=[OX1])[#6]` | Kohlenstoff auf beiden Seiten unterscheidet das Keton vom Aldehyd |
| Alken | `[CX3;!$(C=O);!$(C=N)]=[CX3]` | schließt Carbonyl- und Imin-Doppelbindungen aus |
| Diazoniumsalz | `[c][NX2+]#[NX1]` | nur die aromatische Variante ist bei 0 °C handhabbar |

Die Reihenfolge der Muster ist bewusst gewählt: spezifische Gruppen stehen vor
allgemeinen, damit eine Carbonsäure nicht bloß als «Carbonyl» erscheint.

### 1.2 Von der Gruppe zum Produkt

Eine erkannte Gruppe allein sagt noch nicht, was entsteht. Deshalb trägt jede
Reaktion zusätzlich eine **Reaktionsvorschrift als Reaktions-SMARTS** (SMIRKS).
Sie beschreibt die Umwandlung atomgenau über Atommarkierungen:

```
Fischer-Veresterung:
[CX3:1](=[OX1:2])[OX2H1] . [OX2H1:3][CX4:4]  >>  [CX3:1](=[OX1:2])[O:3][CX4:4]
```

Die markierten Atome `:1` bis `:4` finden sich auf beiden Seiten wieder; was
nicht markiert ist – hier die austretende OH-Gruppe – verschwindet. RDKit wendet
diese Vorschrift auf das eingegebene Molekül an und liefert die Produktstruktur
zurück. Aus Essigsäure und Ethanol wird so tatsächlich `CCOC(C)=O` berechnet,
nicht nur behauptet.

Reaktionen mit zwei Edukten geben an, **an welcher Stelle** der eingegebene Stoff
stehen darf (`substrateSlots`). Die Veresterung greift deshalb sowohl, wenn man
eine Carbonsäure eingibt, als auch bei einem Alkohol – mit dem jeweils
passenden Standardpartner.

### 1.3 Das Ionenmodell

Salze lassen sich nicht über SMILES beschreiben. Für sie arbeitet die App mit
einem Ionenmodell: Eine Formel wie CuSO₄ wird gegen alle Kombinationen bekannter
Ionen geprüft. Passt die Summenformel einer Kombination zur Eingabe, ist die
Zerlegung gefunden – Cu²⁺ und SO₄²⁻.

Dieser Umweg ist zuverlässiger, als die Formel zu zergliedern: Er kommt ohne
Sonderregeln mit Ca(OH)₂, NaHCO₃, (NH₄)₂SO₄ und Kristallwasser zurecht und
erkennt die Wertigkeit nebenbei mit. FeCl₂ und FeCl₃ liefern automatisch Fe²⁺
beziehungsweise Fe³⁺, weil nur diese Kombination die Ladungsbilanz erfüllt.

Nicht jeder Stoff passt in dieses Modell, und das ist richtig so: SiO₂ und TiO₂
sind Netzwerkoxide, P₄O₁₀ ist molekular, Fe₃O₄ enthält zwei Oxidationsstufen
nebeneinander. Für sie liefert das Modell bewusst kein Ergebnis.

Aus der Zerlegung folgen die **Löslichkeitsregeln** (alle Nitrate löslich, alle
Alkalisalze löslich, Carbonate und Phosphate nur mit Alkali- und Ammonium-Ionen,
Ausnahmen für Silber-, Blei- und Bariumsalze) und daraus die Frage, ob bei einer
Fällungsreaktion ein Niederschlag entsteht und welche Farbe er hat.

### 1.4 Anorganische Verfahren

Salze und Ionenverbindungen lassen sich nicht sinnvoll als SMILES beschreiben.
Für sie ist die Gleichung fest hinterlegt und wird über die **Summenformel**
zugeordnet: Wer `NaCl` eingibt, bekommt die Chloralkali-Elektrolyse und das
Downs-Verfahren vorgeschlagen. Der Vergleich läuft über die Hill-Notation, damit
`NaCl` und `ClNa` gleich behandelt werden.

### 1.5 Rangfolge der Vorschläge

Die Bewertung berücksichtigt drei Dinge: wie viele passende Gruppen gefunden
wurden, wie **spezifisch** die Regel ist (eine Reaktion, die nur auf Aldehyde
anspricht, rankt höher als eine, die jeden Aromaten annimmt) und ob sich ein
konkretes Produkt berechnen ließ. Regeln mit Reaktionsvorschrift, die
strukturell nicht greifen, werden gar nicht erst vorgeschlagen – sonst entstünden
chemisch falsche Empfehlungen.

---

## 2. Reaktionstypen und Mechanismen

### 2.1 Systematik

| Typ | Kennzeichen | Beispiele in der App |
|---|---|---|
| **Nucleophile Substitution** | Nucleophil ersetzt Abgangsgruppe | SN2-Nitrilsynthese, Williamson-Ethersynthese, Epoxidöffnung |
| **Elektrophile Addition** | π-Bindung greift Elektrophil an | Bromaddition, Markovnikov-Addition, Epoxidierung |
| **Eliminierung** | zwei Gruppen treten aus, π-Bindung entsteht | E2-Dehydrohalogenierung, saure Dehydratisierung |
| **Nucleophile Acyl-Substitution** | Addition, dann Abspaltung der Abgangsgruppe | Veresterung, Verseifung, Amidbildung |
| **Elektrophile Aromatensubstitution** | σ-Komplex, dann Rearomatisierung | Nitrierung, Sulfonierung, Friedel-Crafts |
| **Redox** | Elektronenübertragung | Hydrid-Reduktionen, Oxidationen, alle Elektrolysen |
| **Pericyclisch** | konzertiert, cyclischer Übergangszustand | Diels-Alder, Epoxidierung mit Persäure |
| **Metallorganische Katalyse** | Kreislauf mit Oxidationsstufenwechsel | Suzuki, Heck, katalytische Hydrierung |
| **Radikalisch** | Einelektronenschritte | Kolbe-Elektrolyse, Sandmeyer-Reaktion |

### 2.2 Die vier Grundfragen jedes Mechanismus

Jeder in der App hinterlegte Mechanismus beantwortet dieselben Fragen:

1. **Wo ist die Elektronendichte hoch, wo niedrig?** Das Nucleophil greift das
   Elektrophil an, nie umgekehrt.
2. **Welcher Schritt ist geschwindigkeitsbestimmend?** Er ist markiert und
   erscheint im Energieprofil als höchster Punkt.
3. **Welche Zwischenstufe entsteht?** Carbeniumion, σ-Komplex, tetraedrisches
   Zwischenprodukt, Radikal, Enolat – die Art der Zwischenstufe erklärt
   Stereochemie und Nebenprodukte.
4. **Was treibt die Reaktion?** Gasentwicklung (SO₂ beim Thionylchlorid, CO₂ bei
   Kolbe, N₂ bei Sandmeyer), Bildung einer besonders stabilen Bindung (P=O beim
   Wittig) oder ein irreversibler Protonierungsschritt (Verseifung).

### 2.3 SN1 gegen SN2 – die entscheidenden Faktoren

| | SN2 | SN1 |
|---|---|---|
| Substrat | primär | tertiär |
| Kinetik | 2. Ordnung, v = k·[R–X]·[Nu] | 1. Ordnung, v = k·[R–X] |
| Übergangszustand | fünffach koordiniert, konzertiert | planares Carbeniumion |
| Stereochemie | Walden-Umkehr | Racemat |
| Lösungsmittel | polar aprotisch (DMSO, DMF) | polar protisch (Wasser, Alkohol) |
| Konkurrenz | E2 bei starker Base | E1 bei Wärme |

Das gleiche Raster gilt für die Eliminierungen: **E2** verlangt eine
antiperiplanare Anordnung von H und Abgangsgruppe, **E1** läuft über dasselbe
Carbeniumion wie SN1 – deshalb treten SN1 und E1 fast immer gemeinsam auf.

### 2.4 Energieprofile

Die App zeichnet zu jedem Mechanismus ein schematisches Energieprofil: Edukte
bei 0 kJ/mol, dann die Barrieren der einzelnen Schritte, am Ende das
Produktniveau. Es ist ausdrücklich schematisch – die Werte stammen aus der
Größenordnung der Literatur und sind zur Orientierung gedacht, nicht als
gemessene Aktivierungsenergien.

Was sich daran ablesen lässt: Ein exergonischer Verlauf (Produkte unter den
Edukten) bedeutet nicht, dass die Reaktion schnell abläuft – die Barriere
entscheidet über die Geschwindigkeit, die Lage der Produkte über das
Gleichgewicht. Die Wasserelektrolyse endet folgerichtig **über** den Edukten:
Sie ist endergonisch (ΔG = +237 kJ/mol je Mol H₂) und läuft nur erzwungen ab.

---

## 3. Reaktionsgleichungen

### 3.1 Ausgleichen über den Nullraum

Eine Reaktionsgleichung ist ausgeglichen, wenn jedes Element und die
Gesamtladung auf beiden Seiten gleich häufig auftreten. Das lässt sich als
lineares Gleichungssystem schreiben: Für jede Spezies eine Spalte, für jedes
Element (plus eine Zeile für die Ladung) eine Zeile, Produkte mit negativem
Vorzeichen. Gesucht ist ein Vektor **x** mit

> **A · x = 0**, alle Einträge von **x** positiv und ganzzahlig.

Die App bringt die Matrix mit exakter Bruchrechnung (BigInt-Zähler und -Nenner,
keine Gleitkommazahlen) auf reduzierte Stufenform, bestimmt eine Basis des
Nullraums und skaliert auf die kleinsten ganzen Zahlen.

Hat das System **mehr als eine** unabhängige Lösung, ist die Gleichung
unterbestimmt – etwa wenn eine Teilreaktion doppelt enthalten ist. Die App weist
darauf hin und sucht eine Linearkombination mit ausschließlich positiven
Koeffizienten.

Beispiel aus dem Werkzeug:

```
KMnO4 + HCl  →  KCl + MnCl2 + Cl2 + H2O
2 KMnO4 + 16 HCl  →  2 KCl + 2 MnCl2 + 5 Cl2 + 8 H2O
```

### 3.2 Ionengleichungen

Bei Ionengleichungen kommt die Ladungsbilanz als zusätzliche Zeile hinzu. Eine
Besonderheit der Schreibweise: Das Pluszeichen ist zugleich Trennzeichen und
Ladung (`Fe2+ + H+`). Die App wertet deshalb bei Ionengleichungen nur ein von
Leerzeichen umschlossenes Plus als Trenner.

### 3.3 Oxidationszahlen

Die App bestimmt Oxidationszahlen nach den üblichen Regeln in fester Reihenfolge:
Fluor immer −1, Alkalimetalle +1, Erdalkalimetalle +2, Wasserstoff +1 (in
Metallhydriden −1), Sauerstoff −2 (in Peroxiden −1), Halogene −1, sofern kein
elektronegativerer Partner vorhanden ist. Das verbleibende Element ergibt sich
aus der Ladungsbilanz – auch als Bruch: Fe₃O₄ liefert korrekt **+8/3**, weil das
Mineral zwei Fe(III) und ein Fe(II) enthält.

Sonderfälle wie H₂O₂, NaBH₄ oder OF₂ sind als Ausnahmen hinterlegt, weil die
Regeln dort zu falschen Werten führen würden.

### 3.4 Halbreaktionsmethode

Redoxgleichungen werden nicht als Ganzes ausgeglichen, sondern in zwei
Halbreaktionen zerlegt. Die Reihenfolge ist immer dieselbe:

1. **Hauptelement** ausgleichen (alles außer H und O)
2. **Sauerstoff** mit H₂O
3. **Wasserstoff** mit H⁺
4. **Ladung** mit Elektronen
5. im **basischen Milieu**: auf beiden Seiten so viele OH⁻ ergänzen, wie H⁺
   vorhanden sind; H⁺ + OH⁻ wird zu H₂O, danach kürzen

```
MnO4⁻ + 8 H⁺ + 5 e⁻  →  Mn²⁺ + 4 H₂O          (sauer)
MnO4⁻ + 2 H₂O + 3 e⁻  →  MnO₂ + 4 OH⁻          (basisch)
```

Zum Schluss werden beide Halbreaktionen über das kleinste gemeinsame Vielfache
der Elektronenzahlen kombiniert:

```
5 Fe²⁺ + MnO4⁻ + 8 H⁺  →  5 Fe³⁺ + Mn²⁺ + 4 H₂O
```

---

## 4. Elektrochemie

### 4.1 Thermodynamik: Was möglich ist

Das **Standardpotential** E° einer Halbzelle misst, wie stark die oxidierte Form
Elektronen aufnehmen will – bezogen auf die Normalwasserstoffelektrode
(2 H⁺ + 2 e⁻ ⇌ H₂, E° = 0 V, definiert).

Aus zwei Halbzellen ergibt sich die Zellspannung:

> **E°(Zelle) = E°(Kathode) − E°(Anode)**

und daraus unmittelbar die Thermodynamik:

> **ΔG° = −z · F · E°**  mit F = 96 485 C/mol
> **K = exp(z · F · E° / (R · T))**

Ein positives E° bedeutet ein galvanisches Element (läuft freiwillig), ein
negatives eine Elektrolyse (muss erzwungen werden). Das Daniell-Element
(Cu/Zn) kommt so auf 1,10 V und ΔG° = −213 kJ/mol.

Bei Bedingungen abseits des Standards gilt die **Nernst-Gleichung**:

> **E = E° + (R·T)/(z·F) · ln([Ox]/[Red])**

Bei 25 °C wird daraus der bekannte Faktor 0,0592 V je Zehnerpotenz. Wichtigste
Anwendung: Die Wasserstoffelektrode verschiebt sich mit E = −0,0592 V · pH.
Bei pH 7 liegt sie deshalb bei −0,41 V – das ist der Grund, warum sich Wasser in
neutraler Lösung nicht bei 0 V, sondern erst deutlich negativer zersetzt.

### 4.2 Kinetik: Was tatsächlich passiert

Die Thermodynamik sagt nur, was möglich ist. In der Praxis liegt die nötige
Spannung stets höher:

> **U(Zelle) = ΔE(thermodynamisch) + η(Anode) + η(Kathode) + I · R**

Die **Überspannung η** entscheidet über die Selektivität und ist oft
wichtiger als das Standardpotential:

- **Chloralkali-Elektrolyse:** Thermodynamisch wäre die Oxidation von Wasser zu
  Sauerstoff (+1,23 V) leichter als die von Chlorid (+1,36 V). Trotzdem entsteht
  fast ausschließlich Chlor, weil die Sauerstoffüberspannung an der
  Rutheniumoxid-Anode sehr hoch ist. Ohne diesen kinetischen Effekt gäbe es das
  Verfahren nicht.
- **Baizer-Prozess:** Cadmium- und Bleikathoden werden gerade wegen ihrer hohen
  **Wasserstoffüberspannung** eingesetzt – sonst würde an der Kathode nur
  Wasserstoff entstehen statt Adipodinitril.
- **Wasserelektrolyse:** Die Sauerstoffentwicklung an der Anode braucht vier
  Elektronen und vier Protonen und trägt mit 0,3–0,4 V Überspannung den größten
  Teil der Verluste. Die Zellspannung liegt deshalb bei 1,8–2,1 V statt bei
  1,23 V.

### 4.3 Faradaysche Gesetze: Wie viel entsteht

> **n = (I · t · η_Strom) / (z · F)**   und   **m = n · M**

Damit lässt sich jede Elektrolyse quantitativ planen. Die App rechnet zusätzlich
das Normvolumen für Gase (22,414 L/mol), den Ladungsbedarf in **F/mol** – die
übliche Kenngröße der Elektrosynthese – und den spezifischen Energiebedarf:

> **w = U · z · F / (M · η)**  in kWh je kg Produkt

Zwei Größenordnungen zur Einordnung: Chlor aus der Chloralkali-Elektrolyse
kostet etwa 2,3–2,6 kWh je kg, Aluminium aus der Schmelzflusselektrolyse
13–15 kWh je kg. Aluminiumrecycling braucht davon nur rund 5 %.

### 4.4 Zellaufbau

| Entscheidung | Wofür | Beispiel |
|---|---|---|
| **geteilt / ungeteilt** | Geteilt verhindert, dass das Produkt an der Gegenelektrode wieder zerstört wird – kostet aber Spannung | Nitroreduktion geteilt, Kolbe ungeteilt |
| **Anodenmaterial** | bestimmt die Überspannung und damit, was oxidiert wird | Platin für Kolbe, Graphit für Hofer-Moest |
| **Kathodenmaterial** | hohe Wasserstoffüberspannung unterdrückt die H₂-Entwicklung | Blei, Cadmium, Quecksilber (heute vermieden) |
| **Opferanode** | liefert Metallionen statt einer Oxidation | Magnesium bei Elektrocarboxylierung |
| **Leitsalz** | Leitfähigkeit ohne eigene Redoxchemie | Tetraalkylammoniumsalze; Perchlorate meiden – Explosionsgefahr beim Eindampfen |
| **Mediator** | überträgt die Reaktion in die Lösung, senkt das nötige Potential | TEMPO für Alkohole, Bromid bei Furan |
| **Betriebsart** | galvanostatisch ist einfach, potentiostatisch selektiv | Nitroreduktion stoppt potentiostatisch beim Hydroxylamin |

**Stromdichte als Steuergröße:** Kolbe-Elektrolyse und Hofer-Moest-Reaktion
starten identisch – Oxidation des Carboxylats, Abspaltung von CO₂, Alkylradikal.
Ob zwei Radikale zum Dimer kuppeln (Kolbe) oder ein zweites Elektron abgegeben
wird und ein Carbeniumion entsteht (Hofer-Moest), entscheidet allein die
Stromdichte und das Elektrodenmaterial: hohe Stromdichte an Platin für das
Dimer, niedrige an Graphit für das Carbeniumion.

### 4.5 Warum elektroorganische Synthese

Das Elektron ist ein Reagenz ohne Nebenprodukt. Statt stöchiometrischer
Oxidations- oder Reduktionsmittel – Chrom(VI), Osmium, Hydride – genügen Strom,
zwei Elektroden und ein Leitsalz. Über das Potential lässt sich die
Reaktionstiefe einstellen, was mit chemischen Reagenzien kaum gelingt.

Die App enthält neun elektroorganische Verfahren:

| Reaktion | Prinzip | Bedeutung |
|---|---|---|
| **Kolbe-Elektrolyse** (1849) | anodische Decarboxylierung, Radikaldimerisierung | erste benannte Elektrosynthese |
| **Hofer-Moest** | zweite Oxidation zum Carbeniumion | zeigt die Steuerung über die Stromdichte |
| **Shono-Oxidation** (1975) | anodische α-C–H-Funktionalisierung von Amiden | Zugang zu N-Acyliminiumionen |
| **Baizer-Prozess** (1964) | kathodische Hydrodimerisierung von Acrylnitril | größte organische Elektrosynthese, > 300 000 t/a Adipodinitril für Nylon |
| **TEMPO-Oxidation** | mediierte Alkoholoxidation | ersetzt Chrom und Hypochlorit |
| **kathodische Nitroreduktion** | potentialgesteuert bis Hydroxylamin oder Amin | Bamberger-Weg zu p-Aminophenol |
| **Pinakolkupplung** | Ketylradikale kuppeln | ohne Metallabfall |
| **anodische Methoxylierung** | indirekt über Bromid als Mediator | technisches BASF-Verfahren |
| **Elektrocarboxylierung** | CO₂ als C1-Baustein | stoffliche Nutzung von CO₂ |

---

## 5. Technische Verfahren

Die großindustriellen Prozesse in der App illustrieren jeweils ein Prinzip:

- **Haber-Bosch** – das Prinzip von Le Chatelier in Reinform: Die Reaktion ist
  exotherm (ΔH = −92 kJ/mol) und verringert die Teilchenzahl (4 → 2). Kälte und
  Druck begünstigen also das Produkt, doch bei Kälte läuft nichts. 450 °C und
  300 bar sind der Kompromiss; der Umsatz je Durchgang bleibt bei 15–20 %, durch
  Kreislaufführung werden über 95 % erreicht.
- **Ostwald-Verfahren** – Selektivität durch **Kinetik**: Thermodynamisch wäre N₂
  das stabilste Produkt der Ammoniakverbrennung. Die Kontaktzeit am Platinnetz
  von nur einer Millisekunde sorgt dafür, dass die Reaktion beim NO stehen
  bleibt.
- **Kontaktverfahren** – **Gleichgewichtsverschiebung durch Produktentzug**: Das
  Doppelkontaktverfahren zieht nach der dritten Horde das SO₃ ab und treibt den
  Gesamtumsatz auf über 99,5 %.
- **Solvay-Verfahren** – **Kreislaufführung**: Ammoniak wird vollständig
  zurückgewonnen, verbraucht werden nur Salz und Kalk. Die Triebkraft ist ein
  Löslichkeitsunterschied: NaHCO₃ fällt als erstes aus.
- **Hochofen** – **Gegenstromprinzip** und das Boudouard-Gleichgewicht
  (C + CO₂ ⇌ 2 CO), das oberhalb 1000 °C das Reduktionsgas bereitstellt.
- **Thermitreaktion** – **Differenz der Bildungsenthalpien**: Aluminium hat eine
  höhere Sauerstoffaffinität als Eisen; die Differenz von −852 kJ/mol wird
  vollständig als Wärme frei und verflüssigt das entstehende Eisen.

---

## 6. Sicherheitssystematik

Jede Reaktion trägt eine Einstufung in vier Stufen – **Schulversuch**,
**Laborpraktikum**, **Fortgeschritten**, **Nur Fachlabor** –, GHS-Piktogramme,
Gefahrenbeschreibungen im Klartext, Schutzmaßnahmen, Schutzausrüstung und
Entsorgungshinweise.

Drei Regeln durchziehen die Datenbank:

1. **Substitutionsprinzip.** Wo eine mildere Methode existiert, wird sie genannt:
   Dess-Martin-Periodinan oder TEMPO statt Chrom(VI), Toluol statt Benzol,
   2-MeTHF statt DMF.
2. **Der gefährliche Moment wird benannt.** Nicht «Vorsicht bei der Aufarbeitung»,
   sondern «Niemals mit Wasser aufarbeiten – heftige Hydrolyse» oder «Ozonide vor
   dem Einengen reduktiv zerstören».
3. **Strukturwarnungen.** Unabhängig von der Reaktion prüft die App die
   eingegebene Struktur auf Peroxid-, Azid-, Nitro- und Nitrilgruppen und weist
   auf die jeweilige Gefahr hin.

Für chemische Kampfstoffe, Explosivstoffe und Betäubungsmittel zeigt die App
keine Synthesevorschriften. Die Erkennung läuft sowohl über Strukturmuster
(mehrfach nitrierte Aromaten, Salpetersäureester, Nitramine, Lost-Derivate,
Phosphorsäureester-Kampfstoffe) als auch über Namensbestandteile.

---

## 7. Quellen

**Lehrbücher**
- Organikum – Organisch-chemisches Grundpraktikum, 24. Auflage, Wiley-VCH
- J. Clayden, N. Greeves, S. Warren, *Organic Chemistry*, Oxford University Press
- Hollemann, Wiberg, *Lehrbuch der Anorganischen Chemie*, de Gruyter
- *Ullmann's Encyclopedia of Industrial Chemistry*, Wiley-VCH
- T. W. Greene, P. G. M. Wuts, *Protective Groups in Organic Synthesis*, Wiley
- A. J. Fry, *Synthetic Organic Electrochemistry*, Wiley

**Elektrochemie**
- M. M. Baizer, *J. Electrochem. Soc.* **1964**, 111, 215 – Hydrodimerisierung
- T. Shono et al., *J. Am. Chem. Soc.* **1975**, 97, 4264 – anodische α-Oxidation
- E. Steckhan, *Angew. Chem.* **1986**, 98, 681 – Mediatoren
- [Electrochemical organic reactions: A tutorial review](https://www.frontiersin.org/journals/chemistry/articles/10.3389/fchem.2022.956502/full), *Front. Chem.* **2022**, 10, 956502
- [Named Reactions Powered by Electroorganic Syntheses](https://pmc.ncbi.nlm.nih.gov/articles/PMC13082866/)
- [The Future of Electro-organic Synthesis in Drug Discovery](https://pubs.acs.org/doi/10.1021/acsorginorgau.4c00068), *ACS Org. Inorg. Au*
- [Recent Developments in Shono-Type Oxidation](https://pubs.acs.org/aeclc7/article/2/1/14/5087301/Recent-Developments-in-Shono-Type-Oxidation), *ACS Electrochemistry*

**Werkzeuge und Daten**
- [PubChem](https://pubchem.ncbi.nlm.nih.gov/), National Library of Medicine –
  Stoffdaten über [PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) und
  [PUG View](https://pubchem.ncbi.nlm.nih.gov/docs/pug-view)
- [RDKit](https://www.rdkit.org/) – Cheminformatik-Bibliothek,
  [RDKit Book](https://www.rdkit.org/docs/RDKit_Book.html) zur SMARTS- und
  Reaktionssyntax

Die Originalarbeiten zu den einzelnen Namensreaktionen sind jeweils direkt bei
der Reaktion in der App angegeben.
