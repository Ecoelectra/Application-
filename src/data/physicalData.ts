/**
 * Schmelz- und Siedepunkte bei Normaldruck (1013 hPa) in °C.
 *
 * Tabellenwerte gerundet nach CRC Handbook of Chemistry and Physics und
 * GESTIS-Stoffdatenbank. Stoffe ohne Eintrag schätzt die App: organische
 * Moleküle nach der Joback-Methode, Salze und Metalle über ihre Stoffklasse.
 *
 * - `mp` Schmelzpunkt, `bp` Siedepunkt
 * - `sub` Sublimationspunkt (geht direkt vom festen in den gasförmigen Zustand über)
 * - `dec` zersetzt sich ab dieser Temperatur
 * - `solution` liegt als wässrige Lösung vor (Salzsäure, Ammoniakwasser …)
 */
export interface PhysicalData {
  mp?: number;
  bp?: number;
  sub?: number;
  dec?: number;
  solution?: boolean;
}

const TABLE = `
wasser 0 100
ethanol -114 78
methanol -98 65
propan-1-ol -126 97
propan-2-ol -89 82
butan-1-ol -89 118
tert-butanol 26 82
cyclohexanol 25 161
glycerin 18 290
ethylenglycol -13 197
phenol 41 182
essigsaeure 17 118
ameisensaeure 8 101
propionsaeure -21 141
buttersaeure -5 164
benzoesaeure 122 249
salicylsaeure 159 - - 211
oxalsaeure 190 - - 190
citronensaeure 153 - - 175
stearinsaeure 69 361
aceton -95 56
butanon -86 80
acetophenon 20 202
cyclohexanon -31 156
formaldehyd -92 -19
acetaldehyd -123 20
benzaldehyd -26 179
vanillin 81 285
essigsaeureethylester -84 77
essigsaeuremethylester -98 57
acetylsalicylsaeure 135 - - 140
acetanhydrid -73 140
acetylchlorid -112 51
benzoylchlorid -1 197
acetamid 81 221
harnstoff 133 - - 135
anilin -6 184
methylamin -93 -6
ethylamin -81 17
dimethylamin -93 7
diethylamin -50 55
triethylamin -115 89
ethanolamin 10 170
ethylendiamin 11 116
piperidin -9 106
morpholin -5 129
hydrazin 2 114
pyridin -42 115
benzylamin 10 185
acetonitril -45 82
benzol 5.5 80
toluol -95 111
naphthalin 80 218
nitrobenzol 6 211
styrol -31 145
anisol -37 154
chlorbenzol -45 132
brombenzol -31 156
ethen -169 -104
propen -185 -48
cyclohexen -104 83
ethin - - -84
methan -182 -162
ethan -183 -89
propan -188 -42
butan -138 -1
pentan -130 36
hexan -95 69
heptan -91 98
octan -57 126
decan -30 174
cyclohexan 6.5 81
chloroform -64 61
dichlormethan -97 40
tetrachlormethan -23 77
iodmethan -66 42
bromethan -119 38
diethylether -116 35
tetrahydrofuran -108 66
1-4-dioxan 12 101
dimethylsulfoxid 19 189
n-n-dimethylformamid -61 153
acetylaceton -23 140
schwefelkohlenstoff -112 46
thionylchlorid -105 75
phosphoroxychlorid 1 106
triphenylphosphin 80 377
glucose 146 - - 146
saccharose 186 - - 186
glycin 233 - - 233
wasserstoff -259 -253
sauerstoff -218 -183
stickstoff -210 -196
chlor -101 -34
kohlenstoffdioxid - - -78.5
kohlenstoffmonoxid -205 -191
schwefeldioxid -72 -10
schwefeltrioxid 17 45
stickstoffmonoxid -164 -152
stickstoffdioxid -11 21
ammoniak -78 -33
schwefelwasserstoff -86 -60
distickstoffmonoxid -91 -88
helium -272 -269
argon -189 -186
ozon -192 -112
wasserstoffperoxid -0.4 150
brom -7 59
iod 114 184
schwefelsaeure 10 337
salpetersaeure -42 83
phosphorsaeure 42 - - 213
lithium 181 1342
natrium 98 883
kalium 64 759
magnesium 650 1091
calcium 842 1484
aluminium 660 2519
zink 420 907
eisen 1538 2862
nickel 1455 2913
zinn 232 2602
blei 327 1749
kupfer 1085 2562
silber 962 2162
gold 1064 2856
platin 1768 3825
quecksilber -39 357
kohlenstoff - - 3642
schwefel 115 445
roter-phosphor - - 416
silicium 1414 3265
natriumchlorid 801 1465
kaliumchlorid 770 1420
natriumhydroxid 318 1388
kaliumhydroxid 360 1327
lithiumhydroxid 462 - - 924
calciumhydroxid - - - 580
magnesiumhydroxid - - - 350
aluminiumhydroxid - - - 300
kupfer-ii-hydroxid - - - 80
eisen-iii-hydroxid - - - 150
natriumcarbonat 851
natriumhydrogencarbonat - - - 80
kaliumhydrogencarbonat - - - 100
calciumcarbonat - - - 825
magnesiumcarbonat - - - 350
zinkcarbonat - - - 140
ammoniumcarbonat - - - 58
ammoniumhydrogencarbonat - - - 40
calciumoxid 2613 2850
kupfersulfat - - - 110
kupfersulfat-wasserfrei - - - 650
kaliumpermanganat - - - 240
kaliumdichromat 398 - - 500
ammoniumchlorid - - 338
kaliumnitrat 334 - - 400
natriumnitrat 308 - - 380
silbernitrat 212 - - 440
ammoniumnitrat 170 - - 210
kaliumchlorat 356 - - 400
calciumchlorid 772 1935
magnesiumchlorid 714 1412
bariumchlorid 962 1560
aluminiumchlorid - - 180
eisen-iii-chlorid 306 - - 315
zinkchlorid 290 732
kupfer-ii-chlorid 498 - - 993
silberchlorid 455 1547
natriumbromid 747 1390
kaliumbromid 734 1435
natriumiodid 661 1304
kaliumiodid 681 1330
natriumfluorid 993 1704
natriumsulfat 884
kaliumsulfat 1069
bariumsulfat 1580
aluminiumoxid 2072 2977
eisen-iii-oxid 1565
siliciumdioxid 1713 2950
titandioxid 1843 2972
magnesiumoxid 2852 3600
zinkoxid 1975
kupfer-ii-oxid 1326
silberoxid - - - 200
quecksilber-ii-oxid - - - 500
blei-ii-oxid 888
mangandioxid - - - 535
natriumperoxid 460 - - 657
calciumcarbid 2160
natriumthiosulfat 48
natriumnitrit 271 - - 320
natriumacetat 324
ammoniumsulfat - - - 235
`;

/** Stoffe, die in der Datenbank als wässrige Lösung gemeint sind. */
const SOLUTIONS = [
  'salzsaeure', 'bromwasserstoffsaeure', 'iodwasserstoffsaeure', 'flusssaeure', 'kohlensaeure',
  'schweflige-saeure', 'natriumhypochlorit', 'lugolsche-loesung', 'tollens-reagenz', 'fehling-reagenz',
];

function parse(): Record<string, PhysicalData> {
  const result: Record<string, PhysicalData> = {};
  for (const line of TABLE.trim().split('\n')) {
    const [id, mp, bp, sub, dec] = line.trim().split(/\s+/);
    const value = (text: string | undefined) => (text && text !== '-' ? Number(text) : undefined);
    result[id] = { mp: value(mp), bp: value(bp), sub: value(sub), dec: value(dec) };
  }
  for (const id of SOLUTIONS) result[id] = { ...(result[id] ?? {}), solution: true };
  return result;
}

export const PHYSICAL_DATA: Readonly<Record<string, PhysicalData>> = parse();
