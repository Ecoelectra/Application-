# Syntheseplaner

Eine App für **Windows** und **iPad**, die aus einem eingegebenen Stoff passende
chemische Synthesen und Reaktionen vorschlägt – mit Reaktionsgleichung,
Reaktionsmechanismus, vollständiger Arbeitsanleitung, Sicherheitshinweisen und
elektrochemischen Kennzahlen.

![Stoffanalyse](docs/bilder/stoffanalyse.png)

## Was die App kann

**Stoff eingeben → Reaktionen erhalten.** Name, Summenformel, CAS-Nummer oder
SMILES eingeben. Die App erkennt die funktionellen Gruppen im Molekül und
schlägt dazu passende Reaktionen vor, sortiert nach Passgenauigkeit.

**Produkte werden wirklich berechnet.** Zu jeder Reaktion ist eine
Reaktionsvorschrift als Reaktions-SMARTS hinterlegt. Die App wendet sie mit
RDKit auf die eingegebene Struktur an und zeichnet das Produkt – sie zeigt also
nicht nur ein Lehrbuchbeispiel, sondern *dein* Molekül.

**Anschauliche Anleitungen.** Antippen einer Reaktion öffnet die Detailansicht:

- **Übersicht** – Gleichung als Strukturformel, Reagenzien mit Äquivalenten,
  Bedingungen von der Temperatur bis zur Aufarbeitung, Quellenangaben
- **Anleitung** – nummerierte Arbeitsschritte mit Warnungen und Praxistipps,
  dazu ein Ansatzrechner, der aus der Einwaage alle Reagenzienmengen ableitet
- **Mechanismus** – Teilschritte einzeln gezeichnet, mit beschriebenem
  Elektronenfluss, Zwischenstufen und schematischem Energieprofil
- **Sicherheit** – GHS-Piktogramme, H-Sätze, Schutzausrüstung, Entsorgung
- **Elektrolyse** – bei elektrochemischen Reaktionen: Elektrodenmaterial,
  Stromdichte, Ladungsbedarf in F/mol, Stromausbeute und ein Faraday-Rechner

**Reaktionen suchen.** Volltextsuche über alle Reaktionen mit Filtern nach
Kategorie, funktioneller Gruppe und Einsatzbereich.

**Elektrochemie.** Spannungsreihe mit 65 Halbzellen, Nernst-Rechner,
Zellspannung mit ΔG und Gleichgewichtskonstante, Faradaysche Gesetze und
spezifischer Energiebedarf.

**Werkzeuge.** Reaktionsgleichungen ausgleichen (auch Ionengleichungen mit
Ladungsbilanz), Redoxgleichungen nach der Halbreaktionsmethode in saurem und
basischem Milieu, Oxidationszahlen, Molmassen, Elementaranalyse,
Unterschussreagenz, Ausbeute, Verdünnungen und Maßlösungen.

## Datenbestand

| | |
|---|---|
| Reaktionen mit Mechanismus | 62 |
| davon elektrochemisch | 18 |
| Stoffe offline verfügbar | 110 |
| Standardpotentiale | 65 |
| erkannte funktionelle Gruppen | 34 |
| Elemente mit Atommassen | 118 |

Darüber hinaus sind alle Stoffe aus **PubChem** abrufbar, sobald eine
Internetverbindung besteht.

## Installation

### iPad

1. Die Adresse der App in **Safari** öffnen (nur Safari kann installieren).
2. Auf das **Teilen-Symbol** tippen (Quadrat mit Pfeil nach oben).
3. **«Zum Home-Bildschirm»** wählen.

Die App startet danach im Vollbild und funktioniert offline – inklusive
Strukturberechnung, Reaktionsdatenbank und aller Rechner. Nur die PubChem-Suche
braucht Netz.

### Windows

**Variante 1 – als App aus dem Browser:** Seite in Edge oder Chrome öffnen,
Menü → «Apps» → «Diese Website als App installieren».

**Variante 2 – als Installer:** Der GitHub-Actions-Workflow `build.yml` erzeugt
bei jedem Push eine `.msi` und eine `.exe` als Artefakt; ein Versionstag
(`v1.0.0`) legt zusätzlich eine Veröffentlichung an. Lokal:

```bash
npm install
npm run tauri:build      # Ergebnis in src-tauri/target/release/bundle/
```

Dafür werden [Rust](https://rustup.rs/) und die
[Tauri-Voraussetzungen](https://tauri.app/start/prerequisites/) benötigt.

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # 131 Tests (Chemiekern, Reaktionsdatenbank, Rechner)
npm run lint       # Typprüfung
npm run build      # Produktionsbuild nach dist/
```

Rauchtest der gebauten App im Browser:

```bash
npm run build
npx vite preview --port 4173 &
node scripts/smoke-test.mjs
```

## Aufbau

```
src/
  chem/           Fachlicher Kern – ohne Oberflächenbezug, vollständig getestet
    elements.ts       118 Elemente mit Atommassen
    formula.ts        Summenformel-Parser (Klammern, Hydrate, Ladungen)
    balance.ts        Gleichungsausgleich über den Nullraum der Elementmatrix
    fraction.ts       Exakte Bruchrechnung auf BigInt-Basis
    redox.ts          Oxidationszahlen und Halbreaktionsmethode
    electro.ts        Nernst, Zellspannung, Faradaysche Gesetze
    stoichiometry.ts  Ansatzplanung, Unterschuss, Ausbeute, Verdünnung
    rdkit.ts          Anbindung der RDKit-WebAssembly-Bibliothek
    reactionEngine.ts Gruppenerkennung, Produktberechnung, Vorschläge
    safety.ts         Prüfung auf reglementierte Stoffgruppen
  data/           Wissensdatenbank
    reactions/        Reaktionen nach Stoffklassen getrennt
    functionalGroups.ts  SMARTS-Muster der funktionellen Gruppen
    substances.ts     Offline-Stoffdatenbank
    potentials.ts     Elektrochemische Spannungsreihe
  services/       PubChem-Anbindung mit Ratenbegrenzung und Cache
  components/     Wiederverwendbare Bausteine der Oberfläche
  pages/          Die sieben Seiten der App
src-tauri/        Windows-Anwendung (Tauri v2)
docs/             Fachliche Grundlagen und Entwicklungshinweise
```

Mehr dazu: [Fachliche Grundlagen](docs/CHEMIE.md) ·
[Entwicklungshinweise](docs/ENTWICKLUNG.md)

## Woher die Daten stammen

- **Stoffdaten:** [PubChem](https://pubchem.ncbi.nlm.nih.gov/) (National Library
  of Medicine) über PUG REST und PUG View, ergänzt um eine mitgelieferte
  Offline-Datenbank
- **Strukturberechnung:** [RDKit](https://www.rdkit.org/) als WebAssembly-Modul –
  läuft vollständig auf dem Gerät, es werden keine Strukturen verschickt
- **Reaktionen und Mechanismen:** kuratiert nach Organikum, Clayden *Organic
  Chemistry*, Hollemann-Wiberg, *Ullmann's Encyclopedia of Industrial Chemistry*
  und den bei jeder Reaktion angegebenen Originalarbeiten

## Sicherheit

Die Anleitungen sind **Lern- und Planungsmaterial, keine Freigabe zum
Experimentieren.** Chemische Synthesen gehören in ein dafür eingerichtetes Labor,
mit Gefährdungsbeurteilung, Aufsicht und Absaugung. Verbindlich sind immer die
Sicherheitsdatenblätter der Hersteller und die Regeln der jeweiligen Einrichtung.

Für Stoffgruppen mit ausschließlich schädigender Verwendung – chemische
Kampfstoffe, Explosivstoffe, Betäubungsmittel – zeigt die App bewusst **keine**
Synthesevorschriften. Eigenschaften und Gefahrenhinweise bleiben abrufbar.

## Grenzen

Die Vorschläge beruhen auf Mustererkennung: Die App prüft, ob die passende
funktionelle Gruppe vorhanden ist, und wendet die hinterlegte Vorschrift an. Sie
berücksichtigt weder Sterik noch Schutzgruppen, konkurrierende Gruppen im selben
Molekül oder die tatsächliche Reaktivität. Ein berechnetes Produkt ist ein
Vorschlag, kein Versprechen.
