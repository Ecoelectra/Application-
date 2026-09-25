/**
 * Automatisch erzeugte Stoffe – nicht von Hand bearbeiten.
 *
 * Erzeugt mit `npm run stoffe` (scripts/build-substances.ts): alle natürlich
 * vorkommenden Elemente, Salze aus dem Ionenmodell, weitere anorganische
 * Stoffe, homologe Reihen, substituierte Benzole, Aminosäuren und
 * Heterocyclen. Formeln organischer Stoffe stammen aus RDKit. Stoffe der
 * Grundtabellen sind ausgelassen.
 *
 * 790 Stoffe.
 */
export const GENERATED_TABLE = String.raw`
Beryllium||Be||||Element|Erdalkalimetall (Gruppe 2, Periode 2)
Bor||B||||Element|Halbmetall (Gruppe 13, Periode 2)
Fluor||F2||||Element|Halogen (Gruppe 17, Periode 2)
Neon||Ne||||Element|Edelgas (Gruppe 18, Periode 2)
Scandium||Sc||||Element|Übergangsmetall (Gruppe 3, Periode 4)
Titan||Ti||||Element|Übergangsmetall (Gruppe 4, Periode 4)
Vanadium||V||||Element|Übergangsmetall (Gruppe 5, Periode 4)
Chrom||Cr||||Element|Übergangsmetall (Gruppe 6, Periode 4)
Mangan||Mn||||Element|Übergangsmetall (Gruppe 7, Periode 4)
Cobalt||Co||||Element|Übergangsmetall (Gruppe 9, Periode 4)
Gallium||Ga||||Element|Metall (Gruppe 13, Periode 4)
Germanium||Ge||||Element|Halbmetall (Gruppe 14, Periode 4)
Arsen||As||||Element|Halbmetall (Gruppe 15, Periode 4)
Selen||Se||||Element|Nichtmetall (Gruppe 16, Periode 4)
Krypton||Kr||||Element|Edelgas (Gruppe 18, Periode 4)
Rubidium||Rb||||Element|Alkalimetall (Gruppe 1, Periode 5)
Strontium||Sr||||Element|Erdalkalimetall (Gruppe 2, Periode 5)
Yttrium||Y||||Element|Übergangsmetall (Gruppe 3, Periode 5)
Zirconium||Zr||||Element|Übergangsmetall (Gruppe 4, Periode 5)
Niob||Nb||||Element|Übergangsmetall (Gruppe 5, Periode 5)
Molybdän||Mo||||Element|Übergangsmetall (Gruppe 6, Periode 5)
Technetium||Tc||||Element|Übergangsmetall (Gruppe 7, Periode 5); radioaktiv – nur in Speziallaboren
Ruthenium||Ru||||Element|Übergangsmetall (Gruppe 8, Periode 5)
Rhodium||Rh||||Element|Übergangsmetall (Gruppe 9, Periode 5)
Cadmium||Cd||||Element|Übergangsmetall (Gruppe 12, Periode 5)
Indium||In||||Element|Metall (Gruppe 13, Periode 5)
Antimon||Sb||||Element|Halbmetall (Gruppe 15, Periode 5)
Tellur||Te||||Element|Halbmetall (Gruppe 16, Periode 5)
Xenon||Xe||||Element|Edelgas (Gruppe 18, Periode 5)
Caesium||Cs||||Element|Alkalimetall (Gruppe 1, Periode 6)
Barium||Ba||||Element|Erdalkalimetall (Gruppe 2, Periode 6)
Lanthan||La||||Element|Lanthanoid (Gruppe 3, Periode 6)
Cer||Ce||||Element|Lanthanoid (Gruppe 3, Periode 6)
Praseodym||Pr||||Element|Lanthanoid (Gruppe 3, Periode 6)
Neodym||Nd||||Element|Lanthanoid (Gruppe 3, Periode 6)
Promethium||Pm||||Element|Lanthanoid (Gruppe 3, Periode 6); radioaktiv – nur in Speziallaboren
Samarium||Sm||||Element|Lanthanoid (Gruppe 3, Periode 6)
Europium||Eu||||Element|Lanthanoid (Gruppe 3, Periode 6)
Gadolinium||Gd||||Element|Lanthanoid (Gruppe 3, Periode 6)
Terbium||Tb||||Element|Lanthanoid (Gruppe 3, Periode 6)
Dysprosium||Dy||||Element|Lanthanoid (Gruppe 3, Periode 6)
Holmium||Ho||||Element|Lanthanoid (Gruppe 3, Periode 6)
Erbium||Er||||Element|Lanthanoid (Gruppe 3, Periode 6)
Thulium||Tm||||Element|Lanthanoid (Gruppe 3, Periode 6)
Ytterbium||Yb||||Element|Lanthanoid (Gruppe 3, Periode 6)
Lutetium||Lu||||Element|Lanthanoid (Gruppe 3, Periode 6)
Hafnium||Hf||||Element|Übergangsmetall (Gruppe 4, Periode 6)
Tantal||Ta||||Element|Übergangsmetall (Gruppe 5, Periode 6)
Wolfram||W||||Element|Übergangsmetall (Gruppe 6, Periode 6)
Rhenium||Re||||Element|Übergangsmetall (Gruppe 7, Periode 6)
Osmium||Os||||Element|Übergangsmetall (Gruppe 8, Periode 6)
Iridium||Ir||||Element|Übergangsmetall (Gruppe 9, Periode 6)
Thallium||Tl||||Element|Metall (Gruppe 13, Periode 6)
Bismut||Bi||||Element|Metall (Gruppe 15, Periode 6)
Polonium||Po||||Element|Halbmetall (Gruppe 16, Periode 6); radioaktiv – nur in Speziallaboren
Radon||Rn||||Element|Edelgas (Gruppe 18, Periode 6); radioaktiv – nur in Speziallaboren
Radium||Ra||||Element|Erdalkalimetall (Gruppe 2, Periode 7); radioaktiv – nur in Speziallaboren
Actinium||Ac||||Element|Actinoid (Gruppe 3, Periode 7); radioaktiv – nur in Speziallaboren
Thorium||Th||||Element|Actinoid (Gruppe 3, Periode 7); radioaktiv – nur in Speziallaboren
Protactinium||Pa||||Element|Actinoid (Gruppe 3, Periode 7); radioaktiv – nur in Speziallaboren
Uran||U||||Element|Actinoid (Gruppe 3, Periode 7); radioaktiv – nur in Speziallaboren
Lithiumfluorid||LiF||||Salz|Aus Li⁺ und F⁻, in Wasser löslich
Lithiumbromid||LiBr||||Salz|Aus Li⁺ und Br⁻, in Wasser löslich
Lithiumiodid||LiI||||Salz|Aus Li⁺ und I⁻, in Wasser löslich
Lithiumnitrat||LiNO3||||Salz|Aus Li⁺ und NO₃⁻, in Wasser löslich
Lithiumnitrit||LiNO2||||Salz|Aus Li⁺ und NO₂⁻, in Wasser löslich
Lithiumhydrogencarbonat||LiHCO3||||Salz|Aus Li⁺ und HCO₃⁻, in Wasser löslich
Lithiumhydrogensulfat||LiHSO4||||Salz|Aus Li⁺ und HSO₄⁻, in Wasser löslich
Lithiumdihydrogenphosphat||LiH2PO4||||Salz|Aus Li⁺ und H₂PO₄⁻, in Wasser löslich
Lithiumhypochlorit||LiClO||||Salz|Aus Li⁺ und ClO⁻, in Wasser löslich
Lithiumchlorat||LiClO3||||Salz|Aus Li⁺ und ClO₃⁻, in Wasser löslich
Lithiumperchlorat||LiClO4||||Salz|Aus Li⁺ und ClO₄⁻, in Wasser löslich
Lithiumpermanganat||LiMnO4||||Salz|Aus Li⁺ und MnO₄⁻, in Wasser löslich, Lösung violett
Lithiumthiocyanat||LiSCN||||Salz|Aus Li⁺ und SCN⁻, in Wasser löslich
Lithiumacetat||LiCH3COO||||Salz|Aus Li⁺ und CH₃COO⁻, in Wasser löslich
Lithiumiodat||LiIO3||||Salz|Aus Li⁺ und IO₃⁻, in Wasser löslich
Lithiumsulfid||Li2S||||Salz|Aus Li⁺ und S²⁻, in Wasser löslich
Lithiumsulfat||Li2SO4||||Salz|Aus Li⁺ und SO₄²⁻, in Wasser löslich
Lithiumsulfit||Li2SO3||||Salz|Aus Li⁺ und SO₃²⁻, in Wasser löslich
Lithiumthiosulfat||Li2S2O3||||Salz|Aus Li⁺ und S₂O₃²⁻, in Wasser löslich
Lithiumhydrogenphosphat||Li2HPO4||||Salz|Aus Li⁺ und HPO₄²⁻, in Wasser löslich
Lithiumchromat||Li2CrO4||||Salz|Aus Li⁺ und CrO₄²⁻, in Wasser löslich, Lösung gelb
Lithiumdichromat||Li2Cr2O7||||Salz|Aus Li⁺ und Cr₂O₇²⁻, in Wasser löslich, Lösung orange
Lithiumoxalat||Li2C2O4||||Salz|Aus Li⁺ und C₂O₄²⁻, in Wasser löslich
Lithiumsilicat||Li2SiO3||||Salz|Aus Li⁺ und SiO₃²⁻, in Wasser löslich
Lithiumperoxid||Li2O2||||Oxid|Aus Li⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Lithiumtetraborat||Li2B4O7||||Salz|Aus Li⁺ und B₄O₇²⁻, in Wasser löslich
Lithiumhydrid||LiH||||Salz|Aus Li⁺ und H⁻, reagiert mit Wasser unter Wasserstoffentwicklung
Lithiumamid||LiNH2||||Salz|Aus Li⁺ und NH₂⁻, reagiert heftig mit Wasser unter Ammoniakbildung
Lithiumcarbid||Li2C2||||Salz|Aus Li⁺ und C₂²⁻, reagiert mit Wasser unter Ethinbildung
Lithiumphosphat||Li3PO4||||Salz|Aus Li⁺ und PO₄³⁻, in Wasser löslich
Lithiumnitrid||Li3N||||Salz|Aus Li⁺ und N³⁻, reagiert mit Wasser unter Ammoniakbildung
Natriumchlorat||NaClO3||||Salz|Aus Na⁺ und ClO₃⁻, in Wasser löslich
Natriumperchlorat||NaClO4||||Salz|Aus Na⁺ und ClO₄⁻, in Wasser löslich
Natriumpermanganat||NaMnO4||||Salz|Aus Na⁺ und MnO₄⁻, in Wasser löslich, Lösung violett
Natriumthiocyanat||NaSCN||||Salz|Aus Na⁺ und SCN⁻, in Wasser löslich
Natriumiodat||NaIO3||||Salz|Aus Na⁺ und IO₃⁻, in Wasser löslich
Natriumchromat||Na2CrO4||||Salz|Aus Na⁺ und CrO₄²⁻, in Wasser löslich, Lösung gelb
Natriumdichromat||Na2Cr2O7||||Salz|Aus Na⁺ und Cr₂O₇²⁻, in Wasser löslich, Lösung orange
Natriumcarbid||Na2C2||||Salz|Aus Na⁺ und C₂²⁻, reagiert mit Wasser unter Ethinbildung
Kaliumfluorid||KF||||Salz|Aus K⁺ und F⁻, in Wasser löslich
Kaliumnitrit||KNO2||||Salz|Aus K⁺ und NO₂⁻, in Wasser löslich
Kaliumhydrogensulfat||KHSO4||||Salz|Aus K⁺ und HSO₄⁻, in Wasser löslich
Kaliumdihydrogenphosphat||KH2PO4||||Salz|Aus K⁺ und H₂PO₄⁻, in Wasser löslich
Kaliumhypochlorit||KClO||||Salz|Aus K⁺ und ClO⁻, in Wasser löslich
Kaliumperchlorat||KClO4||||Salz|Aus K⁺ und ClO₄⁻, in Wasser löslich
Kaliumsulfid||K2S||||Salz|Aus K⁺ und S²⁻, in Wasser löslich
Kaliumsulfit||K2SO3||||Salz|Aus K⁺ und SO₃²⁻, in Wasser löslich
Kaliumthiosulfat||K2S2O3||||Salz|Aus K⁺ und S₂O₃²⁻, in Wasser löslich
Kaliumhydrogenphosphat||K2HPO4||||Salz|Aus K⁺ und HPO₄²⁻, in Wasser löslich
Kaliumoxalat||K2C2O4||||Salz|Aus K⁺ und C₂O₄²⁻, in Wasser löslich
Kaliumsilicat||K2SiO3||||Salz|Aus K⁺ und SiO₃²⁻, in Wasser löslich
Kaliumperoxid||K2O2||||Oxid|Aus K⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Kaliumtetraborat||K2B4O7||||Salz|Aus K⁺ und B₄O₇²⁻, in Wasser löslich
Kaliumhydrid||KH||||Salz|Aus K⁺ und H⁻, reagiert mit Wasser unter Wasserstoffentwicklung
Kaliumamid||KNH2||||Salz|Aus K⁺ und NH₂⁻, reagiert heftig mit Wasser unter Ammoniakbildung
Kaliumcarbid||K2C2||||Salz|Aus K⁺ und C₂²⁻, reagiert mit Wasser unter Ethinbildung
Ammoniumfluorid||NH4F||||Salz|Aus NH₄⁺ und F⁻, in Wasser löslich
Ammoniumbromid||NH4Br||||Salz|Aus NH₄⁺ und Br⁻, in Wasser löslich
Ammoniumiodid||NH4I||||Salz|Aus NH₄⁺ und I⁻, in Wasser löslich
Ammoniumhydrogensulfat||NH4HSO4||||Salz|Aus NH₄⁺ und HSO₄⁻, in Wasser löslich
Ammoniumdihydrogenphosphat||NH4H2PO4||||Salz|Aus NH₄⁺ und H₂PO₄⁻, in Wasser löslich
Ammoniumthiocyanat||NH4SCN||||Salz|Aus NH₄⁺ und SCN⁻, in Wasser löslich
Ammoniumsulfid||(NH4)2S||||Salz|Aus NH₄⁺ und S²⁻, in Wasser löslich
Ammoniumsulfit||(NH4)2SO3||||Salz|Aus NH₄⁺ und SO₃²⁻, in Wasser löslich
Ammoniumthiosulfat||(NH4)2S2O3||||Salz|Aus NH₄⁺ und S₂O₃²⁻, in Wasser löslich
Ammoniumhydrogenphosphat||(NH4)2HPO4||||Salz|Aus NH₄⁺ und HPO₄²⁻, in Wasser löslich
Ammoniumoxalat||(NH4)2C2O4||||Salz|Aus NH₄⁺ und C₂O₄²⁻, in Wasser löslich
Ammoniumphosphat||(NH4)3PO4||||Salz|Aus NH₄⁺ und PO₄³⁻, in Wasser löslich
Silberfluorid||AgF||||Salz|Aus Ag⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Silbernitrit||AgNO2||||Salz|Aus Ag⁺ und NO₂⁻, in Wasser löslich
Silberthiocyanat||AgSCN||||Salz|Aus Ag⁺ und SCN⁻, in Wasser löslich
Silberacetat||AgCH3COO||||Salz|Aus Ag⁺ und CH₃COO⁻, in Wasser löslich
Silberiodat||AgIO3||||Salz|Aus Ag⁺ und IO₃⁻, in Wasser löslich
Silbercarbonat||Ag2CO3||||Salz|Aus Ag⁺ und CO₃²⁻, in Wasser unlöslich, Farbe weiß
Silberoxalat||Ag2C2O4||||Salz|Aus Ag⁺ und C₂O₄²⁻, in Wasser löslich
Kupfer(I)-thiocyanat||CuSCN||||Salz|Aus Cu⁺ und SCN⁻, in Wasser löslich
Kupfer(I)-acetat||CuCH3COO||||Salz|Aus Cu⁺ und CH₃COO⁻, in Wasser löslich
Magnesiumfluorid||MgF2||||Salz|Aus Mg²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Magnesiumbromid||MgBr2||||Salz|Aus Mg²⁺ und Br⁻, in Wasser löslich
Magnesiumiodid||MgI2||||Salz|Aus Mg²⁺ und I⁻, in Wasser löslich
Magnesiumdihydrogenphosphat||Mg(H2PO4)2||||Salz|Aus Mg²⁺ und H₂PO₄⁻, in Wasser löslich
Magnesiumchlorat||Mg(ClO3)2||||Salz|Aus Mg²⁺ und ClO₃⁻, in Wasser löslich
Magnesiumperchlorat||Mg(ClO4)2||||Salz|Aus Mg²⁺ und ClO₄⁻, in Wasser löslich
Magnesiumthiocyanat||Mg(SCN)2||||Salz|Aus Mg²⁺ und SCN⁻, in Wasser löslich
Magnesiumacetat||Mg(CH3COO)2||||Salz|Aus Mg²⁺ und CH₃COO⁻, in Wasser löslich
Magnesiumsulfid||MgS||||Salz|Aus Mg²⁺ und S²⁻, in Wasser löslich
Magnesiumsulfit||MgSO3||||Salz|Aus Mg²⁺ und SO₃²⁻, in Wasser unlöslich, Farbe weiß
Magnesiumthiosulfat||MgS2O3||||Salz|Aus Mg²⁺ und S₂O₃²⁻, in Wasser löslich
Magnesiumhydrogenphosphat||MgHPO4||||Salz|Aus Mg²⁺ und HPO₄²⁻, in Wasser löslich
Magnesiumoxalat||MgC2O4||||Salz|Aus Mg²⁺ und C₂O₄²⁻, in Wasser löslich
Magnesiumsilicat||MgSiO3||||Salz|Aus Mg²⁺ und SiO₃²⁻, in Wasser unlöslich, Farbe weiß
Magnesiumperoxid||MgO2||||Oxid|Aus Mg²⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Magnesiumhydrid||MgH2||||Salz|Aus Mg²⁺ und H⁻, reagiert mit Wasser unter Wasserstoffentwicklung
Magnesiumcarbid||MgC2||||Salz|Aus Mg²⁺ und C₂²⁻, reagiert mit Wasser unter Ethinbildung
Magnesiumphosphat||Mg3(PO4)2||||Salz|Aus Mg²⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Magnesiumnitrid||Mg3N2||||Salz|Aus Mg²⁺ und N³⁻, reagiert mit Wasser unter Ammoniakbildung
Calciumbromid||CaBr2||||Salz|Aus Ca²⁺ und Br⁻, in Wasser löslich
Calciumiodid||CaI2||||Salz|Aus Ca²⁺ und I⁻, in Wasser löslich
Calciumnitrit||Ca(NO2)2||||Salz|Aus Ca²⁺ und NO₂⁻, in Wasser löslich
Calciumdihydrogenphosphat||Ca(H2PO4)2||||Salz|Aus Ca²⁺ und H₂PO₄⁻, in Wasser löslich
Calciumhypochlorit||Ca(ClO)2||||Salz|Aus Ca²⁺ und ClO⁻, in Wasser löslich
Calciumchlorat||Ca(ClO3)2||||Salz|Aus Ca²⁺ und ClO₃⁻, in Wasser löslich
Calciumperchlorat||Ca(ClO4)2||||Salz|Aus Ca²⁺ und ClO₄⁻, in Wasser löslich
Calciumpermanganat||Ca(MnO4)2||||Salz|Aus Ca²⁺ und MnO₄⁻, in Wasser löslich, Lösung violett
Calciumthiocyanat||Ca(SCN)2||||Salz|Aus Ca²⁺ und SCN⁻, in Wasser löslich
Calciumacetat||Ca(CH3COO)2||||Salz|Aus Ca²⁺ und CH₃COO⁻, in Wasser löslich
Calciumiodat||Ca(IO3)2||||Salz|Aus Ca²⁺ und IO₃⁻, in Wasser löslich
Calciumsulfid||CaS||||Salz|Aus Ca²⁺ und S²⁻, in Wasser löslich
Calciumsulfit||CaSO3||||Salz|Aus Ca²⁺ und SO₃²⁻, in Wasser unlöslich, Farbe weiß
Calciumthiosulfat||CaS2O3||||Salz|Aus Ca²⁺ und S₂O₃²⁻, in Wasser löslich
Calciumhydrogenphosphat||CaHPO4||||Salz|Aus Ca²⁺ und HPO₄²⁻, in Wasser löslich
Calciumchromat||CaCrO4||||Salz|Aus Ca²⁺ und CrO₄²⁻, in Wasser löslich, Lösung gelb
Calciumsilicat||CaSiO3||||Salz|Aus Ca²⁺ und SiO₃²⁻, in Wasser unlöslich, Farbe weiß
Calciumperoxid||CaO2||||Oxid|Aus Ca²⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Calciumhydrid||CaH2||||Salz|Aus Ca²⁺ und H⁻, reagiert mit Wasser unter Wasserstoffentwicklung
Calciumnitrid||Ca3N2||||Salz|Aus Ca²⁺ und N³⁻, reagiert mit Wasser unter Ammoniakbildung
Bariumfluorid||BaF2||||Salz|Aus Ba²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Bariumbromid||BaBr2||||Salz|Aus Ba²⁺ und Br⁻, in Wasser löslich
Bariumiodid||BaI2||||Salz|Aus Ba²⁺ und I⁻, in Wasser löslich
Bariumnitrit||Ba(NO2)2||||Salz|Aus Ba²⁺ und NO₂⁻, in Wasser löslich
Bariumchlorat||Ba(ClO3)2||||Salz|Aus Ba²⁺ und ClO₃⁻, in Wasser löslich
Bariumperchlorat||Ba(ClO4)2||||Salz|Aus Ba²⁺ und ClO₄⁻, in Wasser löslich
Bariumpermanganat||Ba(MnO4)2||||Salz|Aus Ba²⁺ und MnO₄⁻, in Wasser löslich, Lösung violett
Bariumthiocyanat||Ba(SCN)2||||Salz|Aus Ba²⁺ und SCN⁻, in Wasser löslich
Bariumacetat||Ba(CH3COO)2||||Salz|Aus Ba²⁺ und CH₃COO⁻, in Wasser löslich
Bariumiodat||Ba(IO3)2||||Salz|Aus Ba²⁺ und IO₃⁻, in Wasser löslich
Bariumsulfid||BaS||||Salz|Aus Ba²⁺ und S²⁻, in Wasser löslich
Bariumsulfit||BaSO3||||Salz|Aus Ba²⁺ und SO₃²⁻, in Wasser unlöslich, Farbe weiß
Bariumthiosulfat||BaS2O3||||Salz|Aus Ba²⁺ und S₂O₃²⁻, in Wasser löslich
Bariumhydrogenphosphat||BaHPO4||||Salz|Aus Ba²⁺ und HPO₄²⁻, in Wasser löslich
Bariumoxalat||BaC2O4||||Salz|Aus Ba²⁺ und C₂O₄²⁻, in Wasser unlöslich, Farbe weiß
Bariumsilicat||BaSiO3||||Salz|Aus Ba²⁺ und SiO₃²⁻, in Wasser unlöslich, Farbe weiß
Bariumperoxid||BaO2||||Oxid|Aus Ba²⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Bariumhydrid||BaH2||||Salz|Aus Ba²⁺ und H⁻, reagiert mit Wasser unter Wasserstoffentwicklung
Bariumcarbid||BaC2||||Salz|Aus Ba²⁺ und C₂²⁻, reagiert mit Wasser unter Ethinbildung
Bariumphosphat||Ba3(PO4)2||||Salz|Aus Ba²⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Bariumnitrid||Ba3N2||||Salz|Aus Ba²⁺ und N³⁻, reagiert mit Wasser unter Ammoniakbildung
Strontiumfluorid||SrF2||||Salz|Aus Sr²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Strontiumchlorid||SrCl2||||Salz|Aus Sr²⁺ und Cl⁻, in Wasser löslich
Strontiumbromid||SrBr2||||Salz|Aus Sr²⁺ und Br⁻, in Wasser löslich
Strontiumiodid||SrI2||||Salz|Aus Sr²⁺ und I⁻, in Wasser löslich
Strontiumhydroxid||Sr(OH)2||||Base|Aus Sr²⁺ und OH⁻, in Wasser löslich
Strontiumnitrat||Sr(NO3)2||||Salz|Aus Sr²⁺ und NO₃⁻, in Wasser löslich
Strontiumnitrit||Sr(NO2)2||||Salz|Aus Sr²⁺ und NO₂⁻, in Wasser löslich
Strontiumchlorat||Sr(ClO3)2||||Salz|Aus Sr²⁺ und ClO₃⁻, in Wasser löslich
Strontiumperchlorat||Sr(ClO4)2||||Salz|Aus Sr²⁺ und ClO₄⁻, in Wasser löslich
Strontiumthiocyanat||Sr(SCN)2||||Salz|Aus Sr²⁺ und SCN⁻, in Wasser löslich
Strontiumacetat||Sr(CH3COO)2||||Salz|Aus Sr²⁺ und CH₃COO⁻, in Wasser löslich
Strontiumiodat||Sr(IO3)2||||Salz|Aus Sr²⁺ und IO₃⁻, in Wasser löslich
Strontiumoxid||SrO||||Oxid|Aus Sr²⁺ und O²⁻, reagiert mit Wasser zum Hydroxid
Strontiumsulfid||SrS||||Salz|Aus Sr²⁺ und S²⁻, in Wasser löslich
Strontiumsulfat||SrSO4||||Salz|Aus Sr²⁺ und SO₄²⁻, in Wasser unlöslich, Farbe weiß
Strontiumsulfit||SrSO3||||Salz|Aus Sr²⁺ und SO₃²⁻, in Wasser unlöslich, Farbe weiß
Strontiumthiosulfat||SrS2O3||||Salz|Aus Sr²⁺ und S₂O₃²⁻, in Wasser löslich
Strontiumcarbonat||SrCO3||||Salz|Aus Sr²⁺ und CO₃²⁻, in Wasser unlöslich, Farbe weiß
Strontiumhydrogenphosphat||SrHPO4||||Salz|Aus Sr²⁺ und HPO₄²⁻, in Wasser löslich
Strontiumchromat||SrCrO4||||Salz|Aus Sr²⁺ und CrO₄²⁻, in Wasser löslich, Lösung gelb
Strontiumoxalat||SrC2O4||||Salz|Aus Sr²⁺ und C₂O₄²⁻, in Wasser löslich
Strontiumperoxid||SrO2||||Oxid|Aus Sr²⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Strontiumhydrid||SrH2||||Salz|Aus Sr²⁺ und H⁻, reagiert mit Wasser unter Wasserstoffentwicklung
Strontiumcarbid||SrC2||||Salz|Aus Sr²⁺ und C₂²⁻, reagiert mit Wasser unter Ethinbildung
Strontiumphosphat||Sr3(PO4)2||||Salz|Aus Sr²⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Strontiumnitrid||Sr3N2||||Salz|Aus Sr²⁺ und N³⁻, reagiert mit Wasser unter Ammoniakbildung
Zinkfluorid||ZnF2||||Salz|Aus Zn²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Zinkbromid||ZnBr2||||Salz|Aus Zn²⁺ und Br⁻, in Wasser löslich
Zinkiodid||ZnI2||||Salz|Aus Zn²⁺ und I⁻, in Wasser löslich
Zinkthiocyanat||Zn(SCN)2||||Salz|Aus Zn²⁺ und SCN⁻, in Wasser löslich
Zinkacetat||Zn(CH3COO)2||||Salz|Aus Zn²⁺ und CH₃COO⁻, in Wasser löslich
Zinksulfit||ZnSO3||||Salz|Aus Zn²⁺ und SO₃²⁻, in Wasser unlöslich, Farbe weiß
Zinkchromat||ZnCrO4||||Salz|Aus Zn²⁺ und CrO₄²⁻, in Wasser löslich, Lösung gelb
Zinkoxalat||ZnC2O4||||Salz|Aus Zn²⁺ und C₂O₄²⁻, in Wasser löslich
Zinksilicat||ZnSiO3||||Salz|Aus Zn²⁺ und SiO₃²⁻, in Wasser unlöslich, Farbe weiß
Zinkperoxid||ZnO2||||Oxid|Aus Zn²⁺ und O₂²⁻, reagiert mit Wasser unter Bildung von Wasserstoffperoxid und Sauerstoff
Zinkphosphat||Zn3(PO4)2||||Salz|Aus Zn²⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Eisen(II)-fluorid||FeF2||||Salz|Aus Fe²⁺ und F⁻, in Wasser unlöslich
Eisen(II)-bromid||FeBr2||||Salz|Aus Fe²⁺ und Br⁻, in Wasser löslich, Lösung blassgrün
Eisen(II)-iodid||FeI2||||Salz|Aus Fe²⁺ und I⁻, in Wasser löslich, Lösung blassgrün
Eisen(II)-nitrat||Fe(NO3)2||||Salz|Aus Fe²⁺ und NO₃⁻, in Wasser löslich, Lösung blassgrün
Eisen(II)-thiocyanat||Fe(SCN)2||||Salz|Aus Fe²⁺ und SCN⁻, in Wasser löslich, Lösung blassgrün
Eisen(II)-acetat||Fe(CH3COO)2||||Salz|Aus Fe²⁺ und CH₃COO⁻, in Wasser löslich, Lösung blassgrün
Eisen(II)-carbonat||FeCO3||||Salz|Aus Fe²⁺ und CO₃²⁻, in Wasser unlöslich
Eisen(II)-oxalat||FeC2O4||||Salz|Aus Fe²⁺ und C₂O₄²⁻, in Wasser löslich, Lösung blassgrün
Eisen(II)-phosphat||Fe3(PO4)2||||Salz|Aus Fe²⁺ und PO₄³⁻, in Wasser unlöslich
Kupfer(II)-fluorid||CuF2||||Salz|Aus Cu²⁺ und F⁻, in Wasser unlöslich
Kupfer(II)-bromid||CuBr2||||Salz|Aus Cu²⁺ und Br⁻, in Wasser löslich, Lösung blau
Kupfer(II)-thiocyanat||Cu(SCN)2||||Salz|Aus Cu²⁺ und SCN⁻, in Wasser löslich, Lösung blau
Kupfer(II)-carbonat||CuCO3||||Salz|Aus Cu²⁺ und CO₃²⁻, in Wasser unlöslich
Kupfer(II)-oxalat||CuC2O4||||Salz|Aus Cu²⁺ und C₂O₄²⁻, in Wasser löslich, Lösung blau
Kupfer(II)-phosphat||Cu3(PO4)2||||Salz|Aus Cu²⁺ und PO₄³⁻, in Wasser unlöslich
Nickel(II)-fluorid||NiF2||||Salz|Aus Ni²⁺ und F⁻, in Wasser unlöslich
Nickel(II)-bromid||NiBr2||||Salz|Aus Ni²⁺ und Br⁻, in Wasser löslich, Lösung grün
Nickel(II)-iodid||NiI2||||Salz|Aus Ni²⁺ und I⁻, in Wasser löslich, Lösung grün
Nickel(II)-hydroxid||Ni(OH)2||||Base|Aus Ni²⁺ und OH⁻, in Wasser unlöslich, Farbe grün
Nickel(II)-thiocyanat||Ni(SCN)2||||Salz|Aus Ni²⁺ und SCN⁻, in Wasser löslich, Lösung grün
Nickel(II)-acetat||Ni(CH3COO)2||||Salz|Aus Ni²⁺ und CH₃COO⁻, in Wasser löslich, Lösung grün
Nickel(II)-oxid||NiO||||Oxid|Aus Ni²⁺ und O²⁻, in Wasser unlöslich
Nickel(II)-sulfid||NiS||||Salz|Aus Ni²⁺ und S²⁻, in Wasser unlöslich, Farbe schwarz
Nickel(II)-carbonat||NiCO3||||Salz|Aus Ni²⁺ und CO₃²⁻, in Wasser unlöslich
Nickel(II)-oxalat||NiC2O4||||Salz|Aus Ni²⁺ und C₂O₄²⁻, in Wasser löslich, Lösung grün
Nickel(II)-phosphat||Ni3(PO4)2||||Salz|Aus Ni²⁺ und PO₄³⁻, in Wasser unlöslich
Cobalt(II)-fluorid||CoF2||||Salz|Aus Co²⁺ und F⁻, in Wasser unlöslich
Cobalt(II)-bromid||CoBr2||||Salz|Aus Co²⁺ und Br⁻, in Wasser löslich, Lösung rosa
Cobalt(II)-iodid||CoI2||||Salz|Aus Co²⁺ und I⁻, in Wasser löslich, Lösung rosa
Cobalt(II)-hydroxid||Co(OH)2||||Base|Aus Co²⁺ und OH⁻, in Wasser unlöslich, Farbe blau
Cobalt(II)-thiocyanat||Co(SCN)2||||Salz|Aus Co²⁺ und SCN⁻, in Wasser löslich, Lösung rosa
Cobalt(II)-acetat||Co(CH3COO)2||||Salz|Aus Co²⁺ und CH₃COO⁻, in Wasser löslich, Lösung rosa
Cobalt(II)-oxid||CoO||||Oxid|Aus Co²⁺ und O²⁻, in Wasser unlöslich
Cobalt(II)-sulfid||CoS||||Salz|Aus Co²⁺ und S²⁻, in Wasser unlöslich, Farbe schwarz
Cobalt(II)-sulfat||CoSO4||||Salz|Aus Co²⁺ und SO₄²⁻, in Wasser löslich, Lösung rosa
Cobalt(II)-carbonat||CoCO3||||Salz|Aus Co²⁺ und CO₃²⁻, in Wasser unlöslich
Cobalt(II)-oxalat||CoC2O4||||Salz|Aus Co²⁺ und C₂O₄²⁻, in Wasser löslich, Lösung rosa
Cobalt(II)-phosphat||Co3(PO4)2||||Salz|Aus Co²⁺ und PO₄³⁻, in Wasser unlöslich
Mangan(II)-fluorid||MnF2||||Salz|Aus Mn²⁺ und F⁻, in Wasser unlöslich
Mangan(II)-bromid||MnBr2||||Salz|Aus Mn²⁺ und Br⁻, in Wasser löslich, Lösung blassrosa
Mangan(II)-iodid||MnI2||||Salz|Aus Mn²⁺ und I⁻, in Wasser löslich, Lösung blassrosa
Mangan(II)-hydroxid||Mn(OH)2||||Base|Aus Mn²⁺ und OH⁻, in Wasser unlöslich, Farbe blassrosa
Mangan(II)-nitrat||Mn(NO3)2||||Salz|Aus Mn²⁺ und NO₃⁻, in Wasser löslich, Lösung blassrosa
Mangan(II)-thiocyanat||Mn(SCN)2||||Salz|Aus Mn²⁺ und SCN⁻, in Wasser löslich, Lösung blassrosa
Mangan(II)-acetat||Mn(CH3COO)2||||Salz|Aus Mn²⁺ und CH₃COO⁻, in Wasser löslich, Lösung blassrosa
Mangan(II)-oxid||MnO||||Oxid|Aus Mn²⁺ und O²⁻, in Wasser unlöslich
Mangan(II)-sulfid||MnS||||Salz|Aus Mn²⁺ und S²⁻, in Wasser unlöslich, Farbe fleischfarben
Mangan(II)-carbonat||MnCO3||||Salz|Aus Mn²⁺ und CO₃²⁻, in Wasser unlöslich
Mangan(II)-oxalat||MnC2O4||||Salz|Aus Mn²⁺ und C₂O₄²⁻, in Wasser löslich, Lösung blassrosa
Mangan(II)-phosphat||Mn3(PO4)2||||Salz|Aus Mn²⁺ und PO₄³⁻, in Wasser unlöslich
Blei(II)-fluorid||PbF2||||Salz|Aus Pb²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Blei(II)-bromid||PbBr2||||Salz|Aus Pb²⁺ und Br⁻, in Wasser schwer löslich, Farbe weiß
Blei(II)-hydroxid||Pb(OH)2||||Base|Aus Pb²⁺ und OH⁻, in Wasser unlöslich, Farbe weiß
Blei(II)-thiocyanat||Pb(SCN)2||||Salz|Aus Pb²⁺ und SCN⁻, in Wasser löslich
Blei(II)-iodat||Pb(IO3)2||||Salz|Aus Pb²⁺ und IO₃⁻, in Wasser löslich
Blei(II)-carbonat||PbCO3||||Salz|Aus Pb²⁺ und CO₃²⁻, in Wasser unlöslich, Farbe weiß
Blei(II)-oxalat||PbC2O4||||Salz|Aus Pb²⁺ und C₂O₄²⁻, in Wasser unlöslich, Farbe weiß
Blei(II)-silicat||PbSiO3||||Salz|Aus Pb²⁺ und SiO₃²⁻, in Wasser unlöslich, Farbe weiß
Blei(II)-phosphat||Pb3(PO4)2||||Salz|Aus Pb²⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Zinn(II)-fluorid||SnF2||||Salz|Aus Sn²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Zinn(II)-bromid||SnBr2||||Salz|Aus Sn²⁺ und Br⁻, in Wasser löslich
Zinn(II)-iodid||SnI2||||Salz|Aus Sn²⁺ und I⁻, in Wasser löslich
Zinn(II)-hydroxid||Sn(OH)2||||Base|Aus Sn²⁺ und OH⁻, in Wasser unlöslich, Farbe weiß
Zinn(II)-acetat||Sn(CH3COO)2||||Salz|Aus Sn²⁺ und CH₃COO⁻, in Wasser löslich
Zinn(II)-oxid||SnO||||Oxid|Aus Sn²⁺ und O²⁻, in Wasser unlöslich
Zinn(II)-sulfid||SnS||||Salz|Aus Sn²⁺ und S²⁻, in Wasser unlöslich, Farbe braun
Zinn(II)-sulfat||SnSO4||||Salz|Aus Sn²⁺ und SO₄²⁻, in Wasser löslich
Zinn(II)-oxalat||SnC2O4||||Salz|Aus Sn²⁺ und C₂O₄²⁻, in Wasser löslich
Quecksilber(II)-fluorid||HgF2||||Salz|Aus Hg²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Quecksilber(II)-chlorid||HgCl2||||Salz|Aus Hg²⁺ und Cl⁻, in Wasser unlöslich, Farbe weiß
Quecksilber(II)-bromid||HgBr2||||Salz|Aus Hg²⁺ und Br⁻, in Wasser löslich
Quecksilber(II)-iodid||HgI2||||Salz|Aus Hg²⁺ und I⁻, in Wasser unlöslich, Farbe orangerot
Quecksilber(II)-nitrat||Hg(NO3)2||||Salz|Aus Hg²⁺ und NO₃⁻, in Wasser löslich
Quecksilber(II)-thiocyanat||Hg(SCN)2||||Salz|Aus Hg²⁺ und SCN⁻, in Wasser löslich
Quecksilber(II)-acetat||Hg(CH3COO)2||||Salz|Aus Hg²⁺ und CH₃COO⁻, in Wasser löslich
Quecksilber(II)-sulfid||HgS||||Salz|Aus Hg²⁺ und S²⁻, in Wasser unlöslich, Farbe schwarz
Quecksilber(II)-sulfat||HgSO4||||Salz|Aus Hg²⁺ und SO₄²⁻, in Wasser löslich
Cadmiumfluorid||CdF2||||Salz|Aus Cd²⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Cadmiumchlorid||CdCl2||||Salz|Aus Cd²⁺ und Cl⁻, in Wasser löslich
Cadmiumbromid||CdBr2||||Salz|Aus Cd²⁺ und Br⁻, in Wasser löslich
Cadmiumiodid||CdI2||||Salz|Aus Cd²⁺ und I⁻, in Wasser löslich
Cadmiumhydroxid||Cd(OH)2||||Base|Aus Cd²⁺ und OH⁻, in Wasser unlöslich, Farbe weiß
Cadmiumnitrat||Cd(NO3)2||||Salz|Aus Cd²⁺ und NO₃⁻, in Wasser löslich
Cadmiumthiocyanat||Cd(SCN)2||||Salz|Aus Cd²⁺ und SCN⁻, in Wasser löslich
Cadmiumacetat||Cd(CH3COO)2||||Salz|Aus Cd²⁺ und CH₃COO⁻, in Wasser löslich
Cadmiumoxid||CdO||||Oxid|Aus Cd²⁺ und O²⁻, in Wasser unlöslich
Cadmiumsulfid||CdS||||Salz|Aus Cd²⁺ und S²⁻, in Wasser unlöslich, Farbe gelb
Cadmiumsulfat||CdSO4||||Salz|Aus Cd²⁺ und SO₄²⁻, in Wasser löslich
Cadmiumcarbonat||CdCO3||||Salz|Aus Cd²⁺ und CO₃²⁻, in Wasser unlöslich, Farbe weiß
Cadmiumoxalat||CdC2O4||||Salz|Aus Cd²⁺ und C₂O₄²⁻, in Wasser löslich
Cadmiumphosphat||Cd3(PO4)2||||Salz|Aus Cd²⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Eisen(III)-fluorid||FeF3||||Salz|Aus Fe³⁺ und F⁻, in Wasser unlöslich
Eisen(III)-bromid||FeBr3||||Salz|Aus Fe³⁺ und Br⁻, in Wasser löslich, Lösung gelbbraun
Eisen(III)-thiocyanat||Fe(SCN)3||||Salz|Aus Fe³⁺ und SCN⁻, in Wasser löslich, Lösung gelbbraun
Eisen(III)-acetat||Fe(CH3COO)3||||Salz|Aus Fe³⁺ und CH₃COO⁻, in Wasser löslich, Lösung gelbbraun
Eisen(III)-oxalat||Fe2(C2O4)3||||Salz|Aus Fe³⁺ und C₂O₄²⁻, in Wasser löslich, Lösung gelbbraun
Eisen(III)-phosphat||FePO4||||Salz|Aus Fe³⁺ und PO₄³⁻, in Wasser unlöslich
Aluminiumfluorid||AlF3||||Salz|Aus Al³⁺ und F⁻, in Wasser unlöslich, Farbe weiß
Aluminiumbromid||AlBr3||||Salz|Aus Al³⁺ und Br⁻, in Wasser löslich
Aluminiumiodid||AlI3||||Salz|Aus Al³⁺ und I⁻, in Wasser löslich
Aluminiumacetat||Al(CH3COO)3||||Salz|Aus Al³⁺ und CH₃COO⁻, in Wasser löslich
Aluminiumsulfid||Al2S3||||Salz|Aus Al³⁺ und S²⁻, in Wasser löslich
Aluminiumoxalat||Al2(C2O4)3||||Salz|Aus Al³⁺ und C₂O₄²⁻, in Wasser löslich
Aluminiumphosphat||AlPO4||||Salz|Aus Al³⁺ und PO₄³⁻, in Wasser unlöslich, Farbe weiß
Aluminiumnitrid||AlN||||Salz|Aus Al³⁺ und N³⁻, reagiert mit Wasser unter Ammoniakbildung
Chrom(III)-fluorid||CrF3||||Salz|Aus Cr³⁺ und F⁻, in Wasser unlöslich
Chrom(III)-bromid||CrBr3||||Salz|Aus Cr³⁺ und Br⁻, in Wasser löslich, Lösung grün
Chrom(III)-iodid||CrI3||||Salz|Aus Cr³⁺ und I⁻, in Wasser löslich, Lösung grün
Chrom(III)-hydroxid||Cr(OH)3||||Base|Aus Cr³⁺ und OH⁻, in Wasser unlöslich, Farbe graugrün
Chrom(III)-nitrat||Cr(NO3)3||||Salz|Aus Cr³⁺ und NO₃⁻, in Wasser löslich, Lösung grün
Chrom(III)-acetat||Cr(CH3COO)3||||Salz|Aus Cr³⁺ und CH₃COO⁻, in Wasser löslich, Lösung grün
Chrom(III)-sulfid||Cr2S3||||Salz|Aus Cr³⁺ und S²⁻, in Wasser löslich, Lösung grün
Chrom(III)-sulfat||Cr2(SO4)3||||Salz|Aus Cr³⁺ und SO₄²⁻, in Wasser löslich, Lösung grün
Chrom(III)-phosphat||CrPO4||||Salz|Aus Cr³⁺ und PO₄³⁻, in Wasser unlöslich
Salpetrige Säure||HNO2||||Säure|Nur in verdünnter Lösung beständig, zerfällt zu NO und NO2
Hypochlorige Säure||HClO||||Säure|Schwache Säure des Chlorwassers, bleichend
Chlorsäure||HClO3||||Säure|Starke Säure und starkes Oxidationsmittel, nur in Lösung
Perchlorsäure||HClO4||||Säure|Eine der stärksten Säuren; konzentriert mit organischen Stoffen explosionsgefährlich
Iodsäure||HIO3||||Säure|Feste, mittelstarke Säure und Oxidationsmittel
Thiocyansäure||HSCN||||Säure|Starke Säure, nur in verdünnter Lösung beständig
Kieselsäure||H2SiO3||||Säure|Sehr schwache Säure, geht in Kieselgel über
Chromsäure||H2CrO4||||Säure|Entsteht aus Chromtrioxid und Wasser; krebserzeugend
Phosphortrichlorid||PCl3||||Nichtmetallverbindung|Farblose, an feuchter Luft rauchende Flüssigkeit; Chlorierungsmittel
Phosphorpentachlorid||PCl5||||Nichtmetallverbindung|Chlorierungsmittel, macht aus Carbonsäuren Säurechloride
Siliciumtetrachlorid||SiCl4||||Nichtmetallverbindung|Hydrolysiert an feuchter Luft zu Kieselsäure und HCl
Bortrifluorid||BF3||||Nichtmetallverbindung|Gasförmige Lewis-Säure, Katalysator
Bortrichlorid||BCl3||||Nichtmetallverbindung|Lewis-Säure, spaltet Ether
Schwefelhexafluorid||SF6||||Gas|Reaktionsträges, sehr schweres Isoliergas
Dischwefeldichlorid||S2Cl2||||Nichtmetallverbindung|Gelbe Flüssigkeit, Vulkanisationsmittel
Phosphan||PH3||||Gas|Sehr giftiges Gas
Silan||SiH4||||Gas|Selbstentzündliches Gas
Distickstofftetroxid||N2O4||||Gas|Dimer von NO2, farblos; Gleichgewicht mit braunem NO2
Distickstoffpentoxid||N2O5||||Oxid|Anhydrid der Salpetersäure
Chlordioxid||ClO2||||Gas|Gelbes Gas, Bleich- und Desinfektionsmittel
Iodmonochlorid||ICl||||Nichtmetallverbindung|Interhalogenverbindung, Wijs-Lösung zur Iodzahl
Titan(IV)-chlorid||TiCl4||||Salz|Raucht an feuchter Luft, Ziegler-Natta-Katalysator
Zinn(IV)-chlorid||SnCl4||||Salz|Lewis-Säure, raucht an feuchter Luft
Zinn(IV)-oxid||SnO2||||Oxid|Weißes Pigment und Poliermittel
Vanadium(V)-oxid||V2O5||||Oxid|Katalysator des Kontaktverfahrens
Chrom(VI)-oxid||CrO3||||Oxid|Starkes Oxidationsmittel, krebserzeugend
Wolfram(VI)-oxid||WO3||||Oxid|Gelbes Oxid, elektrochrome Schichten
Molybdän(VI)-oxid||MoO3||||Oxid|Katalysator
Zirconium(IV)-oxid||ZrO2||||Oxid|Keramik, Diamantimitat
Cer(IV)-oxid||CeO2||||Oxid|Poliermittel und Katalysator
Arsen(III)-oxid||As2O3||||Oxid|Sehr giftig («Arsenik»)
Antimon(III)-chlorid||SbCl3||||Salz|Lewis-Säure
Bismut(III)-chlorid||BiCl3||||Salz|Hydrolysiert zu Bismutoxidchlorid
Bismut(III)-nitrat||Bi(NO3)3||||Salz|Bestandteil des Dragendorff-Reagenzes
Gold(III)-chlorid||AuCl3||||Salz|Gelbes Goldsalz
Platin(IV)-chlorid||PtCl4||||Salz|Ausgangsstoff für Platinkatalysatoren
Rhodium(III)-chlorid||RhCl3||||Salz|Ausgangsstoff für Wilkinson-Katalysator
Ruthenium(III)-chlorid||RuCl3||||Salz|Oxidationskatalysator
Iridium(III)-chlorid||IrCl3||||Salz|Katalysatorvorstufe
Gallium(III)-chlorid||GaCl3||||Salz|Lewis-Säure
Indium(III)-chlorid||InCl3||||Salz|Milde Lewis-Säure
Cer(III)-chlorid||CeCl3||||Salz|Luche-Reduktion mit NaBH4
Lanthan(III)-chlorid||LaCl3||||Salz|Lanthanoidsalz
Vanadium(III)-chlorid||VCl3||||Salz|Reduktionsmittel
Zirconium(IV)-chlorid||ZrCl4||||Salz|Lewis-Säure
Molybdän(V)-chlorid||MoCl5||||Salz|Chlorierungs- und Oxidationsmittel
Wolfram(VI)-chlorid||WCl6||||Salz|Katalysator der Olefinmetathese
Titan(III)-chlorid||TiCl3||||Salz|Violettes Reduktionsmittel
Cer(IV)-sulfat||Ce(SO4)2||||Salz|Maßlösung der Cerimetrie
Ammoniumcer(IV)-nitrat||(NH4)2Ce(NO3)6||||Salz|Oxidationsmittel (CAN)
Kaliumbromat||KBrO3||||Salz|Oxidationsmittel der Bromatometrie
Natriumbromat||NaBrO3||||Salz|Oxidationsmittel
Natriumperiodat||NaIO4||||Salz|Spaltet vicinale Diole (Malaprade-Reaktion)
Kaliumperoxodisulfat||K2S2O8||||Salz|Radikalstarter und Oxidationsmittel
Ammoniumperoxodisulfat||(NH4)2S2O8||||Salz|Radikalstarter für Polymerisationen
Natriumdisulfit||Na2S2O5||||Salz|Reduktions- und Konservierungsmittel
Natriumdithionit||Na2S2O4||||Reduktionsmittel|Starkes Reduktionsmittel für Küpenfarbstoffe
Natriummolybdat||Na2MoO4||||Salz|Nachweis von Phosphat
Natriumwolframat||Na2WO4||||Salz|Oxidationskatalysator
Natriumaluminat||NaAlO2||||Salz|Entsteht beim Lösen von Aluminium in Natronlauge
Natriumzinkat||Na2[Zn(OH)4]||||Salz|Entsteht beim Lösen von Zink in Natronlauge
Hydroxylammoniumchlorid||NH3OHCl||||Salz|Handhabbare Form des Hydroxylamins
Hydraziniumsulfat||N2H6SO4||||Salz|Handhabbare Form des Hydrazins
Ammoniumeisen(II)-sulfat||(NH4)2Fe(SO4)2·6H2O||||Salz|Mohrsches Salz, luftbeständige Fe²⁺-Urtitersubstanz
Brommethan|Methylbromid|CH3Br|CBr|||Halogenverbindung|Halogenalkan mit 1 C-Atomen
Fluormethan|Methylfluorid|CH3F|CF|||Halogenverbindung|Halogenalkan mit 1 C-Atomen
Chlorethan|Ethylchlorid|C2H5Cl|CCCl|||Halogenverbindung|Halogenalkan mit 2 C-Atomen
Fluorethan|Ethylfluorid|C2H5F|CCF|||Halogenverbindung|Halogenalkan mit 2 C-Atomen
Propanamid||C3H7NO|CCC(N)=O|||Amid|Carbonsäureamid mit 3 C-Atomen
1-Chlorpropan|Propylchlorid|C3H7Cl|CCCCl|||Halogenverbindung|Halogenalkan mit 3 C-Atomen
1-Fluorpropan|Propylfluorid|C3H7F|CCCF|||Halogenverbindung|Halogenalkan mit 3 C-Atomen
Dipropylether||C6H14O|CCCOCCC|||Ether|Symmetrischer Ether aus zwei Propylgruppen
But-1-in|1-Butin|C4H6|C#CCC|||Alkin|Endständiges Alkin mit 4 C-Atomen
Butanamid||C4H9NO|CCCC(N)=O|||Amid|Carbonsäureamid mit 4 C-Atomen
1-Fluorbutan|Butylfluorid|C4H9F|CCCCF|||Halogenverbindung|Halogenalkan mit 4 C-Atomen
Dibutylether||C8H18O|CCCCOCCCC|||Ether|Symmetrischer Ether aus zwei Butylgruppen
Pent-1-in|1-Pentin|C5H8|C#CCCC|||Alkin|Endständiges Alkin mit 5 C-Atomen
Pentan-2-ol|sec-Pentylalkohol|C5H12O|CC(O)CCC|||Alkohol|Sekundärer Alkohol mit 5 C-Atomen
Pentan-1-amin|Pentylamin|C5H13N|CCCCCN|||Amin|Primäres Amin mit 5 C-Atomen
Pentanamid||C5H11NO|CCCCC(N)=O|||Amid|Carbonsäureamid mit 5 C-Atomen
1-Chlorpentan|Pentylchlorid|C5H11Cl|CCCCCCl|||Halogenverbindung|Halogenalkan mit 5 C-Atomen
1-Brompentan|Pentylbromid|C5H11Br|CCCCCBr|||Halogenverbindung|Halogenalkan mit 5 C-Atomen
1-Iodpentan|Pentyliodid|C5H11I|CCCCCI|||Halogenverbindung|Halogenalkan mit 5 C-Atomen
1-Fluorpentan|Pentylfluorid|C5H11F|CCCCCF|||Halogenverbindung|Halogenalkan mit 5 C-Atomen
Dipentylether||C10H22O|CCCCCOCCCCC|||Ether|Symmetrischer Ether aus zwei Pentylgruppen
Hexan-2-ol|sec-Hexylalkohol|C6H14O|CC(O)CCCC|||Alkohol|Sekundärer Alkohol mit 6 C-Atomen
Hexan-2-on|Methylbutylketon|C6H12O|CC(=O)CCCC|||Keton|Methylketon mit 6 C-Atomen
Hexan-3-on|Ethylpropylketon|C6H12O|CCC(=O)CCC|||Keton|Keton mit 6 C-Atomen
Hexan-1-amin|Hexylamin|C6H15N|CCCCCCN|||Amin|Primäres Amin mit 6 C-Atomen
Hexanamid||C6H13NO|CCCCCC(N)=O|||Amid|Carbonsäureamid mit 6 C-Atomen
1-Chlorhexan|Hexylchlorid|C6H13Cl|CCCCCCCl|||Halogenverbindung|Halogenalkan mit 6 C-Atomen
1-Iodhexan|Hexyliodid|C6H13I|CCCCCCI|||Halogenverbindung|Halogenalkan mit 6 C-Atomen
1-Fluorhexan|Hexylfluorid|C6H13F|CCCCCCF|||Halogenverbindung|Halogenalkan mit 6 C-Atomen
Hexannitril|Pentylcyanid|C6H11N|CCCCCC#N|||Nitril|Nitril mit 6 C-Atomen
Dihexylether||C12H26O|CCCCCCOCCCCCC|||Ether|Symmetrischer Ether aus zwei Hexylgruppen
Hept-1-en|1-Hepten|C7H14|C=CCCCCC|||Alken|Endständiges Alken mit 7 C-Atomen
Hept-1-in|1-Heptin|C7H12|C#CCCCCC|||Alkin|Endständiges Alkin mit 7 C-Atomen
Heptan-1-ol|Heptylalkohol;1-Heptanol|C7H16O|CCCCCCCO|||Alkohol|Primärer Alkohol mit 7 C-Atomen
Heptanal|Heptylaldehyd|C7H14O|CCCCCCC=O|||Aldehyd|Aldehyd mit 7 C-Atomen
Heptansäure|Önanthsäure|C7H14O2|CCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 7 C-Atomen
Heptan-2-ol|sec-Heptylalkohol|C7H16O|CC(O)CCCCC|||Alkohol|Sekundärer Alkohol mit 7 C-Atomen
Heptan-2-on|Methylpentylketon|C7H14O|CC(=O)CCCCC|||Keton|Methylketon mit 7 C-Atomen
Heptan-3-on|Ethylbutylketon|C7H14O|CCC(=O)CCCC|||Keton|Keton mit 7 C-Atomen
Heptan-1-amin|Heptylamin|C7H17N|CCCCCCCN|||Amin|Primäres Amin mit 7 C-Atomen
Heptanamid||C7H15NO|CCCCCCC(N)=O|||Amid|Carbonsäureamid mit 7 C-Atomen
1-Chlorheptan|Heptylchlorid|C7H15Cl|CCCCCCCCl|||Halogenverbindung|Halogenalkan mit 7 C-Atomen
1-Bromheptan|Heptylbromid|C7H15Br|CCCCCCCBr|||Halogenverbindung|Halogenalkan mit 7 C-Atomen
1-Iodheptan|Heptyliodid|C7H15I|CCCCCCCI|||Halogenverbindung|Halogenalkan mit 7 C-Atomen
1-Fluorheptan|Heptylfluorid|C7H15F|CCCCCCCF|||Halogenverbindung|Halogenalkan mit 7 C-Atomen
Heptannitril|Hexylcyanid|C7H13N|CCCCCCC#N|||Nitril|Nitril mit 7 C-Atomen
Diheptylether||C14H30O|CCCCCCCOCCCCCCC|||Ether|Symmetrischer Ether aus zwei Heptylgruppen
Oct-1-in|1-Octin|C8H14|C#CCCCCCC|||Alkin|Endständiges Alkin mit 8 C-Atomen
Octanal|Octylaldehyd|C8H16O|CCCCCCCC=O|||Aldehyd|Aldehyd mit 8 C-Atomen
Octan-2-ol|sec-Octylalkohol|C8H18O|CC(O)CCCCCC|||Alkohol|Sekundärer Alkohol mit 8 C-Atomen
Octan-2-on|Methylhexylketon|C8H16O|CC(=O)CCCCCC|||Keton|Methylketon mit 8 C-Atomen
Octan-3-on|Ethylpentylketon|C8H16O|CCC(=O)CCCCC|||Keton|Keton mit 8 C-Atomen
Octan-1-amin|Octylamin|C8H19N|CCCCCCCCN|||Amin|Primäres Amin mit 8 C-Atomen
Octanamid||C8H17NO|CCCCCCCC(N)=O|||Amid|Carbonsäureamid mit 8 C-Atomen
1-Chloroctan|Octylchlorid|C8H17Cl|CCCCCCCCCl|||Halogenverbindung|Halogenalkan mit 8 C-Atomen
1-Bromoctan|Octylbromid|C8H17Br|CCCCCCCCBr|||Halogenverbindung|Halogenalkan mit 8 C-Atomen
1-Iodoctan|Octyliodid|C8H17I|CCCCCCCCI|||Halogenverbindung|Halogenalkan mit 8 C-Atomen
1-Fluoroctan|Octylfluorid|C8H17F|CCCCCCCCF|||Halogenverbindung|Halogenalkan mit 8 C-Atomen
Octannitril|Heptylcyanid|C8H15N|CCCCCCCC#N|||Nitril|Nitril mit 8 C-Atomen
Dioctylether||C16H34O|CCCCCCCCOCCCCCCCC|||Ether|Symmetrischer Ether aus zwei Octylgruppen
Non-1-en|1-Nonen|C9H18|C=CCCCCCCC|||Alken|Endständiges Alken mit 9 C-Atomen
Non-1-in|1-Nonin|C9H16|C#CCCCCCCC|||Alkin|Endständiges Alkin mit 9 C-Atomen
Nonan-1-ol|Nonylalkohol;1-Nonanol|C9H20O|CCCCCCCCCO|||Alkohol|Primärer Alkohol mit 9 C-Atomen
Nonanal|Nonylaldehyd|C9H18O|CCCCCCCCC=O|||Aldehyd|Aldehyd mit 9 C-Atomen
Nonansäure|Pelargonsäure|C9H18O2|CCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 9 C-Atomen
Nonan-2-ol|sec-Nonylalkohol|C9H20O|CC(O)CCCCCCC|||Alkohol|Sekundärer Alkohol mit 9 C-Atomen
Nonan-2-on|Methylheptylketon|C9H18O|CC(=O)CCCCCCC|||Keton|Methylketon mit 9 C-Atomen
Nonan-3-on|Ethylhexylketon|C9H18O|CCC(=O)CCCCCC|||Keton|Keton mit 9 C-Atomen
Nonan-1-amin|Nonylamin|C9H21N|CCCCCCCCCN|||Amin|Primäres Amin mit 9 C-Atomen
Nonanamid||C9H19NO|CCCCCCCCC(N)=O|||Amid|Carbonsäureamid mit 9 C-Atomen
1-Chlornonan|Nonylchlorid|C9H19Cl|CCCCCCCCCCl|||Halogenverbindung|Halogenalkan mit 9 C-Atomen
1-Bromnonan|Nonylbromid|C9H19Br|CCCCCCCCCBr|||Halogenverbindung|Halogenalkan mit 9 C-Atomen
1-Iodnonan|Nonyliodid|C9H19I|CCCCCCCCCI|||Halogenverbindung|Halogenalkan mit 9 C-Atomen
1-Fluornonan|Nonylfluorid|C9H19F|CCCCCCCCCF|||Halogenverbindung|Halogenalkan mit 9 C-Atomen
Nonannitril|Octylcyanid|C9H17N|CCCCCCCCC#N|||Nitril|Nitril mit 9 C-Atomen
Dec-1-en|1-Decen|C10H20|C=CCCCCCCCC|||Alken|Endständiges Alken mit 10 C-Atomen
Dec-1-in|1-Decin|C10H18|C#CCCCCCCCC|||Alkin|Endständiges Alkin mit 10 C-Atomen
Decan-1-ol|Decylalkohol;1-Decanol|C10H22O|CCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 10 C-Atomen
Decanal|Decylaldehyd|C10H20O|CCCCCCCCCC=O|||Aldehyd|Aldehyd mit 10 C-Atomen
Decansäure|Caprinsäure|C10H20O2|CCCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 10 C-Atomen
Decan-2-ol|sec-Decylalkohol|C10H22O|CC(O)CCCCCCCC|||Alkohol|Sekundärer Alkohol mit 10 C-Atomen
Decan-2-on|Methyloctylketon|C10H20O|CC(=O)CCCCCCCC|||Keton|Methylketon mit 10 C-Atomen
Decan-3-on|Ethylheptylketon|C10H20O|CCC(=O)CCCCCCC|||Keton|Keton mit 10 C-Atomen
Decan-1-amin|Decylamin|C10H23N|CCCCCCCCCCN|||Amin|Primäres Amin mit 10 C-Atomen
Decanamid||C10H21NO|CCCCCCCCCC(N)=O|||Amid|Carbonsäureamid mit 10 C-Atomen
1-Chlordecan|Decylchlorid|C10H21Cl|CCCCCCCCCCCl|||Halogenverbindung|Halogenalkan mit 10 C-Atomen
1-Bromdecan|Decylbromid|C10H21Br|CCCCCCCCCCBr|||Halogenverbindung|Halogenalkan mit 10 C-Atomen
1-Ioddecan|Decyliodid|C10H21I|CCCCCCCCCCI|||Halogenverbindung|Halogenalkan mit 10 C-Atomen
1-Fluordecan|Decylfluorid|C10H21F|CCCCCCCCCCF|||Halogenverbindung|Halogenalkan mit 10 C-Atomen
Decannitril|Nonylcyanid|C10H19N|CCCCCCCCCC#N|||Nitril|Nitril mit 10 C-Atomen
Undecan||C11H24|CCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 11 C-Atomen
Undec-1-en|1-Undecen|C11H22|C=CCCCCCCCCC|||Alken|Endständiges Alken mit 11 C-Atomen
Undec-1-in|1-Undecin|C11H20|C#CCCCCCCCCC|||Alkin|Endständiges Alkin mit 11 C-Atomen
Undecan-1-ol|Undecylalkohol;1-Undecanol|C11H24O|CCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 11 C-Atomen
Undecanal|Undecylaldehyd|C11H22O|CCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 11 C-Atomen
Undecansäure||C11H22O2|CCCCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 11 C-Atomen
Undecan-2-ol|sec-Undecylalkohol|C11H24O|CC(O)CCCCCCCCC|||Alkohol|Sekundärer Alkohol mit 11 C-Atomen
Undecan-2-on|Methylnonylketon|C11H22O|CC(=O)CCCCCCCCC|||Keton|Methylketon mit 11 C-Atomen
Undecan-1-amin|Undecylamin|C11H25N|CCCCCCCCCCCN|||Amin|Primäres Amin mit 11 C-Atomen
Undecanamid||C11H23NO|CCCCCCCCCCC(N)=O|||Amid|Carbonsäureamid mit 11 C-Atomen
1-Chlorundecan|Undecylchlorid|C11H23Cl|CCCCCCCCCCCCl|||Halogenverbindung|Halogenalkan mit 11 C-Atomen
1-Bromundecan|Undecylbromid|C11H23Br|CCCCCCCCCCCBr|||Halogenverbindung|Halogenalkan mit 11 C-Atomen
1-Iodundecan|Undecyliodid|C11H23I|CCCCCCCCCCCI|||Halogenverbindung|Halogenalkan mit 11 C-Atomen
1-Fluorundecan|Undecylfluorid|C11H23F|CCCCCCCCCCCF|||Halogenverbindung|Halogenalkan mit 11 C-Atomen
Undecannitril|Decylcyanid|C11H21N|CCCCCCCCCCC#N|||Nitril|Nitril mit 11 C-Atomen
Dodec-1-en|1-Dodecen|C12H24|C=CCCCCCCCCCC|||Alken|Endständiges Alken mit 12 C-Atomen
Dodec-1-in|1-Dodecin|C12H22|C#CCCCCCCCCCC|||Alkin|Endständiges Alkin mit 12 C-Atomen
Dodecanal|Dodecylaldehyd|C12H24O|CCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 12 C-Atomen
Dodecan-2-ol|sec-Dodecylalkohol|C12H26O|CC(O)CCCCCCCCCC|||Alkohol|Sekundärer Alkohol mit 12 C-Atomen
Dodecan-2-on|Methyldecylketon|C12H24O|CC(=O)CCCCCCCCCC|||Keton|Methylketon mit 12 C-Atomen
Dodecan-1-amin|Dodecylamin|C12H27N|CCCCCCCCCCCCN|||Amin|Primäres Amin mit 12 C-Atomen
Dodecanamid||C12H25NO|CCCCCCCCCCCC(N)=O|||Amid|Carbonsäureamid mit 12 C-Atomen
1-Chlordodecan|Dodecylchlorid|C12H25Cl|CCCCCCCCCCCCCl|||Halogenverbindung|Halogenalkan mit 12 C-Atomen
1-Bromdodecan|Dodecylbromid|C12H25Br|CCCCCCCCCCCCBr|||Halogenverbindung|Halogenalkan mit 12 C-Atomen
1-Ioddodecan|Dodecyliodid|C12H25I|CCCCCCCCCCCCI|||Halogenverbindung|Halogenalkan mit 12 C-Atomen
1-Fluordodecan|Dodecylfluorid|C12H25F|CCCCCCCCCCCCF|||Halogenverbindung|Halogenalkan mit 12 C-Atomen
Dodecannitril|Undecylcyanid|C12H23N|CCCCCCCCCCCC#N|||Nitril|Nitril mit 12 C-Atomen
Tridecan||C13H28|CCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 13 C-Atomen
Tridec-1-en|1-Tridecen|C13H26|C=CCCCCCCCCCCC|||Alken|Endständiges Alken mit 13 C-Atomen
Tridec-1-in|1-Tridecin|C13H24|C#CCCCCCCCCCCC|||Alkin|Endständiges Alkin mit 13 C-Atomen
Tridecan-1-ol|Tridecylalkohol;1-Tridecanol|C13H28O|CCCCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 13 C-Atomen
Tridecanal|Tridecylaldehyd|C13H26O|CCCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 13 C-Atomen
Tridecansäure||C13H26O2|CCCCCCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 13 C-Atomen
Tetradecan||C14H30|CCCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 14 C-Atomen
Tetradec-1-en|1-Tetradecen|C14H28|C=CCCCCCCCCCCCC|||Alken|Endständiges Alken mit 14 C-Atomen
Tetradec-1-in|1-Tetradecin|C14H26|C#CCCCCCCCCCCCC|||Alkin|Endständiges Alkin mit 14 C-Atomen
Tetradecan-1-ol|Tetradecylalkohol;1-Tetradecanol|C14H30O|CCCCCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 14 C-Atomen
Tetradecanal|Tetradecylaldehyd|C14H28O|CCCCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 14 C-Atomen
Tetradecansäure|Myristinsäure|C14H28O2|CCCCCCCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 14 C-Atomen
Pentadecan||C15H32|CCCCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 15 C-Atomen
Pentadec-1-en|1-Pentadecen|C15H30|C=CCCCCCCCCCCCCC|||Alken|Endständiges Alken mit 15 C-Atomen
Pentadec-1-in|1-Pentadecin|C15H28|C#CCCCCCCCCCCCCC|||Alkin|Endständiges Alkin mit 15 C-Atomen
Pentadecan-1-ol|Pentadecylalkohol;1-Pentadecanol|C15H32O|CCCCCCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 15 C-Atomen
Pentadecanal|Pentadecylaldehyd|C15H30O|CCCCCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 15 C-Atomen
Pentadecansäure||C15H30O2|CCCCCCCCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 15 C-Atomen
Hexadec-1-en|1-Hexadecen|C16H32|C=CCCCCCCCCCCCCCC|||Alken|Endständiges Alken mit 16 C-Atomen
Hexadec-1-in|1-Hexadecin|C16H30|C#CCCCCCCCCCCCCCC|||Alkin|Endständiges Alkin mit 16 C-Atomen
Hexadecan-1-ol|Hexadecylalkohol;1-Hexadecanol|C16H34O|CCCCCCCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 16 C-Atomen
Hexadecanal|Hexadecylaldehyd|C16H32O|CCCCCCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 16 C-Atomen
Heptadecan||C17H36|CCCCCCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 17 C-Atomen
Heptadecan-1-ol|Heptadecylalkohol;1-Heptadecanol|C17H36O|CCCCCCCCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 17 C-Atomen
Heptadecanal|Heptadecylaldehyd|C17H34O|CCCCCCCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 17 C-Atomen
Heptadecansäure||C17H34O2|CCCCCCCCCCCCCCCCC(=O)O|||Carbonsäure|Gesättigte Carbonsäure mit 17 C-Atomen
Octadecan||C18H38|CCCCCCCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 18 C-Atomen
Octadecan-1-ol|Octadecylalkohol;1-Octadecanol|C18H38O|CCCCCCCCCCCCCCCCCCO|||Alkohol|Primärer Alkohol mit 18 C-Atomen
Octadecanal|Octadecylaldehyd|C18H36O|CCCCCCCCCCCCCCCCCC=O|||Aldehyd|Aldehyd mit 18 C-Atomen
Nonadecan||C19H40|CCCCCCCCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 19 C-Atomen
Icosan||C20H42|CCCCCCCCCCCCCCCCCCCC|||Alkan|Unverzweigtes Alkan mit 20 C-Atomen
Ameisensäurepropylester|Propylformiat|C4H8O2|O=COCCC|||Ester|Ester aus Ameisensäure und Propanol
Ameisensäurebutylester|Butylformiat|C5H10O2|O=COCCCC|||Ester|Ester aus Ameisensäure und Butanol
Ameisensäurepentylester|Pentylformiat|C6H12O2|O=COCCCCC|||Ester|Ester aus Ameisensäure und Pentanol
Ameisensäurehexylester|Hexylformiat|C7H14O2|O=COCCCCCC|||Ester|Ester aus Ameisensäure und Hexanol
Essigsäurehexylester|Hexylacetat|C8H16O2|CC(=O)OCCCCCC|||Ester|Ester aus Essigsäure und Hexanol
Propionsäuremethylester|Methylpropanoat|C4H8O2|CCC(=O)OC|||Ester|Ester aus Propionsäure und Methanol
Propionsäurepropylester|Propylpropanoat|C6H12O2|CCC(=O)OCCC|||Ester|Ester aus Propionsäure und Propanol
Propionsäurebutylester|Butylpropanoat|C7H14O2|CCC(=O)OCCCC|||Ester|Ester aus Propionsäure und Butanol
Propionsäurepentylester|Pentylpropanoat|C8H16O2|CCC(=O)OCCCCC|||Ester|Ester aus Propionsäure und Pentanol
Propionsäurehexylester|Hexylpropanoat|C9H18O2|CCC(=O)OCCCCCC|||Ester|Ester aus Propionsäure und Hexanol
Buttersäurepropylester|Propylbutanoat|C7H14O2|CCCC(=O)OCCC|||Ester|Ester aus Buttersäure und Propanol
Buttersäurebutylester|Butylbutanoat|C8H16O2|CCCC(=O)OCCCC|||Ester|Ester aus Buttersäure und Butanol
Buttersäurepentylester|Pentylbutanoat|C9H18O2|CCCC(=O)OCCCCC|||Ester|Ester aus Buttersäure und Pentanol
Buttersäurehexylester|Hexylbutanoat|C10H20O2|CCCC(=O)OCCCCCC|||Ester|Ester aus Buttersäure und Hexanol
Valeriansäuremethylester|Methylpentanoat|C6H12O2|CCCCC(=O)OC|||Ester|Ester aus Valeriansäure und Methanol
Valeriansäureethylester|Ethylpentanoat|C7H14O2|CCCCC(=O)OCC|||Ester|Ester aus Valeriansäure und Ethanol
Valeriansäurepropylester|Propylpentanoat|C8H16O2|CCCCC(=O)OCCC|||Ester|Ester aus Valeriansäure und Propanol
Valeriansäurebutylester|Butylpentanoat|C9H18O2|CCCCC(=O)OCCCC|||Ester|Ester aus Valeriansäure und Butanol
Valeriansäurepentylester|Pentylpentanoat|C10H20O2|CCCCC(=O)OCCCCC|||Ester|Ester aus Valeriansäure und Pentanol
Valeriansäurehexylester|Hexylpentanoat|C11H22O2|CCCCC(=O)OCCCCCC|||Ester|Ester aus Valeriansäure und Hexanol
Capronsäuremethylester|Methylhexanoat|C7H14O2|CCCCCC(=O)OC|||Ester|Ester aus Capronsäure und Methanol
Capronsäureethylester|Ethylhexanoat|C8H16O2|CCCCCC(=O)OCC|||Ester|Ester aus Capronsäure und Ethanol
Capronsäurepropylester|Propylhexanoat|C9H18O2|CCCCCC(=O)OCCC|||Ester|Ester aus Capronsäure und Propanol
Capronsäurebutylester|Butylhexanoat|C10H20O2|CCCCCC(=O)OCCCC|||Ester|Ester aus Capronsäure und Butanol
Capronsäurepentylester|Pentylhexanoat|C11H22O2|CCCCCC(=O)OCCCCC|||Ester|Ester aus Capronsäure und Pentanol
Capronsäurehexylester|Hexylhexanoat|C12H24O2|CCCCCC(=O)OCCCCCC|||Ester|Ester aus Capronsäure und Hexanol
Cyclobutan||C4H8|C1CCC1|||Alkan|Cycloalkan mit 4 Ringatomen
Cycloheptan||C7H14|C1CCCCCC1|||Alkan|Cycloalkan mit 7 Ringatomen
Cyclohepten||C7H12|C1=CCCCCC1|||Alken|Cycloalken mit 7 Ringatomen
Cycloheptanol||C7H14O|OC1CCCCCC1|||Alkohol|Cyclischer Alkohol mit 7 Ringatomen
Cycloheptanon||C7H12O|O=C1CCCCCC1|||Keton|Cyclisches Keton mit 7 Ringatomen
Cycloheptylamin|Cycloheptanamin|C7H15N|NC1CCCCCC1|||Amin|Cycloalkylamin mit 7 Ringatomen
Cyclooctan||C8H16|C1CCCCCCC1|||Alkan|Cycloalkan mit 8 Ringatomen
Cycloocten||C8H14|C1=CCCCCCC1|||Alken|Cycloalken mit 8 Ringatomen
Cyclooctanol||C8H16O|OC1CCCCCCC1|||Alkohol|Cyclischer Alkohol mit 8 Ringatomen
Cyclooctanon||C8H14O|O=C1CCCCCCC1|||Keton|Cyclisches Keton mit 8 Ringatomen
Cyclooctylamin|Cyclooctanamin|C8H17N|NC1CCCCCCC1|||Amin|Cycloalkylamin mit 8 Ringatomen
Propan-1,3-diamin||C3H10N2|NCCCN|||Amin|Diamin, Baustein für Polyamide
Butan-1,4-diol||C4H10O2|OCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Butan-1,4-diamin|Putrescin|C4H12N2|NCCCCN|||Amin|Diamin, Baustein für Polyamide
Pentan-1,5-diol||C5H12O2|OCCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Pentan-1,5-diamin|Cadaverin|C5H14N2|NCCCCCN|||Amin|Diamin, Baustein für Polyamide
Hexan-1,6-diol||C6H14O2|OCCCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Heptan-1,7-diol||C7H16O2|OCCCCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Heptan-1,7-diamin||C7H18N2|NCCCCCCCN|||Amin|Diamin, Baustein für Polyamide
Heptandisäure|Pimelinsäure|C7H12O4|OC(=O)CCCCCC(=O)O|||Carbonsäure|Dicarbonsäure, Baustein für Polyester und Polyamide
Octan-1,8-diol||C8H18O2|OCCCCCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Octan-1,8-diamin||C8H20N2|NCCCCCCCCN|||Amin|Diamin, Baustein für Polyamide
Octandisäure|Korksäure|C8H14O4|OC(=O)CCCCCCC(=O)O|||Carbonsäure|Dicarbonsäure, Baustein für Polyester und Polyamide
Nonan-1,9-diol||C9H20O2|OCCCCCCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Nonan-1,9-diamin||C9H22N2|NCCCCCCCCCN|||Amin|Diamin, Baustein für Polyamide
Nonandisäure|Azelainsäure|C9H16O4|OC(=O)CCCCCCCC(=O)O|||Carbonsäure|Dicarbonsäure, Baustein für Polyester und Polyamide
Decan-1,10-diol||C10H22O2|OCCCCCCCCCCO|||Alkohol|Zweiwertiger Alkohol mit endständigen OH-Gruppen
Decan-1,10-diamin||C10H24N2|NCCCCCCCCCCN|||Amin|Diamin, Baustein für Polyamide
Butan-2,3-diol||C4H10O2|CC(O)C(C)O|||Alkohol|Vicinales Diol
Propylbenzol||C9H12|CCCc1ccccc1|||Aromat|Alkylbenzol
Butylbenzol||C10H14|CCCCc1ccccc1|||Aromat|Alkylbenzol
Pyren||C16H10|c1cc2ccc3cccc4ccc(c1)c2c34|||Aromat|Vierringaromat, Fluoreszenzsonde
Inden||C9H8|C1=Cc2ccccc2C1|||Aromat|Bicyclischer Kohlenwasserstoff aus Steinkohlenteer
Diphenylmethan||C13H12|c1ccc(Cc2ccccc2)cc1|||Aromat|Zwei Phenylgruppen an einer CH2-Brücke
Triphenylmethan||C19H16|c1ccc(C(c2ccccc2)c2ccccc2)cc1|||Aromat|Grundgerüst der Triphenylmethanfarbstoffe
Cyclohexylbenzol||C12H16|c1ccc(C2CCCCC2)cc1|||Aromat|Alkylbenzol
2-Methylbenzoesäure|o-Methylbenzoesäure|C8H8O2|OC(=O)c1ccccc1C|||Carbonsäure|Benzoesäure mit Methylgruppe in ortho-Stellung
3-Methylbenzoesäure|m-Methylbenzoesäure|C8H8O2|OC(=O)c1cccc(C)c1|||Carbonsäure|Benzoesäure mit Methylgruppe in meta-Stellung
2-Chlorbenzoesäure|o-Chlorbenzoesäure|C7H5ClO2|OC(=O)c1ccccc1Cl|||Carbonsäure|Benzoesäure mit Chlorgruppe in ortho-Stellung
3-Chlorbenzoesäure|m-Chlorbenzoesäure|C7H5ClO2|OC(=O)c1cccc(Cl)c1|||Carbonsäure|Benzoesäure mit Chlorgruppe in meta-Stellung
2-Brombenzoesäure|o-Brombenzoesäure|C7H5BrO2|OC(=O)c1ccccc1Br|||Carbonsäure|Benzoesäure mit Bromgruppe in ortho-Stellung
3-Brombenzoesäure|m-Brombenzoesäure|C7H5BrO2|OC(=O)c1cccc(Br)c1|||Carbonsäure|Benzoesäure mit Bromgruppe in meta-Stellung
4-Brombenzoesäure|p-Brombenzoesäure|C7H5BrO2|OC(=O)c1ccc(Br)cc1|||Carbonsäure|Benzoesäure mit Bromgruppe in para-Stellung
2-Fluorbenzoesäure|o-Fluorbenzoesäure|C7H5FO2|OC(=O)c1ccccc1F|||Carbonsäure|Benzoesäure mit Fluorgruppe in ortho-Stellung
3-Fluorbenzoesäure|m-Fluorbenzoesäure|C7H5FO2|OC(=O)c1cccc(F)c1|||Carbonsäure|Benzoesäure mit Fluorgruppe in meta-Stellung
4-Fluorbenzoesäure|p-Fluorbenzoesäure|C7H5FO2|OC(=O)c1ccc(F)cc1|||Carbonsäure|Benzoesäure mit Fluorgruppe in para-Stellung
2-Iodbenzoesäure|o-Iodbenzoesäure|C7H5IO2|OC(=O)c1ccccc1I|||Carbonsäure|Benzoesäure mit Iodgruppe in ortho-Stellung
3-Iodbenzoesäure|m-Iodbenzoesäure|C7H5IO2|OC(=O)c1cccc(I)c1|||Carbonsäure|Benzoesäure mit Iodgruppe in meta-Stellung
4-Iodbenzoesäure|p-Iodbenzoesäure|C7H5IO2|OC(=O)c1ccc(I)cc1|||Carbonsäure|Benzoesäure mit Iodgruppe in para-Stellung
2-Nitrobenzoesäure|o-Nitrobenzoesäure|C7H5NO4|OC(=O)c1ccccc1[N+](=O)[O-]|||Carbonsäure|Benzoesäure mit Nitrogruppe in ortho-Stellung
2-Methoxybenzoesäure|o-Methoxybenzoesäure|C8H8O3|OC(=O)c1ccccc1OC|||Carbonsäure|Benzoesäure mit Methoxygruppe in ortho-Stellung
3-Methoxybenzoesäure|m-Methoxybenzoesäure|C8H8O3|OC(=O)c1cccc(OC)c1|||Carbonsäure|Benzoesäure mit Methoxygruppe in meta-Stellung
4-Methoxybenzoesäure|p-Methoxybenzoesäure|C8H8O3|OC(=O)c1ccc(OC)cc1|||Carbonsäure|Benzoesäure mit Methoxygruppe in para-Stellung
3-Hydroxybenzoesäure|m-Hydroxybenzoesäure|C7H6O3|OC(=O)c1cccc(O)c1|||Carbonsäure|Benzoesäure mit Hydroxygruppe in meta-Stellung
2-Aminobenzoesäure|o-Aminobenzoesäure|C7H7NO2|OC(=O)c1ccccc1N|||Carbonsäure|Benzoesäure mit Aminogruppe in ortho-Stellung
3-Aminobenzoesäure|m-Aminobenzoesäure|C7H7NO2|OC(=O)c1cccc(N)c1|||Carbonsäure|Benzoesäure mit Aminogruppe in meta-Stellung
2-Methylbenzonitril|o-Methylbenzonitril|C8H7N|N#Cc1ccccc1C|||Nitril|Benzonitril mit Methylgruppe in ortho-Stellung
3-Methylbenzonitril|m-Methylbenzonitril|C8H7N|N#Cc1cccc(C)c1|||Nitril|Benzonitril mit Methylgruppe in meta-Stellung
4-Methylbenzonitril|p-Methylbenzonitril|C8H7N|N#Cc1ccc(C)cc1|||Nitril|Benzonitril mit Methylgruppe in para-Stellung
2-Chlorbenzonitril|o-Chlorbenzonitril|C7H4ClN|N#Cc1ccccc1Cl|||Nitril|Benzonitril mit Chlorgruppe in ortho-Stellung
3-Chlorbenzonitril|m-Chlorbenzonitril|C7H4ClN|N#Cc1cccc(Cl)c1|||Nitril|Benzonitril mit Chlorgruppe in meta-Stellung
4-Chlorbenzonitril|p-Chlorbenzonitril|C7H4ClN|N#Cc1ccc(Cl)cc1|||Nitril|Benzonitril mit Chlorgruppe in para-Stellung
2-Brombenzonitril|o-Brombenzonitril|C7H4BrN|N#Cc1ccccc1Br|||Nitril|Benzonitril mit Bromgruppe in ortho-Stellung
3-Brombenzonitril|m-Brombenzonitril|C7H4BrN|N#Cc1cccc(Br)c1|||Nitril|Benzonitril mit Bromgruppe in meta-Stellung
4-Brombenzonitril|p-Brombenzonitril|C7H4BrN|N#Cc1ccc(Br)cc1|||Nitril|Benzonitril mit Bromgruppe in para-Stellung
2-Fluorbenzonitril|o-Fluorbenzonitril|C7H4FN|N#Cc1ccccc1F|||Nitril|Benzonitril mit Fluorgruppe in ortho-Stellung
3-Fluorbenzonitril|m-Fluorbenzonitril|C7H4FN|N#Cc1cccc(F)c1|||Nitril|Benzonitril mit Fluorgruppe in meta-Stellung
2-Iodbenzonitril|o-Iodbenzonitril|C7H4IN|N#Cc1ccccc1I|||Nitril|Benzonitril mit Iodgruppe in ortho-Stellung
3-Iodbenzonitril|m-Iodbenzonitril|C7H4IN|N#Cc1cccc(I)c1|||Nitril|Benzonitril mit Iodgruppe in meta-Stellung
4-Iodbenzonitril|p-Iodbenzonitril|C7H4IN|N#Cc1ccc(I)cc1|||Nitril|Benzonitril mit Iodgruppe in para-Stellung
2-Nitrobenzonitril|o-Nitrobenzonitril|C7H4N2O2|N#Cc1ccccc1[N+](=O)[O-]|||Nitril|Benzonitril mit Nitrogruppe in ortho-Stellung
3-Nitrobenzonitril|m-Nitrobenzonitril|C7H4N2O2|N#Cc1cccc([N+](=O)[O-])c1|||Nitril|Benzonitril mit Nitrogruppe in meta-Stellung
4-Nitrobenzonitril|p-Nitrobenzonitril|C7H4N2O2|N#Cc1ccc([N+](=O)[O-])cc1|||Nitril|Benzonitril mit Nitrogruppe in para-Stellung
2-Methoxybenzonitril|o-Methoxybenzonitril|C8H7NO|N#Cc1ccccc1OC|||Nitril|Benzonitril mit Methoxygruppe in ortho-Stellung
3-Methoxybenzonitril|m-Methoxybenzonitril|C8H7NO|N#Cc1cccc(OC)c1|||Nitril|Benzonitril mit Methoxygruppe in meta-Stellung
4-Methoxybenzonitril|p-Methoxybenzonitril|C8H7NO|N#Cc1ccc(OC)cc1|||Nitril|Benzonitril mit Methoxygruppe in para-Stellung
2-Hydroxybenzonitril|o-Hydroxybenzonitril|C7H5NO|N#Cc1ccccc1O|||Nitril|Benzonitril mit Hydroxygruppe in ortho-Stellung
3-Hydroxybenzonitril|m-Hydroxybenzonitril|C7H5NO|N#Cc1cccc(O)c1|||Nitril|Benzonitril mit Hydroxygruppe in meta-Stellung
4-Hydroxybenzonitril|p-Hydroxybenzonitril|C7H5NO|N#Cc1ccc(O)cc1|||Nitril|Benzonitril mit Hydroxygruppe in para-Stellung
2-Aminobenzonitril|o-Aminobenzonitril|C7H6N2|N#Cc1ccccc1N|||Nitril|Benzonitril mit Aminogruppe in ortho-Stellung
3-Aminobenzonitril|m-Aminobenzonitril|C7H6N2|N#Cc1cccc(N)c1|||Nitril|Benzonitril mit Aminogruppe in meta-Stellung
4-Aminobenzonitril|p-Aminobenzonitril|C7H6N2|N#Cc1ccc(N)cc1|||Nitril|Benzonitril mit Aminogruppe in para-Stellung
2-Methylbenzaldehyd|o-Methylbenzaldehyd|C8H8O|O=Cc1ccccc1C|||Aldehyd|Benzaldehyd mit Methylgruppe in ortho-Stellung
3-Methylbenzaldehyd|m-Methylbenzaldehyd|C8H8O|O=Cc1cccc(C)c1|||Aldehyd|Benzaldehyd mit Methylgruppe in meta-Stellung
4-Methylbenzaldehyd|p-Methylbenzaldehyd|C8H8O|O=Cc1ccc(C)cc1|||Aldehyd|Benzaldehyd mit Methylgruppe in para-Stellung
2-Chlorbenzaldehyd|o-Chlorbenzaldehyd|C7H5ClO|O=Cc1ccccc1Cl|||Aldehyd|Benzaldehyd mit Chlorgruppe in ortho-Stellung
3-Chlorbenzaldehyd|m-Chlorbenzaldehyd|C7H5ClO|O=Cc1cccc(Cl)c1|||Aldehyd|Benzaldehyd mit Chlorgruppe in meta-Stellung
2-Brombenzaldehyd|o-Brombenzaldehyd|C7H5BrO|O=Cc1ccccc1Br|||Aldehyd|Benzaldehyd mit Bromgruppe in ortho-Stellung
3-Brombenzaldehyd|m-Brombenzaldehyd|C7H5BrO|O=Cc1cccc(Br)c1|||Aldehyd|Benzaldehyd mit Bromgruppe in meta-Stellung
2-Fluorbenzaldehyd|o-Fluorbenzaldehyd|C7H5FO|O=Cc1ccccc1F|||Aldehyd|Benzaldehyd mit Fluorgruppe in ortho-Stellung
3-Fluorbenzaldehyd|m-Fluorbenzaldehyd|C7H5FO|O=Cc1cccc(F)c1|||Aldehyd|Benzaldehyd mit Fluorgruppe in meta-Stellung
2-Iodbenzaldehyd|o-Iodbenzaldehyd|C7H5IO|O=Cc1ccccc1I|||Aldehyd|Benzaldehyd mit Iodgruppe in ortho-Stellung
3-Iodbenzaldehyd|m-Iodbenzaldehyd|C7H5IO|O=Cc1cccc(I)c1|||Aldehyd|Benzaldehyd mit Iodgruppe in meta-Stellung
4-Iodbenzaldehyd|p-Iodbenzaldehyd|C7H5IO|O=Cc1ccc(I)cc1|||Aldehyd|Benzaldehyd mit Iodgruppe in para-Stellung
3-Nitrobenzaldehyd|m-Nitrobenzaldehyd|C7H5NO3|O=Cc1cccc([N+](=O)[O-])c1|||Aldehyd|Benzaldehyd mit Nitrogruppe in meta-Stellung
2-Methoxybenzaldehyd|o-Methoxybenzaldehyd|C8H8O2|O=Cc1ccccc1OC|||Aldehyd|Benzaldehyd mit Methoxygruppe in ortho-Stellung
3-Methoxybenzaldehyd|m-Methoxybenzaldehyd|C8H8O2|O=Cc1cccc(OC)c1|||Aldehyd|Benzaldehyd mit Methoxygruppe in meta-Stellung
3-Hydroxybenzaldehyd|m-Hydroxybenzaldehyd|C7H6O2|O=Cc1cccc(O)c1|||Aldehyd|Benzaldehyd mit Hydroxygruppe in meta-Stellung
2-Aminobenzaldehyd|o-Aminobenzaldehyd|C7H7NO|O=Cc1ccccc1N|||Aldehyd|Benzaldehyd mit Aminogruppe in ortho-Stellung
3-Aminobenzaldehyd|m-Aminobenzaldehyd|C7H7NO|O=Cc1cccc(N)c1|||Aldehyd|Benzaldehyd mit Aminogruppe in meta-Stellung
4-Aminobenzaldehyd|p-Aminobenzaldehyd|C7H7NO|O=Cc1ccc(N)cc1|||Aldehyd|Benzaldehyd mit Aminogruppe in para-Stellung
2′-Methylacetophenon|o-Methylacetophenon|C9H10O|CC(=O)c1ccccc1C|||Keton|Acetophenon mit Methylgruppe in ortho-Stellung
3′-Methylacetophenon|m-Methylacetophenon|C9H10O|CC(=O)c1cccc(C)c1|||Keton|Acetophenon mit Methylgruppe in meta-Stellung
4′-Methylacetophenon|p-Methylacetophenon|C9H10O|CC(=O)c1ccc(C)cc1|||Keton|Acetophenon mit Methylgruppe in para-Stellung
2′-Chloracetophenon|o-Chloracetophenon|C8H7ClO|CC(=O)c1ccccc1Cl|||Keton|Acetophenon mit Chlorgruppe in ortho-Stellung
3′-Chloracetophenon|m-Chloracetophenon|C8H7ClO|CC(=O)c1cccc(Cl)c1|||Keton|Acetophenon mit Chlorgruppe in meta-Stellung
4′-Chloracetophenon|p-Chloracetophenon|C8H7ClO|CC(=O)c1ccc(Cl)cc1|||Keton|Acetophenon mit Chlorgruppe in para-Stellung
2′-Bromacetophenon|o-Bromacetophenon|C8H7BrO|CC(=O)c1ccccc1Br|||Keton|Acetophenon mit Bromgruppe in ortho-Stellung
3′-Bromacetophenon|m-Bromacetophenon|C8H7BrO|CC(=O)c1cccc(Br)c1|||Keton|Acetophenon mit Bromgruppe in meta-Stellung
4′-Bromacetophenon|p-Bromacetophenon|C8H7BrO|CC(=O)c1ccc(Br)cc1|||Keton|Acetophenon mit Bromgruppe in para-Stellung
2′-Fluoracetophenon|o-Fluoracetophenon|C8H7FO|CC(=O)c1ccccc1F|||Keton|Acetophenon mit Fluorgruppe in ortho-Stellung
3′-Fluoracetophenon|m-Fluoracetophenon|C8H7FO|CC(=O)c1cccc(F)c1|||Keton|Acetophenon mit Fluorgruppe in meta-Stellung
4′-Fluoracetophenon|p-Fluoracetophenon|C8H7FO|CC(=O)c1ccc(F)cc1|||Keton|Acetophenon mit Fluorgruppe in para-Stellung
2′-Iodacetophenon|o-Iodacetophenon|C8H7IO|CC(=O)c1ccccc1I|||Keton|Acetophenon mit Iodgruppe in ortho-Stellung
3′-Iodacetophenon|m-Iodacetophenon|C8H7IO|CC(=O)c1cccc(I)c1|||Keton|Acetophenon mit Iodgruppe in meta-Stellung
4′-Iodacetophenon|p-Iodacetophenon|C8H7IO|CC(=O)c1ccc(I)cc1|||Keton|Acetophenon mit Iodgruppe in para-Stellung
2′-Nitroacetophenon|o-Nitroacetophenon|C8H7NO3|CC(=O)c1ccccc1[N+](=O)[O-]|||Keton|Acetophenon mit Nitrogruppe in ortho-Stellung
3′-Nitroacetophenon|m-Nitroacetophenon|C8H7NO3|CC(=O)c1cccc([N+](=O)[O-])c1|||Keton|Acetophenon mit Nitrogruppe in meta-Stellung
4′-Nitroacetophenon|p-Nitroacetophenon|C8H7NO3|CC(=O)c1ccc([N+](=O)[O-])cc1|||Keton|Acetophenon mit Nitrogruppe in para-Stellung
2′-Methoxyacetophenon|o-Methoxyacetophenon|C9H10O2|CC(=O)c1ccccc1OC|||Keton|Acetophenon mit Methoxygruppe in ortho-Stellung
3′-Methoxyacetophenon|m-Methoxyacetophenon|C9H10O2|CC(=O)c1cccc(OC)c1|||Keton|Acetophenon mit Methoxygruppe in meta-Stellung
2′-Hydroxyacetophenon|o-Hydroxyacetophenon|C8H8O2|CC(=O)c1ccccc1O|||Keton|Acetophenon mit Hydroxygruppe in ortho-Stellung
3′-Hydroxyacetophenon|m-Hydroxyacetophenon|C8H8O2|CC(=O)c1cccc(O)c1|||Keton|Acetophenon mit Hydroxygruppe in meta-Stellung
4′-Hydroxyacetophenon|p-Hydroxyacetophenon|C8H8O2|CC(=O)c1ccc(O)cc1|||Keton|Acetophenon mit Hydroxygruppe in para-Stellung
2′-Aminoacetophenon|o-Aminoacetophenon|C8H9NO|CC(=O)c1ccccc1N|||Keton|Acetophenon mit Aminogruppe in ortho-Stellung
3′-Aminoacetophenon|m-Aminoacetophenon|C8H9NO|CC(=O)c1cccc(N)c1|||Keton|Acetophenon mit Aminogruppe in meta-Stellung
4′-Aminoacetophenon|p-Aminoacetophenon|C8H9NO|CC(=O)c1ccc(N)cc1|||Keton|Acetophenon mit Aminogruppe in para-Stellung
3-Methylphenol|m-Methylphenol|C7H8O|Oc1cccc(C)c1|||Phenol|Phenol mit Methylgruppe in meta-Stellung
2-Chlorphenol|o-Chlorphenol|C6H5ClO|Oc1ccccc1Cl|||Phenol|Phenol mit Chlorgruppe in ortho-Stellung
3-Chlorphenol|m-Chlorphenol|C6H5ClO|Oc1cccc(Cl)c1|||Phenol|Phenol mit Chlorgruppe in meta-Stellung
2-Bromphenol|o-Bromphenol|C6H5BrO|Oc1ccccc1Br|||Phenol|Phenol mit Bromgruppe in ortho-Stellung
3-Bromphenol|m-Bromphenol|C6H5BrO|Oc1cccc(Br)c1|||Phenol|Phenol mit Bromgruppe in meta-Stellung
2-Fluorphenol|o-Fluorphenol|C6H5FO|Oc1ccccc1F|||Phenol|Phenol mit Fluorgruppe in ortho-Stellung
3-Fluorphenol|m-Fluorphenol|C6H5FO|Oc1cccc(F)c1|||Phenol|Phenol mit Fluorgruppe in meta-Stellung
2-Iodphenol|o-Iodphenol|C6H5IO|Oc1ccccc1I|||Phenol|Phenol mit Iodgruppe in ortho-Stellung
3-Iodphenol|m-Iodphenol|C6H5IO|Oc1cccc(I)c1|||Phenol|Phenol mit Iodgruppe in meta-Stellung
4-Iodphenol|p-Iodphenol|C6H5IO|Oc1ccc(I)cc1|||Phenol|Phenol mit Iodgruppe in para-Stellung
2-Nitrophenol|o-Nitrophenol|C6H5NO3|Oc1ccccc1[N+](=O)[O-]|||Phenol|Phenol mit Nitrogruppe in ortho-Stellung
3-Nitrophenol|m-Nitrophenol|C6H5NO3|Oc1cccc([N+](=O)[O-])c1|||Phenol|Phenol mit Nitrogruppe in meta-Stellung
3-Methoxyphenol|m-Methoxyphenol|C7H8O2|Oc1cccc(OC)c1|||Phenol|Phenol mit Methoxygruppe in meta-Stellung
4-Methoxyphenol|p-Methoxyphenol|C7H8O2|Oc1ccc(OC)cc1|||Phenol|Phenol mit Methoxygruppe in para-Stellung
2-Aminophenol|o-Aminophenol|C6H7NO|Oc1ccccc1N|||Phenol|Phenol mit Aminogruppe in ortho-Stellung
3-Aminophenol|m-Aminophenol|C6H7NO|Oc1cccc(N)c1|||Phenol|Phenol mit Aminogruppe in meta-Stellung
2-Methylanilin|o-Methylanilin|C7H9N|Nc1ccccc1C|||Amin|Anilin mit Methylgruppe in ortho-Stellung
3-Methylanilin|m-Methylanilin|C7H9N|Nc1cccc(C)c1|||Amin|Anilin mit Methylgruppe in meta-Stellung
2-Chloranilin|o-Chloranilin|C6H6ClN|Nc1ccccc1Cl|||Amin|Anilin mit Chlorgruppe in ortho-Stellung
3-Chloranilin|m-Chloranilin|C6H6ClN|Nc1cccc(Cl)c1|||Amin|Anilin mit Chlorgruppe in meta-Stellung
2-Bromanilin|o-Bromanilin|C6H6BrN|Nc1ccccc1Br|||Amin|Anilin mit Bromgruppe in ortho-Stellung
3-Bromanilin|m-Bromanilin|C6H6BrN|Nc1cccc(Br)c1|||Amin|Anilin mit Bromgruppe in meta-Stellung
4-Bromanilin|p-Bromanilin|C6H6BrN|Nc1ccc(Br)cc1|||Amin|Anilin mit Bromgruppe in para-Stellung
2-Fluoranilin|o-Fluoranilin|C6H6FN|Nc1ccccc1F|||Amin|Anilin mit Fluorgruppe in ortho-Stellung
3-Fluoranilin|m-Fluoranilin|C6H6FN|Nc1cccc(F)c1|||Amin|Anilin mit Fluorgruppe in meta-Stellung
2-Iodanilin|o-Iodanilin|C6H6IN|Nc1ccccc1I|||Amin|Anilin mit Iodgruppe in ortho-Stellung
3-Iodanilin|m-Iodanilin|C6H6IN|Nc1cccc(I)c1|||Amin|Anilin mit Iodgruppe in meta-Stellung
4-Iodanilin|p-Iodanilin|C6H6IN|Nc1ccc(I)cc1|||Amin|Anilin mit Iodgruppe in para-Stellung
2-Nitroanilin|o-Nitroanilin|C6H6N2O2|Nc1ccccc1[N+](=O)[O-]|||Amin|Anilin mit Nitrogruppe in ortho-Stellung
3-Nitroanilin|m-Nitroanilin|C6H6N2O2|Nc1cccc([N+](=O)[O-])c1|||Amin|Anilin mit Nitrogruppe in meta-Stellung
2-Methoxyanilin|o-Methoxyanilin|C7H9NO|Nc1ccccc1OC|||Amin|Anilin mit Methoxygruppe in ortho-Stellung
3-Methoxyanilin|m-Methoxyanilin|C7H9NO|Nc1cccc(OC)c1|||Amin|Anilin mit Methoxygruppe in meta-Stellung
2-Chlortoluol|o-Chlortoluol|C7H7Cl|Cc1ccccc1Cl|||Aromat|Toluol mit Chlorgruppe in ortho-Stellung
3-Chlortoluol|m-Chlortoluol|C7H7Cl|Cc1cccc(Cl)c1|||Aromat|Toluol mit Chlorgruppe in meta-Stellung
4-Chlortoluol|p-Chlortoluol|C7H7Cl|Cc1ccc(Cl)cc1|||Aromat|Toluol mit Chlorgruppe in para-Stellung
2-Bromtoluol|o-Bromtoluol|C7H7Br|Cc1ccccc1Br|||Aromat|Toluol mit Bromgruppe in ortho-Stellung
3-Bromtoluol|m-Bromtoluol|C7H7Br|Cc1cccc(Br)c1|||Aromat|Toluol mit Bromgruppe in meta-Stellung
2-Fluortoluol|o-Fluortoluol|C7H7F|Cc1ccccc1F|||Aromat|Toluol mit Fluorgruppe in ortho-Stellung
3-Fluortoluol|m-Fluortoluol|C7H7F|Cc1cccc(F)c1|||Aromat|Toluol mit Fluorgruppe in meta-Stellung
4-Fluortoluol|p-Fluortoluol|C7H7F|Cc1ccc(F)cc1|||Aromat|Toluol mit Fluorgruppe in para-Stellung
2-Iodtoluol|o-Iodtoluol|C7H7I|Cc1ccccc1I|||Aromat|Toluol mit Iodgruppe in ortho-Stellung
3-Iodtoluol|m-Iodtoluol|C7H7I|Cc1cccc(I)c1|||Aromat|Toluol mit Iodgruppe in meta-Stellung
4-Iodtoluol|p-Iodtoluol|C7H7I|Cc1ccc(I)cc1|||Aromat|Toluol mit Iodgruppe in para-Stellung
3-Nitrotoluol|m-Nitrotoluol|C7H7NO2|Cc1cccc([N+](=O)[O-])c1|||Aromat|Toluol mit Nitrogruppe in meta-Stellung
1,2-Dichlorbenzol|o-Dichlorbenzol|C6H4Cl2|Clc1ccccc1Cl|||Halogenverbindung|Dihalogenbenzol
1,2-Dibrombenzol|o-Dibrombenzol|C6H4Br2|Brc1ccccc1Br|||Halogenverbindung|Dihalogenbenzol
1,3-Dichlorbenzol|m-Dichlorbenzol|C6H4Cl2|Clc1cccc(Cl)c1|||Halogenverbindung|Dihalogenbenzol
1,3-Dibrombenzol|m-Dibrombenzol|C6H4Br2|Brc1cccc(Br)c1|||Halogenverbindung|Dihalogenbenzol
1,4-Dichlorbenzol|p-Dichlorbenzol|C6H4Cl2|Clc1ccc(Cl)cc1|||Halogenverbindung|Dihalogenbenzol
1,4-Dibrombenzol|p-Dibrombenzol|C6H4Br2|Brc1ccc(Br)cc1|||Halogenverbindung|Dihalogenbenzol
Threonin|L-Threonin;Thr|C4H9NO3|C[C@@H](O)[C@H](N)C(=O)O|||Aminosäure|Proteinogene Aminosäure (Thr)
Asparagin|L-Asparagin;Asn|C4H8N2O3|N[C@@H](CC(N)=O)C(=O)O|||Aminosäure|Proteinogene Aminosäure (Asn)
Glutamin|L-Glutamin;Gln|C5H10N2O3|N[C@@H](CCC(N)=O)C(=O)O|||Aminosäure|Proteinogene Aminosäure (Gln)
Arginin|L-Arginin;Arg|C6H14N4O2|N=C(N)NCCC[C@H](N)C(=O)O|||Aminosäure|Proteinogene Aminosäure (Arg)
Histidin|L-Histidin;His|C6H9N3O2|N[C@@H](Cc1c[nH]cn1)C(=O)O|||Aminosäure|Proteinogene Aminosäure (His)
Oxazol||C3H3NO|c1cocn1|||Heteroaromat|Fünfring-Heteroaromat mit O und N
Thiazol||C3H3NS|c1cscn1|||Heteroaromat|Heteroaromat, Baustein von Vitamin B1
Pyrazin||C4H4N2|c1cnccn1|||Heteroaromat|Sechsring-Heteroaromat mit 1,4-Stickstoff
Pyridazin||C4H4N2|c1ccnnc1|||Heteroaromat|Sechsring-Heteroaromat mit 1,2-Stickstoff
1,3,5-Triazin||C3H3N3|c1ncncn1|||Heteroaromat|Grundkörper von Melamin
Isochinolin||C9H7N|c1ccc2cnccc2c1|||Heteroaromat|Isomer des Chinolins
Benzimidazol||C7H6N2|c1ccc2[nH]cnc2c1|||Heteroaromat|Baustein von Vitamin B12
Benzofuran||C8H6O|c1ccc2occc2c1|||Heteroaromat|Sauerstoffhaltiger Bicyclus
Benzothiophen||C8H6S|c1ccc2sccc2c1|||Heteroaromat|Schwefelhaltiger Bicyclus
Carbazol||C12H9N|c1ccc2c(c1)[nH]c1ccccc12|||Heteroaromat|Tricyclischer Heteroaromat
Acridin||C13H9N|c1ccc2nc3ccccc3cc2c1|||Heteroaromat|Tricyclischer Heteroaromat, Farbstoffgrundkörper
Purin||C5H4N4|c1ncc2[nH]cnc2n1|||Heteroaromat|Grundkörper von Adenin und Guanin
Oxetan||C3H6O|C1COC1|||Heteroaromat|Viergliedriger cyclischer Ether
2-Methylpyridin|α-Picolin|C6H7N|Cc1ccccn1|||Heteroaromat|Methylpyridin
3-Methylpyridin|β-Picolin|C6H7N|Cc1cccnc1|||Heteroaromat|Methylpyridin, Vorstufe von Niacin
4-Methylpyridin|γ-Picolin|C6H7N|Cc1ccncc1|||Heteroaromat|Methylpyridin
Adenin||C5H5N5|Nc1ncnc2[nH]cnc12|||Heteroaromat|Purinbase der DNA und RNA
Guanin||C5H5N5O|Nc1nc2[nH]cnc2c(=O)[nH]1|||Heteroaromat|Purinbase der DNA und RNA
Cytosin||C4H5N3O|Nc1cc[nH]c(=O)n1|||Heteroaromat|Pyrimidinbase der DNA und RNA
Thymin||C5H6N2O2|Cc1c[nH]c(=O)[nH]c1=O|||Heteroaromat|Pyrimidinbase der DNA
Uracil||C4H4N2O2|O=c1cc[nH]c(=O)[nH]1|||Heteroaromat|Pyrimidinbase der RNA
`;
