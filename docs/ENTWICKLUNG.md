# Entwicklungshinweise

## Aufbau in drei Schichten

```
   Oberfläche        pages/ · components/        React, HashRouter
        ↓
   Fachlogik         chem/                       rein funktional, vollständig getestet
        ↓
   Daten             data/ · services/           Wissensdatenbank, PubChem
```

Der Kern in `src/chem/` kennt weder React noch das DOM. Jede Funktion bekommt
ihre RDKit-Instanz als Parameter übergeben, statt sie global zu holen – dadurch
laufen alle Tests in Node, ohne Browserumgebung.

## Die RDKit-Anbindung

RDKit wird als WebAssembly-Modul aus `public/rdkit/` geladen. Die Dateien werden
beim `npm run dev` und `npm run build` durch `scripts/copy-rdkit.mjs` aus
`node_modules` kopiert – so liegen sie im Bundle und funktionieren offline.

**Speicherverwaltung:** RDKit-Objekte sind C++-Objekte hinter einem
JavaScript-Handle. Ohne `delete()` läuft der WASM-Heap voll. Deshalb kapselt
`withMol()` jeden Zugriff:

```ts
withMol(rdkit, smiles, (mol) => mol.get_smiles());   // gibt automatisch frei
```

**Reaktionsdarstellung:** RDKits eingebaute Reaktionszeichnung wird bewusst
nicht verwendet – sie stellt Reaktionstemplates ohne Atommarkierung blass und
gestrichelt dar. Stattdessen zeichnet `ReactionEquation` die Einzelstrukturen und
verbindet sie mit «+» und «→».

## Eine Reaktion hinzufügen

Reaktionen liegen in `src/data/reactions/` nach Stoffklassen getrennt. Eine neue
Reaktion braucht diese Felder:

```ts
{
  id: 'eindeutige-kennung',
  name: 'Name der Reaktion',
  category: 'organisch',                    // organisch | anorganisch | elektrochemie | technisch | analytik
  reactionType: 'Nucleophile Substitution',
  summary: 'Zwei Sätze, die erklären, was passiert und wofür man es braucht.',

  // Reaktionsvorschrift zur Produktberechnung
  smirks: '[CX3:1](=[OX1:2])[OX2H1]>>[CX3:1](=[OX1:2])[Cl]',
  reactantDefaults: ['CC(=O)O'],            // Vorgabeedukte für alle Templates
  substrateSlots: [0],                      // wo der eingegebene Stoff stehen darf

  functionalGroups: ['carbonsaeure'],       // IDs aus functionalGroups.ts
  generalEquation: 'R–COOH + SOCl₂ → R–COCl + SO₂↑ + HCl↑',
  example: { substrate: '...', rxnSmiles: '...>>...', caption: '...' },

  reagents: [...], conditions: {...}, procedure: [...],
  mechanism: { type, summary, steps: [...], productEnergy: -85 },
  safety: { ghs, hazards, precautions, ppe, waste, level },
  electro: {...},                           // nur bei elektrochemischen Reaktionen
  scale: [...], keywords: [...], references: [...],
}
```

Danach in `src/data/reactions/index.ts` einhängen. Die Tests prüfen automatisch:

- sind die IDs eindeutig?
- verweisen alle `functionalGroups` auf existierende Einträge?
- lässt sich die Reaktionsvorschrift laden und liefert sie auf die
  Vorgabeedukte mindestens ein gültiges Produkt?
- greift sie auch auf das Beispielsubstrat?
- sind Anleitung, Mechanismus, Schutzausrüstung und Quellen gefüllt?
- ist eine `fixedEquation` stöchiometrisch ausgeglichen?

Zusätzlich hält `products.test.ts` für jede Vorschrift fest, welches Produkt sie
aus den Vorgabeedukten liefert. Beim Hinzufügen einer Reaktion dort eine Zeile
ergänzen – so fällt eine später eingeschleppte Änderung sofort auf.

```bash
npm test
```

### Hinweise zu Reaktions-SMARTS

- **Ladungen werden vererbt.** Wird ein Cyanid `[C-:2]` eingesetzt, trägt das
  Produkt die Ladung weiter – im Produkttemplate deshalb `[C+0:2]` schreiben.
- **Unmarkierte Atome verschwinden.** Was auf der Produktseite fehlt, wird
  abgespalten. Das austretende Wasser muss also nicht modelliert werden.
- **Wasserstoffe zählen.** `[CX4;H2]` trifft nur Kohlenstoffe mit genau zwei
  Wasserstoffatomen; Acetaldehyd hat am α-Kohlenstoff drei. Im Zweifel
  `[CX4;H1,H2,H3]` verwenden.
- **Rekursive Muster** wie `[CX3;!$(C(=O)[O,N,Cl])]` schließen unerwünschte
  Treffer aus – nützlich, um Carbonsäurederivate von Ketonen zu trennen.

Ein neues Muster lässt sich schnell prüfen:

```bash
node -e "require('@rdkit/rdkit')().then(R => {
  const rxn = R.get_rxn('DEINE>>VORSCHRIFT');
  const m = R.get_mol('CCO'); const l = new R.MolList(); l.append(m);
  const s = rxn.run_reactants(l, 5);
  for (let i = 0; i < s.size(); i++) {
    const set = s.get(i);
    for (let j = 0; j < set.size(); j++) console.log(set.at(j).get_smiles());
  }
})"
```

## Einen Stoff hinzufügen

`src/data/substances.ts` enthält eine Tabelle im Format

```
Name|Synonyme|Formel|SMILES|CAS|PubChem-CID|Kategorie|Beschreibung
```

Die molare Masse wird beim Laden aus der Formel berechnet. Die Tests prüfen, ob
jede Formel lesbar ist und jedes SMILES von RDKit akzeptiert wird.

Neben den von Hand gepflegten Tabellen (`CURATED_SUBSTANCES`) gibt es
`src/data/substanceTables/generated.ts`. Diese Tabelle erzeugt
`npm run stoffe` (`scripts/build-substances.ts`): alle Elemente mit
Ordnungszahl 1 bis 92 (außer Astat und Francium), Salze, Hydroxide, Oxide und
Säuren aus den Ionen von `src/chem/ions.ts` – nur Kombinationen, die es als Stoff
gibt, ohne Cyanide und explosive Salze –, weitere anorganische Stoffe, homologe
Reihen, ortho-/meta-/para-substituierte Benzole, Aminosäuren und Heterocyclen.
Formeln organischer Stoffe berechnet RDKit, Stoffe der Grundtabellen und von
der Sicherheitsprüfung gesperrte Stoffe werden übersprungen. Erzeugte Stoffe
tragen `origin: 'generiert'`; der Synthesekatalog nutzt nur die Grundtabellen.

Stoffe außerhalb der Offline-Datenbank holt die Werkbank über
`src/chem/externalSubstances.ts` aus PubChem oder aus einem eingegebenen SMILES.
Ist der Stoff schon offline vorhanden (gleiche CID, gleiche Struktur oder bei
anorganischen Stoffen gleiche Formel), wird dieser Eintrag genommen; Salze
bekommen über das Ionenmodell die übliche Formel (PubChem: `CuO4S`, App:
`CuSO4`) und werden wie die Salze der Datenbank ohne SMILES geführt.

## Datenbank belegter Reaktionen

`npm run reaktionen` erzeugt `public/reaktionen/` neu. Das Skript lädt einmalig
den USPTO-MIT-Datensatz (rund 480 000 atomzugeordnete Reaktionen aus
US-Patenten) von GitHub nach `.cache/uspto` und

1. entfernt die Atomnummern und kanonisiert jede Struktur mit RDKit, ohne
   Stereochemie (`structureKey` in `src/chem/reactionKeys.ts` – dieselbe
   Funktion nutzt die App),
2. trennt Edukte (liefern Atome ins Hauptprodukt) von Hilfsstoffen,
3. verwirft unplausible Zuordnungen: Ein Edukt mit mehr als drei Atomen muss
   mindestens 35 % seiner Atome ins Produkt geben – außer es überträgt nur
   Halogen-, Sauerstoff- oder Schwefelatome (Thionylchlorid, NBS, Persäuren),
4. fasst Doppelte zusammen (die Zahl der Fundstellen bleibt erhalten),
5. wählt 100 000 Reaktionen aus – zuerst solche, deren Edukte alle in der
   Stoffdatenbank stehen, dann solche mit mindestens einem bekannten Stoff,
6. prüft jede Struktur mit `assessSubstance` und verwirft Reaktionen mit
   gesperrten Stoffen,
7. schreibt je Edukt und je Produkt 256 gzip-Teildateien (`e-xx`, `p-xx`).

Die App lädt nur die Teile, die sie für die Stoffe im Gefäß braucht, und
entpackt sie mit `DecompressionStream`. Salze und Säuren ohne SMILES bekommen
ihre Struktur aus `src/chem/substanceStructures.ts`.

In der Werkbank trägt jede Reaktion ein Feld `evidence`: `belegt`
(Datenbanktreffer, alle Edukte im Gefäß; bei nur einem Edukt muss zusätzlich
ein Reagenz aus der Vorschrift da sein), `lehrbuch` (fest hinterlegte
Standardreaktion) oder `vorhersage` (Regel oder Vorlage). Bestätigt ein
Datenbanktreffer eine Vorlage, wird diese als belegt markiert.

## Komplexbildung in der Werkbank

`src/chem/complexFormation.ts` entscheidet für jedes Paar aus Metallquelle und
Ligandenquelle, ob ein Komplex entsteht:

1. Tabellierte Ausschlüsse (Redox, Fällung) haben Vorrang.
2. Bekannte Komplexe stehen in `RECIPES` und gelten als Lehrbuchreaktion.
3. Basische Liganden (Ammoniak, Amine) konkurrieren mit der Hydroxidfällung:
   Löslichkeit aus lg β und pKL, bei gepufferter Ammoniaklösung mit pOH ≈ 2,5.
4. Niederschläge lösen sich, wenn die geschätzte Löslichkeit im
   Ligandenüberschuss (2 mol/L) 10⁻² mol/L erreicht; ab 10⁻⁴ teilweise.
5. Sonst entscheidet das HSAB-Prinzip (`affinity`): harte/mittlere/weiche
   Zentralionen gegen O-, N-, Halogen- und weiche Donoren, Chelate +1.
   Solche Ergebnisse sind Vorhersagen.

Stoffklassen werden über SMARTS erkannt (`GENERIC_PATTERNS`) und bekommen
einen dynamischen Liganden mit den Daten eines Stellvertreters (Amin wie NH₃,
Aminosäure wie Glycin …).

## Tests

| Datei | Prüft |
|---|---|
| `formula.test.ts` | Formelparser: Klammern, Hydrate, Ladungen, Unicode |
| `balance.test.ts` | Gleichungsausgleich inklusive Ionengleichungen |
| `redox.test.ts` | Oxidationszahlen, Halbreaktionen, Kombination |
| `electro.test.ts` | Nernst, Zellspannung, Faraday, Energiebedarf |
| `stoichiometry.test.ts` | Mengenumrechnung, Unterschuss, Ausbeute, Verdünnung |
| `reactions.test.ts` | Vollständigkeit und Korrektheit der Reaktionsdatenbank |
| `reactionEngine.test.ts` | Gruppenerkennung, Produktberechnung, Suche, Sicherheitsgate |
| `products.test.ts` | Regressionstest: welches Produkt jede Vorschrift liefert |
| `ions.test.ts` | Ionenmodell, Löslichkeitsregeln, Spannungsreihe |
| `inorganicRules.test.ts` | Anorganische Regeln an bekannten Schulversuchen |
| `workbench.test.ts` | Werkbank: Mischungen mit feststehendem Ergebnis |
| `substances.test.ts` | Formel und Struktur jedes Stoffes stimmen überein |
| `catalog.test.ts` | Vollständigkeit und Suche im Synthesekatalog |
| `pubchem.test.ts` | PubChem-Client mit simulierten Antworten |
| `complexes.test.ts` | Komplexe: Namen, Geometrie, Spin, Isomere, Stabilität |
| `complexFormation.test.ts` | Komplexbildung in der Werkbank: Nachweiskomplexe, Löslichkeit, Hydroxidfällung, Redox-Ausschlüsse |
| `documentedReactions.test.ts` | Datenbank belegter Reaktionen, Plausibilitätsfilter, Kennzeichnung in der Werkbank |
| `reactionAI.test.ts` | Reaktions-KI: Vorlagen herausschneiden und anwenden, Hilfsstoffe, Netz speichern und laden, Arrhenius, Katalyse-Wissensbasis |
| `conditions.test.ts` | Aggregatzustände, Siedepunkt und Druck, Temperatur- und Druckbedingungen, Vorhersagen für Stoffpaare |
| `externalSubstances.test.ts` | Stoffe aus PubChem und SMILES: Abgleich mit der Datenbank, Formeln, Sperren |

### Massentests

Unter `src/__tests__/massentests/` prüft je eine Datei ein Werkzeug an
mindestens 1000 Fällen. Die Fälle werden systematisch aus den Datentabellen
gebildet oder mit festem Startwert (`zufall(seed)` in `hilfen.ts`) erzeugt –
jeder Lauf ist reproduzierbar. Geprüft werden Invarianten, nicht Einzelwerte:

| Datei | Fälle | Prüft |
|---|---:|---|
| `gleichungsausgleich.test.ts` | 11 900 | Verbrennung jeder C/H/O/N/S-Verbindung und alle anorganischen Paarreaktionen: Atom- und Ladungserhaltung, teilerfremde Koeffizienten, Reihenfolge egal |
| `redox.test.ts` | 3587 | Oxidationszahlen aller Stoffe und Ionen (Summe = Ladung), 48 Redoxpaare sauer/basisch, alle Kombinationen zur Gesamtgleichung |
| `formel.test.ts` | 2545 | Molmasse jedes Stoffes gegen RDKit, 1000 Zufallsformeln mit Klammern, Hydraten, Ladungen und Unicode-Ziffern |
| `stoechiometrie.test.ts` | 1001 | 1000 Zufallsansätze: Umrechnungen hin und zurück, Unterschussreagenz, Ausbeute, Atomökonomie, Verdünnung, Ansatzplanung |
| `elektrochemie.test.ts` | 4722 | 1000 Zufallsfälle für Nernst, Faraday und Wasserstoffelektrode, jedes Paar der Spannungsreihe als Zelle (ΔG, K, Vorzeichen) |
| `ionenmodell.test.ts` | 1153 | jedes Kation mit jedem Anion, auch als Hydrat: Formel, Zerlegung, Löslichkeit |
| `werkbank.test.ts` | 1502 | 1500 Zufallsmischungen unter Zufallsbedingungen, die Hälfte mit Temperatur- und Druckregler: Sperren, gültige und zulässige Produkte, ausgeglichene Gleichungen, für jedes Stoffpaar eine Aussage, Reihenfolge egal |
| `komplexbildung.test.ts` | 105 240 | jede Metallquelle der Stoffdatenbank mit jeder Ligandenquelle: gültige Komplexe, ausgeglichene Gleichungen, keine Komplexe bei Redox- und Fällungspaaren, Herkunftsangabe |
| `komplexe.test.ts` | 5505 | jedes Zentralion mit jedem Liganden (1–6fach) und 1000 gemischte Komplexe: KZ, Ladung, Geometrie, Besetzung, Magnetismus, LFSE, Name |
| `katalog.test.ts` | 1502 | 1500 Katalogeinträge: Strukturen, Summenformeln, Gleichungen, Suche; anorganische Einträge findet auch die Werkbank |
| `ki-synthese.test.ts` | 1001 | 1000 Zielstoffe (alle 928 organischen Stoffe der Datenbank und 72 Katalogprodukte) rückwärts geplant: jeder Weg vorwärts bestätigt, Ausgangsstoffe neutral, zulässig und nicht der Zielstoff; gesperrte Stoffe ohne Synthese; im Reaktor machen Wärme, Katalysator und Druck eine Stufe nie langsamer, und bei der Empfehlung läuft sie |
| `werkbank-ki.test.ts` | 1001 | 1000 Zufallsmischungen aus zwei oder drei Stoffen mit der Reaktions-KI bei Zufallstemperatur, -druck und -katalyse: keine doppelten Reaktionen, vollständige zuerst, KI-Produkte zulässig, Beteiligte aus dem Gefäß, was nicht läuft nennt, was fehlt, mehr Wärme macht keine KI-Reaktion langsamer |
| `ki.test.ts` | 1005 | 1000 zufällige Stoffpaare durch die Reaktions-KI: gültige und zulässige Produkte, stimmige Energieangaben, Reihenfolge egal; dazu Amidkupplung, Suzuki-Kupplung, Nitroreduktion und Katalysator im Gefäß |
| `stoffanalyse.test.ts` | 1097 | 1000 Moleküle durch die Stoffanalyse: gültige und zulässige Produkte, Sortierung; jede Reaktion über ihren Namen auffindbar |

`npm run test:massen` führt nur diese Tests aus.

Dazu der Rauchtest `scripts/smoke-test.mjs`, der die gebaute App im Browser
durchklickt und Bildschirmfotos ablegt.

## Bauen und veröffentlichen

```bash
npm run build          # Weboberfläche nach dist/
npm run tauri:build    # Windows-Installer (.msi und .exe)
npm run icons          # Icons neu erzeugen (PNG, ICO, SVG)
```

Die Icons werden von `scripts/generate-icons.mjs` ohne Bildbibliothek erzeugt:
Die Grafik wird vierfach überabgetastet gerastert und als PNG mit eigenem
Encoder geschrieben; das Windows-ICO bündelt vier Auflösungen.

**GitHub Actions:**

- `build.yml` – Typprüfung, Tests, Webbuild, Browser-Rauchtest, danach der
  Windows-Installer. Ein Tag `v*` legt zusätzlich eine Veröffentlichung an.
- `pages.yml` – veröffentlicht die Weboberfläche auf GitHub Pages.

## Entscheidungen und ihre Gründe

**HashRouter statt BrowserRouter.** Die App läuft ohne Server – im
Tauri-Fenster von der Festplatte und auf GitHub Pages unter einem Unterpfad. Nur
Hash-Routen funktionieren in beiden Fällen ohne Serverkonfiguration.

**Relativer Basispfad (`base: './'`).** Aus demselben Grund.

**Eigene Offline-Stoffdatenbank neben PubChem.** Ohne Netz wäre die App sonst
nutzlos. Die 1544 mitgelieferten Stoffe decken Unterricht und Praktikum ab.

**Reaktionsvorschriften statt fest hinterlegter Produkte.** Nur so lässt sich
eine Reaktion auf *das eingegebene* Molekül anwenden statt auf ein
Lehrbuchbeispiel.

**Exakte Bruchrechnung im Gleichungsausgleicher.** Gleitkommazahlen führen bei
größeren Systemen zu Koeffizienten wie 2,0000000001.

## Der Synthesekatalog

`scripts/build-catalog.ts` erzeugt `src/data/generated/catalog.json`. Der Ablauf:

1. **Organisch:** Jede Vorlage mit Reaktions-SMARTS wird auf jeden Stoff mit
   Struktur angewendet. Greift sie, wird das Produkt berechnet, kanonisiert und
   – wenn es in der Stoffdatenbank steht – benannt.
2. **Anorganisch:** Alle Paare aus Salzen, Säuren, Basen, Metallen und Oxiden
   laufen durch die Regeln in `inorganicRules.ts`. Jede Gleichung wird exakt
   ausgeglichen.
3. **Technische Verfahren:** Reaktionen mit fester Gleichung kommen unverändert
   dazu.

Die Datei ist normalisiert: Wiederkehrende Angaben stehen einmal in einer
Vorlagentabelle, die Einträge verweisen nur darauf. Das drückt die Größe von
3,4 MB auf 618 kB (88 kB gepackt). Geladen wird sie erst, wenn eine Seite sie
braucht – über einen dynamischen Import, den Vite als eigenes Bündel ablegt.

```bash
npm run catalog    # neu berechnen, rund 13 s
```

Der Katalog ist eingecheckt, damit die App auch ohne diesen Schritt läuft. Nach
Änderungen an Reaktionsvorlagen oder Stoffdaten muss er neu erzeugt werden – der
Build tut das automatisch.

## Reaktions-KI

Die KI sagt vorher, welches Produkt aus zwei Stoffen entsteht und welcher
Katalysator dafür nötig ist. Sie besteht aus drei Teilen:

1. **Reaktionsvorlagen** (`src/chem/ai/templates.ts`). Zu jeder Reaktion
   gehören Atomzuordnung und geänderte Bindungen – aus USPTO-MIT und EnzymeMap
   direkt, für die übrigen Quellen berechnet mit RXNMapper.
   Daraus wird wie bei rdchiral (Coley et al.) das Reaktionszentrum mit seinen
   direkten Nachbarn als Reaktions-SMARTS herausgeschnitten und kanonisch
   geschrieben. Jede Vorlage wird sofort geprüft: Angewendet auf die Edukte
   muss sie genau das Patentprodukt liefern. `src/chem/ai/mappedSmiles.ts`
   liest die SMILES mit Zuordnungsnummern, weil RDKit sie im Browser nicht
   herausgibt.
2. **Neuronales Netz** (`src/chem/ai/network.ts`). Eingabe ist der
   Morgan-Fingerabdruck der Edukte (Radius 2, 2048 Bit, `features.ts`), dann
   eine verdeckte Schicht mit 256 ReLU-Neuronen und zwei Ausgänge: Softmax über
   alle Vorlagen und Sigmoid je Hilfsstoff-Kategorie (`agents.ts`: Palladium,
   Säure, Kupplungsreagenz, Hydrid …). Gespeichert wird mit 8-Bit-Gewichten.
3. **Aktivierungsenergie** (`families.ts`, `activation.ts`). Jede Vorlage wird
   anhand ihrer Bindungsänderungen einer Reaktionsfamilie zugeordnet, die
   Richtwerte für die Barriere mit und ohne Katalysator trägt. Die Werte sind
   so abgeglichen, dass die Abschätzung die üblichen Laborbedingungen trifft
   (Suzuki-Kupplung einige Stunden bei 80 °C, Boc-Abspaltung mit TFA bei
   Raumtemperatur); stark aktivierte Aromaten bekommen eine niedrigere
   Barriere. Nach Änderungen an Familien oder Hilfsstoffnamen genügt
   `vite-node scripts/ki/families.ts` – ohne neues Training. Über Arrhenius
   (Stoßfaktor 10¹¹ L/(mol·s) bimolekular, 10¹³ s⁻¹ monomolekular) folgt die
   Halbwertszeit bei der eingestellten Temperatur. Als «machbar» gilt eine
   Halbwertszeit bis eine Stunde.

`src/chem/ai/reactionAI.ts` verbindet alles: Für ein Stoffpaar werden drei
Annahmen geprüft (beide Stoffe sind Edukte; Stoff A ist Edukt und B Reagenz;
umgekehrt). Die 50 wahrscheinlichsten passenden Vorlagen je Annahme werden mit
RDKit angewendet, gleiche Produkte zusammengezählt, gesperrte Produkte
verworfen. Ist der zweite Stoff ein Reagenz, zählt, wie gut seine Kategorie zu
den Hilfsstoffen der Vorlage passt.

Anorganische und technische Katalyse (Haber-Bosch, Kontaktverfahren,
H2O2-Zerfall, Abgaskatalysator …) kommt in den Patenten der organischen
Synthese nicht vor. Dafür gibt es `src/data/catalysis.ts` mit Lehrbuchwerten
(Tabellenwert oder Größenordnung; wo kein Einzelwert sinnvoll ist, die
Starttemperatur).

**KI-Synthese (Rückwärtsplanung).** `src/chem/ai/retrosynthesis.ts` dreht die
gelernten Vorlagen um (Produktseite → Eduktseite) und wendet alle 5.953 auf den
Zielstoff an; die RDKit-Reaktionsobjekte werden beim ersten Aufruf einmal gebaut
(knapp 1 s) und je Modell zwischengespeichert. Ausgangsstoffe mit «nackten»
Abgangsgruppen (B, Si, Sn, Mg, Zn mit Wasserstoff – die Vorlagen kennen nur den
Rumpf der Gruppe), geladene Teilchen und gesperrte Stoffe fallen weg, es sei
denn, der Stoff steht in der Datenbank. Die übrigen Zerlegungen bewertet das
Vorwärtsnetz (Summe der Wahrscheinlichkeiten der passenden Vorlagen für genau
diese Ausgangsstoffe). Für die besten wird die Vorlage vorwärts angewendet und
dann `predictWithModel` aufgerufen; nur wenn die KI vorwärts wieder den
Zielstoff vorhersagt («Rundlauf»), wird die Stufe gezeigt – mit Katalysator,
Aktivierungsenergie und Reaktionsenthalpie aus dieser Vorhersage.
`extendRoutes` plant für Ausgangsstoffe außerhalb der Stoffdatenbank eine
Vorstufe; spätere Produkte dürfen dabei nicht als Ausgangsstoff auftauchen.
Rangfolge: Sicherheit × (vorrätig ? 1 : 0,5) × 0,8 je weitere Stufe.

Die Werkbank hat dafür den Modus «KI-Synthese» (`?modus=synthese`, ein
`?ziel=<Stoff>` öffnet ihn direkt). `SynthesisPlanner.tsx` zeigt zuerst die
einstufigen Wege (≈ 1 s) und ergänzt die zweite Stufe danach; der Bereich
bleibt beim Umschalten zum Mischen erhalten. Temperatur- und Druckregler sind
dieselben Komponenten wie beim Mischen (`ReactorControls.tsx`) und teilen sich
den Zustand mit dem Reaktionsgefäß. `src/chem/ai/synthesisConditions.ts`
bewertet jede Stufe für Temperatur, Druck und gewählten Hilfsstoff:
Aktivierungsenergie der Reaktionsfamilie (gesenkt, wenn der Hilfsstoff zu den
Katalysatoren der Familie gehört oder die KI ihn mit ≥ 40 % vorschlägt),
Halbwertszeit nach Arrhenius, bei gasförmigen Partnern (auch Wasserstoff bei
Pd/Pt/Ni) geteilt durch den Druck in bar (Henry), Siedepunkte nach
Clausius-Clapeyron mit dem nötigen Gegendruck (`vaporPressureAt` in
`phase.ts`), Zersetzung und Pyrolyse, Le-Chatelier-Hinweise aus ΔrH° und
Gasbilanz. Die Empfehlung ist die Temperatur, bei der die Stufe mit dem
empfohlenen Hilfsstoff binnen einer Stunde umsetzt (höchstens 300 °C), und der
Druck, bei dem gasförmige Partner genug gelöst sind (5 bar) bzw. flüssige nicht
sieden. «Stufe ansetzen» überträgt Ausgangsstoffe, Hilfsstoff (bei Hydrierung
mit Wasserstoff), Katalyse, Temperatur und Druck ins Gefäß.

**Werkbank mit dem neuronalen Netz.** `mix()` in `src/chem/workbench.ts` nimmt
das geladene Modell als fünften Parameter. Nach Regeln, Sonderreaktionen,
organischen Vorlagen und Patentbelegen ruft `aiReactions()`
(`src/chem/ai/workbenchAI.ts`) für jedes Stoffpaar mit mindestens einem
organischen Stoff (bzw. den einzelnen Stoff) `predictWithModel` auf – mit
Temperatur, Katalyse und den übrigen Stoffen im Gefäß. Jeder Vorschlag wird mit
`evaluateProposal` aus `synthesisConditions.ts` im Reaktor bewertet (Katalysator:
der passende Hilfsstoff, der im Gefäß ist oder über die Katalyse eingestellt
wurde; Druck vom Regler) und als `WorkbenchReaction` mit `evidence: 'ki'`,
`ai` (Vorschlag) und `reactor` (Bewertung) angelegt. `missing` kommt aus dem
Urteil: blockiert → Katalysator, langsam → Temperatur, Problem → Zersetzung;
ein einzelner Stoff ohne Partner braucht das Reagenz der Vorlage. Aufgenommen
wird der beste Vorschlag je Paar ab 4 % Sicherheit, weitere ab 25 %, und hat
das Paar schon eine vollständige Reaktion, nur Alternativen ab 40 %. Liefert
eine bekannte Reaktion dasselbe Produkt, bekommt sie nur `ai` («KI bestätigt»);
eine eigene KI-Reaktion gibt es dann nur, wenn der Weg der KI jetzt läuft und
der bekannte nicht – etwa Hydrierung mit Pd statt kathodischer Reduktion oder
Acetylierung von Anilin ohne zusätzliche Base. Bei Palladiumkupplungen
(Suzuki, Heck, Buchwald) senkt nur ein Metall die Barriere, eine Base allein
nicht. Rangfolge der Herkunft: belegt, Lehrbuch, KI, Vorhersage.
Ohne Modell (Tests, Laden fehlgeschlagen) rechnet die Werkbank wie zuvor.

**Trainingsdaten aus mehreren Quellen.** Seit dem Training vom September 2026
lernt die KI aus 1.030.272 verschiedenen, geprüften Reaktionen aus zehn
Datensätzen (US-Patente, Enzym- und Stoffwechseldatenbanken,
Hochdurchsatz-Experimente; Einzelheiten und Ergebnisse im
[Trainingsbericht](KI-TRAININGSBERICHT.md)). Die Kette:

1. `scripts/ki/quellen/download.sh` lädt die Quellen nach `.cache/quellen` und
   legt eine Python-Umgebung mit RDKit und RXNMapper an (`.cache/mapper-env`).
2. `prepare.py` liest alle Quellen, vereinheitlicht sie und entfernt Dubletten
   (gleiche Stoffe links, gleiches Hauptprodukt). Bei Enzymreaktionen ist das
   Hauptprodukt das größte Molekül, das kein Cofaktor ist (NAD(P)H, ATP, CoA,
   FAD … erkennt es am Adenin- bzw. Flavingerüst).
3. `map.py <Teil> <Teile>` ordnet Reaktionen ohne Atomzuordnung mit RXNMapper
   zu (Konfidenz ≥ 0,1) und bestimmt die geänderten Bindungen im Format von
   USPTO-MIT. Läuft in vier Prozessen etwa 2–3 Stunden und setzt nach einem
   Abbruch fort.
4. `npm run ki`: `extract.ts` schneidet und prüft die Vorlagen (Enzyme werden
   als Hilfsstoff `EC:x.y.z` mitgeführt, Kategorie «Enzym»), `train.ts`
   entfernt Dubletten über alle Quellen, teilt Training/Validierung/Test (der
   USPTO-MIT-Testsatz bleibt unverändert, andere Quellen per Hash: Patente
   1 %/1 %, kleinere Quellen 5 %/10 %), trainiert und bewertet je Quelle.
   `bericht.json` und `testfaelle.jsonl` landen in `.cache/ki`.
5. `vite-node scripts/ki/evaluate.ts vorher=<Ordner> nachher=public/ki`
   vergleicht zwei Modelle auf denselben Testreaktionen,
   `vite-node scripts/ki/bericht.ts` schreibt daraus die Tabellen.

Ohne `.cache/quellen/zugeordnet-*.tsv` trainiert `npm run ki` wie früher nur
mit USPTO-MIT. Stellschrauben über Umgebungsvariablen: `KI_MIN` (Mindestzahl
Fundstellen je Vorlage, zuletzt 15), `KI_MIN_KLEIN` (für Vorlagen aus
Nicht-Patent-Quellen, 8), `KI_HIDDEN`, `KI_EPOCHS` (zuletzt 5),
`KI_TEST_JE_QUELLE`.

## Die Werkbank

`src/chem/workbench.ts` beantwortet die Frage «Was passiert, wenn ich diese
Stoffe zusammengebe?» in vier Schritten:

1. **Gefahrencheck.** Für Kombinationen aus `NEVER_MIX` wird gar nichts
   simuliert, sondern nur der Gefahrenhinweis gezeigt.
2. **Anorganische Regeln** über alle Stoffpaare.
3. **Organische Vorlagen.** Anders als auf der Stoffseite werden die
   *tatsächlich eingesetzten* Stoffe verwendet. Ein zweiter Stoff kann dabei
   zweierlei sein: das zweite Edukt (Säure und Alkohol bei der Veresterung) oder
   das nötige Reagenz (Alkohol und Permanganat bei der Oxidation). Reagenzien
   erkennt `providesReagent()` durch Namensvergleich mit den Reagenzangaben der
   Vorlage.
4. **Erklärung**, wenn nichts passiert – abgeleitet aus den Stoffkategorien und
   der Spannungsreihe.
5. **Vorhersage für jedes Stoffpaar** (`src/chem/prediction.ts`). Hat ein Paar
   keine vollständige Reaktion, wird eine Vorhersage erstellt: Redox über
   Standardpotentiale (ΔE > 0,15 V), Protonenübertragung über pKs-Werte, unedle
   Metalle mit protischen Stoffen, starke Oxidationsmittel mit organischen
   Stoffen, sonst physikalisches Verhalten (Löslichkeitsregeln, log P,
   Aggregatzustände). Chemische Vorhersagen landen bei den Reaktionen,
   physikalische in `pairOutcomes`. Jede trägt `evidence: 'vorhersage'` und eine
   `confidence` (hoch, mittel, gering). Das Ergebnis hängt nicht von der
   Reihenfolge der Stoffe ab.

**Temperatur und Druck.** `temperatureC` und `pressureBar` in den Bedingungen
kommen von den Reglern. Anforderungen können `minTemperature`,
`maxTemperature` und `minPressure` nennen (Kalkbrennen ab 825 °C, Haber-Bosch
ab 150 bar). `src/chem/phase.ts` bestimmt Aggregatzustände aus
`src/data/physicalData.ts` oder schätzt sie nach Joback; Siedepunkte folgen dem
Druck nach Clausius-Clapeyron. `src/chem/conditionEffects.ts` ergänzt Hinweise
zu Verdampfen, RGT-Regel und Le Chatelier.

Greift eine Vorlage nur unter Bedingungen, die nicht eingestellt sind, erscheint
sie trotzdem, aber mit einer Liste dessen, was fehlt. Das ist Absicht: Ein
Lernender soll sehen, dass die Reaktion grundsätzlich möglich ist, und was ihr
noch fehlt.

**Reaktionsenthalpie.** Am Ende von `mix()` bekommt jede gezeigte Reaktion
und jedes Lösen eines Salzes in Wasser ein `enthalpy`-Feld
(`src/chem/reactionEnthalpy.ts`). Reihenfolge: erst die Gleichung als
Summenformeln (`enthalpyOfEquation`, in Wasser mit Ionen), dann die
Ionengleichung, zuletzt die Strukturen der Beteiligten und Produkte
(`enthalpyFromStructures`). Stoffe im Gefäß dienen als Hinweise, damit eine
Summenformel wie C₂H₆O als Ethanol und nicht als Dimethylether gelesen wird.
Scheitert die Rechnung an einem fehlenden Wert, steht in `enthalpyMissing`,
welcher Stoff fehlt – die Oberfläche zeigt das an.

Neue Werte gehören in `src/data/thermoData.ts`: eine Zeile «Formel Zustand
Wert» (anorganisch, Ionen mit `^`, etwa `SO4^2- aq -909.3`) oder «SMILES Zustand
Wert» (organisch). Der erste Eintrag einer Formel ist ihr Standardzustand.
Bitte nur belegte Tabellenwerte eintragen und die Quelle im Kommentar nennen,
wenn sie von NBS/CRC abweicht. `src/chem/__tests__/thermo.test.ts` prüft
Referenzreaktionen; der Werkbank-Massentest prüft, dass jede berechnete
Gleichung ausgeglichen ist und ΔrH° zu den Termen passt.

**Mehrere mögliche Produkte.** Eine Vorschrift kann an mehreren Stellen eines
Moleküls greifen. `pickProductSet()` bevorzugt den Satz, dessen Produkte in der
Stoffdatenbank bekannt sind – das ist in aller Regel das gemeinte Produkt.
