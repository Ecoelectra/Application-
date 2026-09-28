/**
 * Standardbildungsenthalpien ΔfH° bei 25 °C und 1 bar in kJ/mol.
 *
 * Werte nach den NBS-Tabellen (Wagman et al., J. Phys. Chem. Ref. Data 11,
 * Suppl. 2, 1982) und dem CRC Handbook of Chemistry and Physics, gerundet auf
 * 0,1 kJ/mol. Elemente in ihrem Standardzustand haben ΔfH° = 0 und stehen
 * nicht in der Tabelle.
 *
 * Aggregatzustände: s fest, l flüssig, g gasförmig, aq in Wasser gelöst
 * (Ionen: unendliche Verdünnung, H⁺(aq) = 0 als Bezug).
 * Der erste Eintrag einer Formel ist ihr Standardzustand.
 */

export type ThermoPhase = 's' | 'l' | 'g' | 'aq';

/** Anorganische Stoffe und Ionen: Formel | Zustand | ΔfH° */
const INORGANIC = `
H2O l -285.8
H2O g -241.8
Br2 g 30.9
I2 g 62.4
H2O2 l -187.8
H2O2 aq -191.2
O3 g 142.7
CO g -110.5
CO2 g -393.5
CO2 aq -413.8
CS2 l 89.0
HCN g 135.1
NH3 g -45.9
NH3 aq -80.3
N2H4 l 50.6
NO g 91.3
NO2 g 33.2
N2O g 81.6
N2O4 g 11.1
N2O5 s -43.1
HNO3 l -174.1
SO2 g -296.8
SO2 aq -323.0
SO3 g -395.7
H2S g -20.6
H2S aq -39.7
H2SO4 l -814.0
HCl g -92.3
HBr g -36.3
HI g 26.5
HF g -273.3
HF aq -320.1
H3PO4 s -1284.4
H3PO4 l -1271.7
H3PO4 aq -1288.3
H3BO3 s -1094.3
P4O10 s -2984.0
PCl3 l -319.7
PCl5 s -443.5
SiO2 s -910.7
SiCl4 l -687.0
NaCl s -411.2
KCl s -436.5
LiCl s -408.6
NaBr s -361.1
KBr s -393.8
NaI s -287.8
KI s -327.9
NaF s -576.6
KF s -567.3
CaF2 s -1228.0
NaOH s -425.6
KOH s -424.6
LiOH s -487.5
Ca(OH)2 s -985.2
Mg(OH)2 s -924.5
Ba(OH)2 s -944.7
Al(OH)3 s -1276.0
Fe(OH)3 s -823.0
Fe(OH)2 s -569.0
Cu(OH)2 s -449.8
Zn(OH)2 s -641.9
Na2O s -414.2
K2O s -361.5
Li2O s -597.9
CaO s -634.9
MgO s -601.6
BaO s -548.0
Al2O3 s -1675.7
Fe2O3 s -824.2
Fe3O4 s -1118.4
FeO s -272.0
CuO s -157.3
Cu2O s -168.6
ZnO s -350.5
PbO s -217.3
PbO2 s -277.4
Ag2O s -31.1
HgO s -90.8
MnO2 s -520.0
Cr2O3 s -1139.7
TiO2 s -944.0
SnO2 s -577.6
SnO s -280.7
NiO s -239.7
CoO s -237.9
Na2O2 s -510.9
BaO2 s -634.3
CaCO3 s -1207.6
MgCO3 s -1095.8
Na2CO3 s -1130.7
K2CO3 s -1151.0
Li2CO3 s -1216.0
NaHCO3 s -950.8
KHCO3 s -963.2
BaCO3 s -1213.0
ZnCO3 s -812.8
FeCO3 s -740.6
PbCO3 s -699.1
Ag2CO3 s -505.8
NH4HCO3 s -849.4
CuSO4 s -771.4
CuSO4·5H2O s -2279.7
Na2SO4 s -1387.1
K2SO4 s -1437.8
MgSO4 s -1284.9
CaSO4 s -1434.5
CaSO4·2H2O s -2022.6
BaSO4 s -1473.2
ZnSO4 s -982.8
FeSO4 s -928.4
FeSO4·7H2O s -3014.6
Al2(SO4)3 s -3440.8
(NH4)2SO4 s -1180.9
PbSO4 s -920.0
Ag2SO4 s -715.9
NiSO4 s -872.9
NaHSO4 s -1125.5
NaNO3 s -467.9
KNO3 s -494.6
AgNO3 s -124.4
NH4NO3 s -365.6
Ca(NO3)2 s -938.2
Mg(NO3)2 s -790.7
Pb(NO3)2 s -451.9
Cu(NO3)2 s -302.9
Ba(NO3)2 s -988.0
NaNO2 s -358.7
KNO2 s -369.8
AgCl s -127.0
AgBr s -100.4
AgI s -61.8
CaCl2 s -795.4
MgCl2 s -641.3
BaCl2 s -855.0
AlCl3 s -704.2
FeCl3 s -399.5
FeCl2 s -341.8
ZnCl2 s -415.1
CuCl2 s -220.1
CuCl s -137.2
PbCl2 s -359.4
PbI2 s -175.5
NH4Cl s -314.4
HgCl2 s -224.3
SnCl2 s -325.1
NiCl2 s -305.3
CoCl2 s -312.5
MnCl2 s -481.3
ZnS s -206.0
FeS s -100.0
FeS2 s -178.2
CuS s -53.1
PbS s -100.4
Ag2S s -32.6
HgS s -58.2
Na2S s -364.8
KMnO4 s -837.2
K2Cr2O7 s -2061.5
K2CrO4 s -1403.7
KClO3 s -397.7
KClO4 s -432.8
NaClO3 s -365.8
Na2S2O3 s -1123.0
CaC2 s -59.8
NaH s -56.3
LiH s -90.5
CaH2 s -181.5
NaNH2 s -123.8
Li3N s -164.6
Mg3N2 s -461.1
Na3PO4 s -1917.4
Mg3(PO4)2 s -3780.7
Pb(OH)2 s -515.9
Sn(OH)2 s -561.1
NiS s -82.0
CaC2O4 s -1360.6
Na2SiO3 s -1554.9
CaSiO3 s -1634.9
H2SiO3 s -1188.7
AgF s -204.6
AgSCN s 87.9
BaF2 s -1207.1
PbF2 s -664.0
Ni(OH)2 s -529.7
Co(OH)2 s -539.7
NaClO4 s -383.3
BaCrO4 s -1446.0
H2CO3 aq -699.7
Ca3(PO4)2 s -4120.8
Na2B4O7 s -3291.1
H^+ aq 0
OH^- aq -230.0
Li^+ aq -278.5
Na^+ aq -240.1
K^+ aq -252.4
NH4^+ aq -132.5
Ag^+ aq 105.6
Cu^+ aq 71.7
Mg^2+ aq -466.9
Ca^2+ aq -542.8
Ba^2+ aq -537.6
Sr^2+ aq -545.8
Zn^2+ aq -153.9
Fe^2+ aq -89.1
Fe^3+ aq -48.5
Cu^2+ aq 64.8
Ni^2+ aq -54.0
Co^2+ aq -58.2
Mn^2+ aq -220.8
Pb^2+ aq -1.7
Sn^2+ aq -8.8
Hg^2+ aq 171.1
Cd^2+ aq -75.9
Al^3+ aq -531.0
F^- aq -332.6
Cl^- aq -167.2
Br^- aq -121.6
I^- aq -55.2
NO3^- aq -205.0
NO2^- aq -104.6
SO4^2- aq -909.3
HSO4^- aq -887.3
SO3^2- aq -635.5
S2O3^2- aq -652.3
S^2- aq 33.1
HS^- aq -17.6
CO3^2- aq -677.1
HCO3^- aq -692.0
HSO3^- aq -626.2
HC2O4^- aq -818.4
PO4^3- aq -1277.4
HPO4^2- aq -1292.1
H2PO4^- aq -1296.3
CH3COO^- aq -486.0
C2O4^2- aq -825.1
MnO4^- aq -541.4
CrO4^2- aq -881.2
Cr2O7^2- aq -1490.3
SCN^- aq 76.4
CN^- aq 150.6
ClO^- aq -107.1
ClO3^- aq -104.0
ClO4^- aq -129.3
IO3^- aq -221.3
[Ag(NH3)2]^+ aq -111.3
[Cu(NH3)4]^2+ aq -348.5
[Zn(NH3)4]^2+ aq -533.5
[Ag(CN)2]^- aq 270.3
[Ag(S2O3)2]^3- aq -1285.7
[Fe(CN)6]^3- aq 561.9
[Fe(CN)6]^4- aq 455.6
`;

/** Organische Stoffe: SMILES | Zustand | ΔfH° */
const ORGANIC = `
C g -74.6
CC g -84.0
CCC g -103.8
CCCC g -125.7
CC(C)C g -134.2
CCCCC l -173.5
CCCCCC l -198.7
CCCCCCC l -224.2
CCCCCCCC l -250.1
CC(C)CC(C)(C)C l -259.2
C1CCCCC1 l -156.4
C1CCCC1 l -105.1
C=C g 52.4
CC=C g 20.0
C=C(C)C g -16.9
C=CC=C g 110.0
C#C g 227.4
C1=CCCCC1 l -38.5
c1ccccc1 l 49.1
Cc1ccccc1 l 12.4
CCc1ccccc1 l -12.3
Cc1ccccc1C l -24.4
C=Cc1ccccc1 l 103.8
c1ccc2ccccc2c1 s 78.5
c1ccc(-c2ccccc2)cc1 s 99.4
CO l -239.2
CCO l -277.6
CCCO l -302.6
CC(C)O l -318.1
CCCCO l -327.3
CC(C)(C)O l -359.2
OC1CCCCC1 l -348.2
OCCO l -460.0
OCC(O)CO l -669.6
OCc1ccccc1 l -160.7
Oc1ccccc1 s -165.1
C=O g -108.6
CC=O l -192.2
CCC=O l -215.6
O=Cc1ccccc1 l -86.8
CC(C)=O l -248.4
CCC(C)=O l -273.3
O=C1CCCCC1 l -271.2
CC(=O)c1ccccc1 l -142.5
OC=O l -425.0
CC(=O)O l -484.3
CC(=O)O aq -485.8
CCC(=O)O l -510.7
CCCC(=O)O l -533.8
OC(=O)c1ccccc1 s -385.2
OC(=O)C(=O)O s -821.7
OC(=O)CCCCC(=O)O s -994.3
CCOC(C)=O l -479.3
COC(C)=O l -445.9
CC(=O)OC(C)=O l -624.4
CC(=O)Cl l -272.9
CCOCC l -279.5
COC g -184.1
C1CCOC1 l -216.2
C1CO1 g -52.6
CN g -22.5
CCN l -74.1
CCN(CC)CC l -127.7
Nc1ccccc1 l 31.3
c1ccncc1 l 100.2
CC#N l 40.6
CC(N)=O s -317.0
NC(N)=O s -333.1
NCC(=O)O s -528.1
CCl g -81.9
ClCCl l -124.2
ClC(Cl)Cl l -134.1
ClC(Cl)(Cl)Cl l -128.2
CCCl g -112.1
CCBr l -90.5
CCCCBr l -143.8
CI l -13.6
Clc1ccccc1 l 11.0
Brc1ccccc1 l 60.9
O=[N+]([O-])c1ccccc1 l 12.5
CS(C)=O l -204.2
CN(C)C=O l -239.3
OC1OC(CO)C(O)C(O)C1O s -1273.3
OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O s -2226.1
CCCCCCCCCCCCCCCC(=O)O s -891.5
`;

export interface ThermoEntry {
  key: string;
  phase: ThermoPhase;
  value: number;
}

function parse(table: string): ThermoEntry[] {
  return table
    .trim()
    .split('\n')
    .map((line) => {
      const [key, phase, value] = line.trim().split(/\s+/);
      return { key, phase: phase as ThermoPhase, value: Number(value) };
    });
}

export const INORGANIC_ENTHALPIES: ThermoEntry[] = parse(INORGANIC);
export const ORGANIC_ENTHALPIES: ThermoEntry[] = parse(ORGANIC);
export const THERMO_SOURCE = 'NBS-Tabellen (Wagman et al. 1982) und CRC Handbook, 25 °C, 1 bar';
