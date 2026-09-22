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
| `pubchem.test.ts` | PubChem-Client mit simulierten Antworten |

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
