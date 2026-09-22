/**
 * Offline-Stoffdatenbank.
 *
 * Deckt die im Unterricht und Praktikum gebräuchlichen Stoffe ab, damit die App
 * auch ohne Internetverbindung arbeitet. Ist PubChem erreichbar, lassen sich
 * darüber hinaus alle dort verzeichneten Verbindungen abrufen.
 *
 * Format: Name | Synonyme (Komma) | Formel | SMILES | CAS | PubChem-CID | Kategorie | Kurzbeschreibung
 */
import { molarMass } from '../chem/formula';
import type { Substance } from './types';

const TABLE = `
Wasser|Aqua,Oxidan|H2O|O|7732-18-5|962|anorganisch|Wichtigstes Lösungsmittel, Ampholyt und Reaktionspartner
Ethanol|Ethylalkohol,Spiritus|C2H6O|CCO|64-17-5|702|Alkohol|Primärer Alkohol, Lösungsmittel und Desinfektionsmittel
Methanol|Methylalkohol|CH4O|CO|67-56-1|887|Alkohol|Giftiger primärer Alkohol, Grundstoff und Elektrolyt der Elektrosynthese
Propan-2-ol|Isopropanol|C3H8O|CC(C)O|67-63-0|3776|Alkohol|Sekundärer Alkohol, oxidierbar zu Aceton
Butan-1-ol|n-Butanol|C4H10O|CCCCO|71-36-3|263|Alkohol|Primärer Alkohol, Lösungsmittel
Glycerin|Propan-1,2,3-triol|C3H8O3|OCC(O)CO|56-81-5|753|Alkohol|Dreiwertiger Alkohol aus der Fettspaltung
Ethylenglycol|Ethan-1,2-diol|C2H6O2|OCCO|107-21-1|174|Alkohol|Zweiwertiger Alkohol, Frostschutz und Acetalbildner
Phenol|Carbolsäure|C6H6O|Oc1ccccc1|108-95-2|996|Aromat|Schwach saurer Aromat, stark aktivierend für Zweitsubstitution
Essigsäure|Ethansäure,Eisessig|C2H4O2|CC(=O)O|64-19-7|176|Carbonsäure|Schwache Säure, Ausgangsstoff für Ester und Acetate
Ameisensäure|Methansäure|CH2O2|OC=O|64-18-6|284|Carbonsäure|Einfachste Carbonsäure, zugleich Reduktionsmittel
Benzoesäure|Benzolcarbonsäure|C7H6O2|OC(=O)c1ccccc1|65-85-0|243|Carbonsäure|Feste Aromatencarbonsäure, gutes Umkristallisationsbeispiel
Salicylsäure|2-Hydroxybenzoesäure|C7H6O3|OC(=O)c1ccccc1O|69-72-7|338|Carbonsäure|Ausgangsstoff der Aspirin-Synthese
Oxalsäure|Ethandisäure|C2H2O4|OC(=O)C(=O)O|144-62-7|971|Carbonsäure|Dicarbonsäure, Urtitersubstanz für Permanganat
Citronensäure|Zitronensäure|C6H8O7|OC(=O)CC(O)(CC(=O)O)C(=O)O|77-92-9|311|Carbonsäure|Tricarbonsäure, Komplexbildner und Puffer
Stearinsäure|Octadecansäure|C18H36O2|CCCCCCCCCCCCCCCCCC(=O)O|57-11-4|5281|Carbonsäure|Gesättigte Fettsäure, Seifenbestandteil
Aceton|Propanon,Dimethylketon|C3H6O|CC(C)=O|67-64-1|180|Keton|Wichtigstes Keton und Lösungsmittel
Butanon|Methylethylketon|C4H8O|CCC(C)=O|78-93-3|6569|Keton|Lösungsmittel, Substrat für Reduktionen
Acetophenon|Phenylmethylketon|C8H8O|CC(=O)c1ccccc1|98-86-2|7410|Keton|Aromatisches Keton aus der Friedel-Crafts-Acylierung
Cyclohexanon||C6H10O|O=C1CCCCC1|108-94-1|7967|Keton|Vorstufe für Caprolactam und Adipinsäure
Formaldehyd|Methanal|CH2O|C=O|50-00-0|712|Aldehyd|Einfachster Aldehyd, Ausgangsstoff für Kunstharze
Acetaldehyd|Ethanal|C2H4O|CC=O|75-07-0|177|Aldehyd|Aldolbaustein, Zwischenprodukt des Alkoholabbaus
Benzaldehyd|Bittermandelöl|C7H6O|O=Cc1ccccc1|100-52-7|240|Aldehyd|Aromatischer Aldehyd ohne α-H, ideal für gekreuzte Aldolreaktionen
Vanillin|4-Hydroxy-3-methoxybenzaldehyd|C8H8O3|COc1cc(C=O)ccc1O|121-33-5|1183|Aldehyd|Aromastoff mit Phenol-, Ether- und Aldehydgruppe
Essigsäureethylester|Ethylacetat|C4H8O2|CCOC(C)=O|141-78-6|8857|Ester|Klassischer Fruchtester und Extraktionsmittel
Essigsäuremethylester|Methylacetat|C3H6O2|COC(C)=O|79-20-9|6584|Ester|Leichtflüchtiger Ester
Acetylsalicylsäure|Aspirin,ASS|C9H8O4|CC(=O)Oc1ccccc1C(=O)O|50-78-2|2244|Ester|Schmerzmittel, Produkt der Acetylierung von Salicylsäure
Malonsäurediethylester|Malonester|C7H12O4|CCOC(=O)CC(=O)OCC|105-53-3|7761|Ester|CH-acider Baustein für Michael- und Alkylierungsreaktionen
Acetanhydrid|Essigsäureanhydrid|C4H6O3|CC(=O)OC(C)=O|108-24-7|7918|Ester|Acylierungsmittel, milder als Acetylchlorid
Acetylchlorid|Ethanoylchlorid|C2H3ClO|CC(=O)Cl|75-36-5|6367|Säurechlorid|Sehr reaktives Acylierungsmittel
Benzoylchlorid||C7H5ClO|ClC(=O)c1ccccc1|98-88-4|7412|Säurechlorid|Aromatisches Säurechlorid für Schotten-Baumann
Acetamid|Ethanamid|C2H5NO|CC(N)=O|60-35-5|178|Amid|Einfachstes Carbonsäureamid
Harnstoff|Carbamid|CH4N2O|NC(N)=O|57-13-6|1176|Amid|Erste künstlich hergestellte organische Verbindung (Wöhler 1828)
Anilin|Aminobenzol|C6H7N|Nc1ccccc1|62-53-3|6115|Amin|Aromatisches Amin, Ausgangsstoff der Farbstoffchemie
Methylamin||CH5N|CN|74-89-5|6329|Amin|Einfachstes primäres Amin, starke Base
Triethylamin||C6H15N|CCN(CC)CC|121-44-8|8471|Amin|Hilfsbase, fängt HCl bei Acylierungen ab
Pyridin||C5H5N|c1ccncc1|110-86-1|1049|Amin|Aromatische Stickstoffbase und Lösungsmittel
Benzylamin||C7H9N|NCc1ccccc1|100-46-9|7504|Amin|Primäres Amin für Amidkupplungen
Acrylnitril|Propennitril|C3H3N|C=CC#N|107-13-1|7855|Nitril|Substrat der Baizer-Hydrodimerisierung zu Adipodinitril
Acetonitril||C2H3N|CC#N|75-05-8|6342|Nitril|Polar aprotisches Lösungsmittel der Elektrochemie
Adipodinitril|Hexandinitril|C6H8N2|N#CCCCCC#N|111-69-3|8128|Nitril|Zwischenprodukt der Nylon-6,6-Herstellung
Benzol||C6H6|c1ccccc1|71-43-2|241|Aromat|Grundkörper der Aromaten, krebserzeugend
Toluol|Methylbenzol|C7H8|Cc1ccccc1|108-88-3|1140|Aromat|Ersatz für Benzol, Substrat der Nitrierung
Naphthalin||C10H8|c1ccc2ccccc2c1|91-20-3|931|Aromat|Kondensierter Aromat
Nitrobenzol||C6H5NO2|[O-][N+](=O)c1ccccc1|98-95-3|7237|Aromat|Produkt der Nitrierung, Vorstufe von Anilin
Styrol|Vinylbenzol|C8H8|C=Cc1ccccc1|100-42-5|7501|Aromat|Monomer für Polystyrol
Furan||C4H4O|c1ccoc1|110-00-9|8029|Aromat|Heteroaromat, Substrat der anodischen Methoxylierung
Ethen|Ethylen|C2H4|C=C|74-85-1|6325|Alken|Wichtigstes Grundchemikalien-Alken
Propen|Propylen|C3H6|CC=C|115-07-1|8252|Alken|Substrat für Polypropylen und Cumol
Cyclohexen||C6H10|C1=CCCCC1|110-83-8|8079|Alken|Modellsubstrat für Additionen und Epoxidierungen
But-2-en||C4H8|CC=CC|107-01-7|62695|Alken|Cis/trans-isomeres Alken
Ethin|Acetylen|C2H2|C#C|74-86-2|6326|Alkin|Schweißgas und C2-Baustein
Brombenzol||C6H5Br|Brc1ccccc1|108-86-1|7961|Halogenverbindung|Substrat für Grignard- und Kreuzkupplungsreaktionen
1-Brombutan||C4H9Br|CCCCBr|109-65-9|8002|Halogenverbindung|Primäres Halogenalkan für SN2-Reaktionen
Chloroform|Trichlormethan|CHCl3|ClC(Cl)Cl|67-66-3|6212|Halogenverbindung|Lösungsmittel, krebsverdächtig
Dichlormethan|Methylenchlorid|CH2Cl2|ClCCl|75-09-2|6344|Halogenverbindung|Extraktionsmittel, niedrig siedend
tert-Butylchlorid|2-Chlor-2-methylpropan|C4H9Cl|CC(C)(C)Cl|507-20-0|10486|Halogenverbindung|Klassisches SN1-Substrat
Diethylether|Ether|C4H10O|CCOCC|60-29-7|3283|Ether|Lösungsmittel für Grignard-Reaktionen, peroxidbildend
Tetrahydrofuran|THF|C4H8O|C1CCOC1|109-99-9|8028|Ether|Cyclischer Ether, gutes Lösungsmittel für Hydride
Ethylenoxid|Oxiran|C2H4O|C1CO1|75-21-8|6354|Ether|Einfachstes Epoxid, krebserzeugend
Glucose|Traubenzucker,Dextrose|C6H12O6|OCC1OC(O)C(O)C(O)C1O|50-99-7|5793|Kohlenhydrat|Aldohexose, reduzierender Zucker
Saccharose|Rohrzucker|C12H22O11|OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O|57-50-1|5988|Kohlenhydrat|Disaccharid ohne reduzierende Gruppe
Glycin|Aminoessigsäure|C2H5NO2|NCC(=O)O|56-40-6|750|Aminosäure|Einfachste Aminosäure, Zwitterion
Alanin|2-Aminopropansäure|C3H7NO2|CC(N)C(=O)O|56-41-7|5950|Aminosäure|Proteinogene Aminosäure
TEMPO|2,2,6,6-Tetramethylpiperidinyloxyl|C9H18NO|CC1(C)CCCC(C)(C)N1[O]|2564-83-2|2724126|Mediator|Stabiles Nitroxylradikal als Oxidationsmediator
Natriumchlorid|Kochsalz,Steinsalz|NaCl||7647-14-5|5234|Salz|Ausgangsstoff der Chloralkali-Elektrolyse
Natriumhydroxid|Ätznatron,Natronlauge|NaOH||1310-73-2|14798|Base|Starke Base, Produkt der Chloralkali-Elektrolyse
Kaliumhydroxid|Ätzkali|KOH||1310-58-3|14797|Base|Elektrolyt der alkalischen Wasserelektrolyse
Ammoniak||NH3|N|7664-41-7|222|Base|Produkt des Haber-Bosch-Verfahrens
Schwefelsäure|Vitriolöl|H2SO4||7664-93-9|1118|Säure|Meistproduzierte Chemikalie, Katalysator und Trockenmittel
Salzsäure|Chlorwasserstoffsäure|HCl||7647-01-0|313|Säure|Starke Säure, Standardreagenz
Salpetersäure|Scheidewasser|HNO3||7697-37-2|944|Säure|Oxidierende Säure, Produkt des Ostwald-Verfahrens
Phosphorsäure|Orthophosphorsäure|H3PO4||7664-38-2|1004|Säure|Mittelstarke dreiprotonige Säure
Natriumcarbonat|Soda|Na2CO3||497-19-8|10340|Salz|Produkt des Solvay-Verfahrens
Natriumhydrogencarbonat|Natron,Backpulver|NaHCO3||144-55-8|516892|Salz|Zwischenprodukt im Solvay-Verfahren, mildes Neutralisationsmittel
Calciumcarbonat|Kalkstein,Marmor|CaCO3||471-34-1|10112|Salz|Rohstoff für Kalk, Soda und Hochofenzuschlag
Calciumoxid|gebrannter Kalk|CaO||1305-78-8|14778|Salz|Aus Kalkbrennen, reagiert heftig mit Wasser
Kupfersulfat|Kupfervitriol|CuSO4·5H2O||7758-99-8|24463|Salz|Blaues Kristallwassersalz, Elektrolyt der Kupferraffination
Kaliumpermanganat||KMnO4||7722-64-7|516875|Oxidationsmittel|Starkes Oxidationsmittel, tiefviolett
Kaliumdichromat||K2Cr2O7||7778-50-9|24502|Oxidationsmittel|Starkes Oxidationsmittel, krebserzeugend
Wasserstoffperoxid||H2O2|OO|7722-84-1|784|Oxidationsmittel|Oxidationsmittel mit Wasser als einzigem Nebenprodukt
Natriumborhydrid||NaBH4||16940-66-2|4311764|Reduktionsmittel|Mildes Hydrid für Aldehyde und Ketone
Lithiumaluminiumhydrid|LiAlH4|LiAlH4||16853-85-3|28112|Reduktionsmittel|Starkes Hydrid, reduziert auch Ester und Säuren
Eisen(III)-oxid|Hämatit,Rost|Fe2O3||1309-37-1|14833|Oxid|Oxidationsmittel der Thermitreaktion, Eisenerz
Aluminiumoxid|Tonerde,Korund|Al2O3||1344-28-1|9989226|Oxid|Ausgangsstoff der Schmelzflusselektrolyse
Titandioxid||TiO2||13463-67-7|26042|Oxid|Weißpigment und Photokatalysator
Siliciumdioxid|Quarz|SiO2||14808-60-7|24261|Oxid|Netzwerkoxid, Grundstoff für Glas
Kohlenstoffdioxid|Kohlendioxid|CO2|O=C=O|124-38-9|280|Gas|Treibhausgas und C1-Baustein der Elektrocarboxylierung
Kohlenstoffmonoxid||CO|[C-]#[O+]|630-08-0|281|Gas|Reduktionsmittel im Hochofen, sehr giftig
Wasserstoff||H2|[H][H]|1333-74-0|783|Gas|Energieträger, Produkt der Wasserelektrolyse
Sauerstoff||O2|O=O|7782-44-7|977|Gas|Oxidationsmittel, Anodenprodukt der Wasserelektrolyse
Stickstoff||N2|N#N|7727-37-9|947|Gas|Inertgas und Edukt des Haber-Bosch-Verfahrens
Chlor||Cl2|ClCl|7782-50-5|24526|Gas|Produkt der Chloralkali-Elektrolyse, giftig
Schwefeldioxid||SO2|O=S=O|7446-09-5|1119|Gas|Zwischenprodukt des Kontaktverfahrens
Schwefeltrioxid||SO3|O=S(=O)=O|7446-11-9|24682|Gas|Anhydrid der Schwefelsäure
Stickstoffmonoxid||NO|[N]=O|10102-43-9|145068|Gas|Zwischenprodukt des Ostwald-Verfahrens
Stickstoffdioxid||NO2|[O][N]=O|10102-44-0|3032552|Gas|Braunes, giftiges Gas
Methan|Erdgas|CH4|C|74-82-8|297|Alkan|Einfachstes Alkan, Rohstoff für Synthesegas
Propan||C3H8|CCC|74-98-6|6334|Alkan|Flüssiggas, Brennstoff
Cyclohexan||C6H12|C1CCCCC1|110-82-7|8078|Alkan|Unpolares Lösungsmittel, Vorstufe für Adipinsäure
Octan||C8H18|CCCCCCCC|111-65-9|356|Alkan|Referenzkohlenwasserstoff für die Octanzahl
Dimethylsulfoxid|DMSO|C2H6OS|CS(C)=O|67-68-5|679|Lösungsmittel|Polar aprotisch, Oxidationsmittel der Swern-Oxidation
N,N-Dimethylformamid|DMF|C3H7NO|CN(C)C=O|68-12-2|6228|Lösungsmittel|Polar aprotisch, reproduktionstoxisch
Ethylacetat-frei|Petrolether|C6H14|CCCCCC|110-54-3|8058|Lösungsmittel|Unpolares Extraktions- und Laufmittel
Phenolphthalein||C20H14O4|OC(=O)c1ccccc1|77-09-8|4764|Indikator|Säure-Base-Indikator, Umschlag bei pH 8,2–10
Coffein||C8H10N4O2|Cn1cnc2c1c(=O)n(C)c(=O)n2C|58-08-2|2519|Naturstoff|Alkaloid mit Purinstruktur
Paracetamol|Acetaminophen|C8H9NO2|CC(=O)Nc1ccc(O)cc1|103-90-2|1983|Wirkstoff|Analgetikum, Produkt einer Amidbildung
Ibuprofen||C13H18O2|CC(C)Cc1ccc(C(C)C(=O)O)cc1|15687-27-1|3672|Wirkstoff|Entzündungshemmer, Ziel der Elektrocarboxylierung
Phenylboronsäure||C6H7BO2|OB(O)c1ccccc1|98-80-6|10998|Boronsäure|Kupplungspartner der Suzuki-Reaktion
`.trim();

export const SUBSTANCES: Substance[] = TABLE.split('\n').map((line) => {
  const [name, synonyms, formula, smiles, cas, cid, category, description] = line.split('|');
  let mass = 0;
  try {
    mass = molarMass(formula);
  } catch {
    mass = 0;
  }
  return {
    name,
    synonyms: synonyms ? synonyms.split(',').filter(Boolean) : [],
    formula,
    smiles: smiles || undefined,
    molarMass: mass,
    cas: cas || undefined,
    pubchemCid: cid ? Number(cid) : undefined,
    category,
    description,
  };
});

export const SUBSTANCE_CATEGORIES = Array.from(
  new Set(SUBSTANCES.map((substance) => substance.category)),
).sort();

/** Volltextsuche über Name, Synonyme, Formel und CAS-Nummer. */
export function searchSubstances(query: string, limit = 20): Substance[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const scored = SUBSTANCES.map((substance) => {
    const name = substance.name.toLowerCase();
    const formula = substance.formula.toLowerCase();
    const synonyms = substance.synonyms.map((s) => s.toLowerCase());

    let score = 0;
    if (name === needle || formula === needle) score = 100;
    else if (synonyms.includes(needle)) score = 95;
    else if (substance.cas === needle) score = 90;
    else if (name.startsWith(needle)) score = 80;
    else if (synonyms.some((s) => s.startsWith(needle))) score = 70;
    else if (name.includes(needle)) score = 60;
    else if (formula.includes(needle)) score = 50;
    else if (synonyms.some((s) => s.includes(needle))) score = 45;
    else if (substance.description?.toLowerCase().includes(needle)) score = 20;

    return { substance, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.substance.name.localeCompare(b.substance.name));

  return scored.slice(0, limit).map((entry) => entry.substance);
}

export function substanceByName(name: string): Substance | undefined {
  const needle = name.trim().toLowerCase();
  return SUBSTANCES.find(
    (substance) =>
      substance.name.toLowerCase() === needle ||
      substance.synonyms.some((synonym) => synonym.toLowerCase() === needle),
  );
}

export function substanceByCid(cid: number): Substance | undefined {
  return SUBSTANCES.find((substance) => substance.pubchemCid === cid);
}
