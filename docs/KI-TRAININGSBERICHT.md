# Trainingsbericht Reaktions-KI: 1 Million Reaktionen aus mehreren Quellen

Stand: 29. September 2026 · Modell unter `public/ki/` · Rohdaten der Auswertung:
`.cache/ki/bericht.json` und `.cache/ki/vergleich.json` (werden beim Training
erzeugt, nicht im Repository)

## Kurzfassung: Hat es funktioniert?

**Ja.** Das neuronale Netz wurde mit **1.030.272 verschiedenen, geprüften
Reaktionen aus zehn Datensätzen** neu trainiert (vorher 476.981 Reaktionen aus
einem Datensatz). Auf Testreaktionen, die es beim Lernen nie gesehen hat, ist
es in **jeder** Quelle besser als das alte Modell – gemessen an exakt denselben
Testfällen:

| Testreaktionen | richtiges Produkt auf Platz 1, vorher → nachher | unter den ersten 3 |
|---|---:|---:|
| US-Patente, USPTO-MIT-Testsatz (2.000) | 69,3 % → **72,4 %** | 77,0 % → **81,1 %** |
| US-Patente, übrige Erteilungen 1976–2016 (2.000) | 37,1 % → **50,7 %** | 42,8 % → **58,0 %** |
| Enzymreaktionen aus BRENDA / EnzymeMap (2.000) | 9,2 % → **50,0 %** | 14,1 % → **69,5 %** |
| Stoffwechselwege aus PathBank (943) | 0,2 % → **90,2 %** | 0,3 % → **93,8 %** |
| Biochemische Reaktionen aus Rhea (295) | 3,1 % → **33,6 %** | 5,1 % → **45,8 %** |
| Stoffwechselnetze aus MetaNetX (510) | 2,0 % → **18,8 %** | 3,5 % → **29,2 %** |
| Enzymreaktionen aus BRENDA / ECREACT (210) | 3,8 % → **14,3 %** | 6,2 % → **26,7 %** |

Die Katalysatorart wird bei Patentreaktionen so gut getroffen wie vorher
(70,0 % → 70,4 % auf dem USPTO-MIT-Testsatz, 64,5 % → 72,2 % auf den übrigen
Patenten). Neu erkennt die KI Enzyme als Katalysator.

Die Lernkurve ist sauber: Der Verlust sank in fünf Epochen von 3,93 auf 1,60,
die Treffer auf den Validierungsdaten stiegen in jeder Epoche. Alle 1.021
KI-Tests der App laufen mit dem neuen Modell durch.

**Aber:** «Mehrere Quellen» heißt hier nicht «gleich viele». Rund **96 % der
Trainingsreaktionen stammen aus US-Patenten** (in drei verschiedenen
Aufbereitungen), etwa 4 % aus Enzym- und Stoffwechseldatenbanken. Offene
Datensätze aus der Fachliteratur der organischen Synthese in dieser Größe gibt
es praktisch nicht, und die großen offenen Sammlungen, die es noch gibt (Open
Reaction Database, Daten auf figshare und Zenodo), waren aus der
Rechenumgebung nicht erreichbar. Die Einzelheiten stehen unten.

## 1. Die Quellen

| Datensatz | Herkunft | Art | gelesene Zeilen |
|---|---|---|---:|
| USPTO-MIT | Jin et al., NIPS 2017, aus Lowe 2012 | US-Patenterteilungen, atomzugeordnet | 478.998 |
| USPTO (Lowe 2017), Spiegel von DeepChem | D. M. Lowe, CC0 | US-Patenterteilungen 1976–2016 | 1.808.781 |
| USPTO-STEREO | Schwaller et al., ACS Cent. Sci. 2019 | US-Patente mit Stereochemie | 1.002.910 |
| EnzymeMap v2 | Heid et al., Chem. Sci. 2023 | Enzymreaktionen aus BRENDA, atomzugeordnet | 291.770 |
| ECREACT – BRENDA | Probst et al., Nat. Commun. 2022 | Enzymreaktionen | 8.496 |
| ECREACT – Rhea | Probst et al., Nat. Commun. 2022 | biochemische Reaktionen (SIB) | 6.715 |
| ECREACT – PathBank | Probst et al., Nat. Commun. 2022 | Stoffwechselwege | 27.835 |
| ECREACT – MetaNetX | Probst et al., Nat. Commun. 2022 | Stoffwechselnetze | 19.169 |
| Suzuki-Hochdurchsatz | Perera et al., Science 2018 (Pfizer) | 5.760 Versuche, Bedingungen variiert | 5.760 |
| Buchwald-Hartwig-Hochdurchsatz | Ahneman et al., Science 2018 (Merck/Doyle) | 3.955 Versuche, Bedingungen variiert | 3.955 |
| **Summe** | | | **3.654.389** |

Unabhängige Herkünfte sind damit: US-Patentamt (über drei getrennt
aufbereitete Datensätze), BRENDA, Rhea, PathBank, MetaNetX und zwei
Pharmaunternehmen mit Hochdurchsatz-Experimenten.

**Nicht erreichbar** waren aus der Rechenumgebung: Open Reaction Database
(Daten in Git-LFS, gesperrt), figshare, Zenodo, Hugging Face, Harvard
Dataverse und die Rhea-Website. Ebenfalls nicht genutzt wurden kommerzielle
Datenbanken (Reaxys, CAS, Pistachio), deren Daten nicht frei verwendbar sind.

## 2. Aufbereitung

| Schritt | Reaktionen |
|---|---:|
| gelesen (alle Zeilen aller Datensätze) | 3.654.389 |
| nach erster Dublettenprüfung (gleiche Stoffe links, gleiches Hauptprodukt) | 1.312.046 |
| mit Atomzuordnung (vorhanden oder RXNMapper, Konfidenz ≥ 0,1) | 1.207.037 |
| Vorlage herausgeschnitten und geprüft (reproduziert das Produkt) | 1.195.405 |
| **verschieden nach endgültiger Dublettenprüfung** (beitragende Edukte + Produkt) | **1.030.272** |
| davon Training / Validierung / Test | 949.601 / 34.764 / 45.907 |
| Lernbeispiele mit einer der 5.953 gelernten Vorlagen | 678.803 |

Je Quelle:

| Quelle | geprüft | verschieden | Training | Validierung | Test |
|---|---:|---:|---:|---:|---:|
| USPTO-MIT | 471.541 | 450.878 | 387.597 | 27.187 | 36.094 |
| USPTO 1976–2016 (Lowe) | 638.519 | 532.864 | 522.186 | 5.415 | 5.263 |
| USPTO-STEREO | 23.974 | 1.274 | 1.252 | 12 | 10 |
| EnzymeMap (BRENDA) | 28.401 | 25.393 | 21.597 | 1.217 | 2.579 |
| ECREACT PathBank | 10.076 | 9.782 | 8.389 | 450 | 943 |
| ECREACT MetaNetX | 6.116 | 4.977 | 4.220 | 247 | 510 |
| ECREACT Rhea | 3.157 | 2.786 | 2.349 | 142 | 295 |
| ECREACT BRENDA | 3.906 | 2.289 | 1.985 | 94 | 210 |
| Suzuki-Hochdurchsatz | 5.760 | 15 | 13 | 0 | 2 |
| Buchwald-Hartwig-Hochdurchsatz | 3.955 | 14 | 13 | 0 | 1 |
| **Summe** | **1.195.405** | **1.030.272** | **949.601** | **34.764** | **45.907** |

Was dabei auffiel:

- **Die drei Patentdatensätze überlappen stark.** Von 1,8 Mio. Zeilen der
  Patenterteilungen sind nach Abzug von USPTO-MIT und Wiederholungen (dieselbe
  Reaktion in mehreren Patenten) 722.493 neu; USPTO-STEREO bringt nach
  Dublettenprüfung nur noch 1.274 eigene Reaktionen. Sie stammt also aus
  denselben Patenten.
- **Die Hochdurchsatz-Daten schrumpfen auf je rund 15 Reaktionen.** Diese
  Experimente variieren Katalysator, Ligand, Base und Lösungsmittel, aber kaum
  die Stoffe; als Reaktion (Edukte → Produkt) zählen sie deshalb nur wenige
  Male. Für die Katalysator-Statistik der Vorlagen tragen sie trotzdem bei.
- **Atomzuordnung:** 1.312.046 − 1.207.037 = 105.009 Reaktionen fielen weg,
  weil RXNMapper unsicher war (Konfidenz < 0,1) oder es keine echte Reaktion
  war (Salzbildung, reine Trennung von Stereoisomeren). Eine Stichprobe von
  300 Patentreaktionen ergab: 16 % unter Konfidenz 0,2 – viele davon trotzdem
  richtig –, 8 % ohne Bindungsänderung.
- **Enzymreaktionen:** Zunächst hielt das Skript den Cofaktor (NAD⁺, ATP …)
  für das Hauptprodukt, weil er das größte Molekül ist. Das wurde vor der
  Atomzuordnung korrigiert: Hauptprodukt ist nun das größte Molekül ohne
  Adenin- oder Flavingerüst, Cofaktoren werden zu Hilfsstoffen. Enzyme gehen
  als Hilfsstoff «EC x.y.z» ins Training und bilden die neue
  Katalysatorklasse «Enzym (Biokatalysator)».
- **Keine Vermischung von Training und Test:** Der USPTO-MIT-Testsatz blieb
  unverändert; jede Reaktion aus einer anderen Quelle, die mit einer Test- oder
  Validierungsreaktion übereinstimmt, wurde als Dublette entfernt. Die übrigen
  Quellen wurden per Hash der Reaktion aufgeteilt (Patente 98/1/1 %, kleinere
  Quellen 85/5/10 %).

## 3. Training

- Netz: Morgan-Fingerabdruck der Edukte (2048 Bit) → 256 Neuronen → 5.953
  Vorlagen (Softmax) und 25 Hilfsstoff-Kategorien (Sigmoid); 8-Bit-Gewichte
- Vorlagen mit mindestens 15 Fundstellen im Training (aus den kleineren
  Quellen mindestens 8); sie decken 71,5 % der Trainingsreaktionen ab
- Adam, Stapelgröße 512, 5 Epochen, 4 Threads, 71 Minuten

| Epoche | Verlust | Treffer Training | Validierung: Vorlage auf Platz 1 | unter ersten 5 |
|---:|---:|---:|---:|---:|
| 1 | 3,933 | 42,0 % | 48,7 % | 74,2 % |
| 2 | 2,157 | 62,7 % | 50,2 % | 77,2 % |
| 3 | 1,884 | 68,2 % | 50,5 % | 77,9 % |
| 4 | 1,642 | 74,9 % | 52,7 % | 78,3 % |
| 5 | 1,596 | 76,1 % | 53,6 % | 78,6 % |

Die Validierungswerte steigen bis zur letzten Epoche und flachen dann ab – kein
Anzeichen von Überanpassung, aber auch kaum Luft für weitere Epochen.

## 4. Ergebnisse im Einzelnen

Gemessen wie in der App: Das Netz ordnet die Vorlagen, die 30
wahrscheinlichsten werden mit RDKit auf die Edukte angewendet, die Produkte
nach Wahrscheinlichkeit sortiert. «Vorlage bekannt» heißt: Die Vorlage der
Testreaktion gehört zu den gelernten – nur dann kann das Netz überhaupt richtig
liegen. «Katalysator richtig»: Die wahrscheinlichste Katalysatorklasse kommt
in der Literaturreaktion vor (gezählt nur, wo ein Katalysator angegeben ist).

| Testquelle | Fälle | Vorlage bekannt | Produkt Platz 1 | unter ersten 3 | unter ersten 5 | Katalysator richtig |
|---|---:|---:|---:|---:|---:|---:|
| USPTO-MIT | 2.000 | 81,4 % | 72,4 % | 81,1 % | 82,8 % | 70,4 % (203) |
| USPTO 1976–2016 | 2.000 | 60,3 % | 50,7 % | 58,0 % | 59,3 % | 72,2 % (273) |
| EnzymeMap (BRENDA) | 2.000 | 86,0 % | 50,0 % | 69,5 % | 78,9 % | 94,8 % (2.000) |
| ECREACT PathBank | 943 | 94,1 % | 90,2 % | 93,8 % | 94,4 % | 99,0 % (943) |
| ECREACT MetaNetX | 510 | 37,6 % | 18,8 % | 29,2 % | 33,5 % | 91,8 % (510) |
| ECREACT Rhea | 295 | 59,0 % | 33,6 % | 45,8 % | 49,2 % | 98,6 % (295) |
| ECREACT BRENDA | 210 | 33,8 % | 14,3 % | 26,7 % | 30,5 % | 95,2 % (210) |
| USPTO-STEREO | 10 | 60,0 % | 60,0 % | 60,0 % | 60,0 % | 87,5 % (8) |
| Suzuki-Hochdurchsatz | 2 | 100 % | 100 % | 100 % | 100 % | 100 % (2) |
| Buchwald-Hartwig-Hochdurchsatz | 1 | 100 % | 100 % | 100 % | 100 % | 100 % (1) |

So sind die Zahlen zu lesen:

- **Patente aus USPTO-MIT** sind am besten, weil diese Daten sorgfältig
  bereinigt sind. Der Zuwachs gegenüber dem alten Modell (+3 Punkte auf
  Platz 1, +4 unter den ersten drei) kommt von den zusätzlichen Vorlagen.
- **Die übrigen Patente** sind schwieriger (50,7 %): Sie sind nicht
  vorgefiltert, und die Atomzuordnung stammt von RXNMapper statt aus dem
  kuratierten Datensatz. Hier ist der Gewinn am größten (+13,6 Punkte).
- **Enzymreaktionen** kannte das alte Modell praktisch nicht; jetzt liegt bei
  BRENDA die Hälfte richtig auf Platz 1. **PathBank mit 90 %** ist zu
  optimistisch: Diese Daten enthalten viele fast gleiche Reaktionen (etwa
  dieselbe Umsetzung mit Fettsäuren verschiedener Kettenlänge), Test und
  Training ähneln sich also stark. **MetaNetX und ECREACT-BRENDA** bleiben
  schwach (19 % bzw. 14 %), weil dort viele seltene Reaktionstypen vorkommen,
  deren Vorlagen weniger als 8-mal auftreten.
- **Katalysator bei Enzymreaktionen (92–99 %)** ist fast geschenkt: Jede
  dieser Reaktionen hat ein Enzym, und das Netz erkennt biochemische Moleküle
  leicht. Aussagekräftig ist die Zahl nur in dem Sinn, dass die KI Enzyme
  nicht mit Metallkatalysatoren verwechselt.
- **Hochdurchsatz-Daten**: Mit 1–2 Testfällen ist keine Aussage möglich.
- **«Vorlage bekannt» beim alten Modell** (etwa 2,6 % bei den übrigen
  Patenten) ist nicht mit dem neuen vergleichbar: RXNMapper nummeriert die
  Atome anders als USPTO-MIT, dadurch sehen gleiche Vorlagen als Text
  verschieden aus. Fair vergleichbar sind die Produkt- und Katalysatorwerte.

## 5. Was sich in der App ändert

- Das Modell ist größer: 1,8 MB Netz und 0,6 MB Vorlagen (vorher 0,9 und
  0,2 MB, jeweils gepackt). Es wird wie bisher einmal geladen und offline
  gespeichert.
- Neue Katalysatorklasse **«Enzym (Biokatalysator)»** mit der Enzymklasse
  (etwa «Hydrolase (EC 3.1.1.3)») und neue Reaktionsfamilie **«Enzymatische
  Umsetzung»** (Richtwerte Ea ohne Enzym 125, mit Enzym 55 kJ/mol).
- Die KI-Seite zeigt, aus welchen Quellen die Reaktionen stammen.

## 6. Grenzen

- **Übergewicht der Patente.** 96 % der Trainingsreaktionen kommen aus
  US-Patenten 1976–2016 – eine einzige Behörde, ein Zeitraum, vor allem
  Wirkstoffchemie. Chemie, die in Patenten selten ist (Naturstoffsynthese,
  Materialchemie, Anorganik), kennt die KI weiterhin kaum.
- **Keine unabhängige Literaturquelle für organische Synthese.** Die einzigen
  Nicht-Patent-Daten sind Biochemie und Hochdurchsatz-Experimente. Eine echte
  Gegenprobe an Reaktionen aus Fachzeitschriften war nicht möglich.
- **Automatische Atomzuordnung.** Für 54 % der Reaktionen stammt die
  Zuordnung von RXNMapper; Fehler dort können falsche Vorlagen erzeugen. Die
  Prüfung (Vorlage muss das Produkt reproduzieren) und die Mindesthäufigkeit
  der Vorlagen fangen viel ab, aber nicht alles.
- **29 % der Trainingsreaktionen** haben eine seltene Vorlage (weniger als 15
  Fundstellen) und dienen dem Netz nicht als Lernbeispiel; für diese
  Reaktionstypen kann es kein Produkt vorschlagen.
- **Nur Produkt und Katalysatorklasse** werden geprüft, nicht Ausbeute,
  Selektivität oder Nebenprodukte. Die Aktivierungsenergien bleiben Richtwerte
  der Reaktionsfamilie.

## 7. Nachvollziehen

```
scripts/ki/quellen/download.sh                    # Quellen und Python-Umgebung
.cache/mapper-env/bin/python scripts/ki/quellen/prepare.py
for i in 0 1 2 3; do .cache/mapper-env/bin/python scripts/ki/quellen/map.py $i 4 & done; wait
KI_MIN=15 KI_EPOCHS=5 npm run ki                  # Extraktion und Training
npx vite-node scripts/ki/evaluate.ts vorher=<altes Modell> nachher=public/ki
npx vite-node scripts/ki/bericht.ts               # Tabellen dieses Berichts
```

Rechenzeit auf vier Kernen: Aufbereitung etwa 30 Minuten, Atomzuordnung etwa
2,5 Stunden, Extraktion 15 Minuten, Training 71 Minuten, Vergleich 5 Minuten.

## 8. Nachtraining: Technische Katalyse

*30. September 2026.* Anlass: Die Werkbank fand für **Kohlenstoffdioxid +
Wasserstoff** keine Reaktion – auch nicht mit Metallkatalysator, hoher
Temperatur und hohem Druck. Solche Gasreaktionen der Großindustrie stehen kaum
in Patenten der organischen Synthese; das Netz kannte sie nicht.

**Neue Quelle «Technische Katalyse».** 33 kuratierte Reaktionen mit
Katalysator und Literaturangabe (`scripts/ki/quellen/technik.tsv`), davon nach
der Dublettenprüfung 31 verschieden:

| Bereich | Reaktionen |
|---|---|
| Hydrierung von CO₂ und CO | Sabatier (CO₂ → Methan, Ni), CO₂ → Methanol (Cu/ZnO), CO → Methan, CO → Methanol |
| Reformierung und Shift | Dampf- und Trockenreformierung von Methan (Ni), Wassergas-Shift und Umkehrung (Cu/ZnO) |
| Oxo-Synthese | Hydroformylierung von Ethen, Propen, 1-Buten, 1-Hexen, 1-Octen, Styrol (Rh, Co); Monsanto-Essigsäure (Rh/Iodid) |
| Gasphasen-Oxidation | Ethylenoxid (Ag), Formaldehyd aus Methanol (Ag) |
| Dehydrierung | Ethanol, 1-/2-Propanol, 1-/2-Butanol, Cyclohexanol (Cu); Cyclohexan, Methylcyclohexan (Pt) |
| Hydratisierung | Ethen, Propen, 1-Buten (Phosphorsäure) |
| CO₂-Fixierung | CO₂ + Ethylen-, Propylen-, Butylen-, Styroloxid → cyclische Carbonate (Bromid) |

Die Atomzuordnung machte RXNMapper; eine falsch zugeordnete Reaktion
(Isobuten-Hydratisierung: Sauerstoff aus der Phosphorsäure statt aus Wasser)
wurde entfernt, eine zweite (Harnstoff) braucht drei Edukte und passt nicht ins
Netz. Die Vorlagen verallgemeinern: Die Hydroformylierung ergibt eine Vorlage für
alle endständigen Alkene, die CO₂-Fixierung eine für alle Epoxide.

**Wie die kleine Quelle gegen eine Million Reaktionen ankommt.** Ihre Vorlagen
werden immer übernommen (18 neue, zusammen 5.971), ihre Familie steht in der
Tabelle, und jede ihrer Reaktionen zählt im Training 200-fach (6.200 von 684.000
Lernbeispielen je Epoche, unter 1 %). Neu sind sieben Reaktionsfamilien mit
Aktivierungsenergien, die die technische Arbeitstemperatur treffen (etwa
145 kJ/mol ≙ Beginn bei 250 °C für die CO₂-Hydrierung), und die
Hilfsstoff-Kategorie «Technischer Metallkatalysator» (Silber, Cobalt, Vanadium,
Molybdän). Ansonsten gleiche Einstellungen wie in Abschnitt 3 (5 Epochen,
gleicher Startwert, 85 Minuten).

| Epoche | Verlust | Treffer Training | Validierung: Vorlage auf Platz 1 | unter ersten 5 |
|---:|---:|---:|---:|---:|
| 1 | 3,94 | 42,4 % | 45,7 % | 74,1 % |
| 2 | 2,15 | 62,9 % | 49,1 % | 76,6 % |
| 3 | 1,88 | 68,4 % | 51,5 % | 77,7 % |
| 4 | 1,64 | 75,1 % | 53,2 % | 78,5 % |
| 5 | 1,59 | 76,2 % | 51,5 % | 78,5 % |

**Ergebnis.** Beide Modelle auf *denselben* zurückgehaltenen Testreaktionen
(`scripts/ki/evaluate.ts`). Die Katalysatorwerte weichen von Abschnitt 4 ab, weil
jetzt mehr Hilfsstoffe eingeordnet werden (etwa Phosphorsäure, Bromid) und damit
mehr Fälle zählen (USPTO-MIT 222 statt 203).

| Test | vorher | nachher |
|---|---:|---:|
| USPTO-MIT: richtiges Produkt auf Platz 1 / unter den ersten 3 | 72,4 % / 81,1 % | 72,5 % / 81,5 % |
| USPTO-MIT: richtige Katalysatorart (222 Fälle) | 64,9 % | 65,3 % |
| USPTO 1976–2016: Produkt Platz 1 / erste 3 | 50,7 % / 58,0 % | 51,0 % / 57,6 % |
| USPTO 1976–2016: richtige Katalysatorart (283 bzw. 285 Fälle) | 69,6 % | 67,4 % |
| Enzymreaktionen (EnzymeMap): Platz 1 / erste 3 | 50,0 % / 69,5 % | 49,1 % / 69,6 % |
| Technische Katalyse (Wiedererkennen): Platz 1 / erste 3 | – | 90,3 % / 100 % |
| Technische Katalyse: richtige Katalysatorart (28 Fälle) | – | 92,9 % |

Das Netz hat die neuen Reaktionen gelernt. Bei den bisherigen Produkten bleibt
es gleich gut (Unterschiede unter einem Prozentpunkt, im Rahmen des Zufalls);
bei der Katalysatorart der Patente 1976–2016 verliert es 2,2 Punkte – vermutlich,
weil die neue Kategorie «Technischer Metallkatalysator» und die jetzt
eingeordneten Säuren und Halogenide mit den bisherigen Klassen konkurrieren. In der Werkbank: CO₂ + H₂ ohne Katalysator – blockiert; mit
Metallkatalysator bei 20 °C – zu langsam («zügig ab etwa 247 °C»); bei 300 °C
und 30 bar – läuft, zu Methanol (Kupfer/Zinkoxid) und Methan (Nickel).

**Grenzen.** Die technischen Reaktionen sind *Trainingsdaten*; «Wiedererkennen»
heißt, das Netz gibt sie für genau diese Edukte zurück – es ist kein Test an
unbekannten Reaktionen. Verallgemeinern kann es nur innerhalb einer Vorlage
(andere Alkene bei der Hydroformylierung, andere Epoxide bei der CO₂-Fixierung,
andere Alkohole bei der Dehydrierung). Welches der möglichen Produkte bei CO₂ + H₂
entsteht (Methan, Methanol, CO), entscheidet in Wirklichkeit der Katalysator;
das Netz nennt alle, die Metallkatalysator-Vorhersage ordnet jedem den passenden
zu. Gleichgewichte (etwa die Rückreaktion der Sabatier-Reaktion über 500 °C)
werden nur als Hinweis angegeben, nicht berechnet.
