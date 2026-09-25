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

### Massentests

Unter `src/__tests__/massentests/` prüft je eine Datei ein Werkzeug an
mindestens 1000 Fällen. Die Fälle werden systematisch aus den Datentabellen
gebildet oder mit festem Startwert (`zufall(seed)` in `hilfen.ts`) erzeugt –
jeder Lauf ist reproduzierbar. Geprüft werden Invarianten, nicht Einzelwerte:

| Datei | Fälle | Prüft |
|---|---:|---|
| `gleichungsausgleich.test.ts` | 1933 | Verbrennung jeder C/H/O/N/S-Verbindung und alle anorganischen Paarreaktionen: Atom- und Ladungserhaltung, teilerfremde Koeffizienten, Reihenfolge egal |
| `redox.test.ts` | 2931 | Oxidationszahlen aller Stoffe und Ionen (Summe = Ladung), 48 Redoxpaare sauer/basisch, alle Kombinationen zur Gesamtgleichung |
| `formel.test.ts` | 1665 | Molmasse jedes Stoffes gegen RDKit, 1000 Zufallsformeln mit Klammern, Hydraten, Ladungen und Unicode-Ziffern |
| `stoechiometrie.test.ts` | 1001 | 1000 Zufallsansätze: Umrechnungen hin und zurück, Unterschussreagenz, Ausbeute, Atomökonomie, Verdünnung, Ansatzplanung |
| `elektrochemie.test.ts` | 4722 | 1000 Zufallsfälle für Nernst, Faraday und Wasserstoffelektrode, jedes Paar der Spannungsreihe als Zelle (ΔG, K, Vorzeichen) |
| `ionenmodell.test.ts` | 1153 | jedes Kation mit jedem Anion, auch als Hydrat: Formel, Zerlegung, Löslichkeit |
| `werkbank.test.ts` | 1002 | 1000 Zufallsmischungen unter Zufallsbedingungen: Sperren, gültige und zulässige Produkte, ausgeglichene Gleichungen, Reihenfolge egal |
| `komplexbildung.test.ts` | 17 883 | jede Metallquelle der Stoffdatenbank mit jeder Ligandenquelle: gültige Komplexe, ausgeglichene Gleichungen, keine Komplexe bei Redox- und Fällungspaaren, Herkunftsangabe |
| `komplexe.test.ts` | 5505 | jedes Zentralion mit jedem Liganden (1–6fach) und 1000 gemischte Komplexe: KZ, Ladung, Geometrie, Besetzung, Magnetismus, LFSE, Name |
| `katalog.test.ts` | 1502 | 1500 Katalogeinträge: Strukturen, Summenformeln, Gleichungen, Suche; anorganische Einträge findet auch die Werkbank |
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
nutzlos. Die 110 mitgelieferten Stoffe decken Unterricht und Grundpraktikum ab.

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

Greift eine Vorlage nur unter Bedingungen, die nicht eingestellt sind, erscheint
sie trotzdem, aber mit einer Liste dessen, was fehlt. Das ist Absicht: Ein
Lernender soll sehen, dass die Reaktion grundsätzlich möglich ist, und was ihr
noch fehlt.

**Mehrere mögliche Produkte.** Eine Vorschrift kann an mehreren Stellen eines
Moleküls greifen. `pickProductSet()` bevorzugt den Satz, dessen Produkte in der
Stoffdatenbank bekannt sind – das ist in aller Regel das gemeinte Produkt.
