/**
 * Erweiterte organische Stoffe.
 *
 * Format: Name | Synonyme (Semikolon) | Formel | SMILES | CAS | PubChem-CID | Kategorie | Beschreibung
 *
 * CAS-Nummer und CID bleiben hier bewusst leer: Die App löst sie bei
 * bestehender Internetverbindung über die Struktur bei PubChem auf, statt
 * ungeprüfte Kennungen mitzuliefern. Formel und SMILES werden in den Tests
 * gegeneinander geprüft.
 *
 * String.raw ist nötig, damit die Rückstriche der Doppelbindungs-Stereo-
 * chemie (z. B. C/C=C\C) erhalten bleiben.
 */
export const ORGANIC_TABLE = String.raw`
Ethan||C2H6|CC|||Alkan|Bestandteil des Erdgases, Rohstoff für Ethen
Butan|n-Butan|C4H10|CCCC|||Alkan|Feuerzeug- und Flüssiggas
Isobutan|2-Methylpropan|C4H10|CC(C)C|||Alkan|Verzweigtes Butanisomer, Kältemittel R600a
Pentan|n-Pentan|C5H12|CCCCC|||Alkan|Leichtflüchtiges Lösungsmittel
Isopentan|2-Methylbutan|C5H12|CCC(C)C|||Alkan|Verzweigtes Pentanisomer
Neopentan|2,2-Dimethylpropan|C5H12|CC(C)(C)C|||Alkan|Kugelförmiges Pentanisomer
Heptan|n-Heptan|C7H16|CCCCCCC|||Alkan|Referenzkraftstoff mit Octanzahl 0
Isooctan|2,2,4-Trimethylpentan|C8H18|CC(C)CC(C)(C)C|||Alkan|Referenzkraftstoff mit Octanzahl 100
Nonan||C9H20|CCCCCCCCC|||Alkan|Bestandteil von Kerosin
Decan||C10H22|CCCCCCCCCC|||Alkan|Unpolares Lösungsmittel, Bestandteil von Diesel
Dodecan||C12H26|CCCCCCCCCCCC|||Alkan|Langkettiges Alkan, Modellsubstanz für Kerosin
Hexadecan|Cetan|C16H34|CCCCCCCCCCCCCCCC|||Alkan|Referenzkraftstoff für die Cetanzahl
Cyclopropan||C3H6|C1CC1|||Alkan|Gespannter Dreiring, früher Narkosegas
Cyclopentan||C5H10|C1CCCC1|||Alkan|Treibmittel für Dämmschäume
Methylcyclohexan||C7H14|CC1CCCCC1|||Alkan|Lösungsmittel, Modell für die Sesselkonformation
Adamantan||C10H16|C1C2CC3CC1CC(C2)C3|||Alkan|Diamantartiges Käfigmolekül
But-1-en|1-Buten|C4H8|C=CCC|||Alken|Endständiges Alken, Comonomer für Polyethylen
Isobuten|2-Methylpropen|C4H8|C=C(C)C|||Alken|Rohstoff für MTBE und Butylkautschuk
Pent-1-en||C5H10|C=CCCC|||Alken|Endständiges Alken
Hex-1-en||C6H12|C=CCCCC|||Alken|Endständiges Alken, Modellsubstrat der Hydroborierung
Oct-1-en||C8H16|C=CCCCCCC|||Alken|Comonomer, Substrat der Hydroformylierung
Cyclopenten||C5H8|C1=CCCC1|||Alken|Cyclisches Alken
1-Methylcyclohexen||C7H12|CC1=CCCCC1|||Alken|Trisubstituiertes Alken, Modellsubstrat für die Markovnikov-Regel
Buta-1,3-dien|Butadien|C4H6|C=CC=C|||Alken|Konjugiertes Dien für Synthesekautschuk und Diels-Alder-Reaktionen
Isopren|2-Methylbuta-1,3-dien|C5H8|C=CC(C)=C|||Alken|Baustein des Naturkautschuks und der Terpene
Cyclopentadien|Cyclopenta-1,3-dien|C5H6|C1=CCC=C1|||Alken|Sehr reaktives Dien, dimerisiert bei Raumtemperatur
Norbornen|Bicyclo[2.2.1]hept-2-en|C7H10|C1CC2C=CC1C2|||Alken|Gespanntes bicyclisches Alken
Limonen||C10H16|CC1=CCC(CC1)C(C)=C|||Naturstoff|Terpen mit Zitrusduft aus Orangenschalen
alpha-Pinen|α-Pinen|C10H16|CC1=CCC2CC1C2(C)C|||Naturstoff|Terpen aus Terpentinöl
trans-Stilben|(E)-1,2-Diphenylethen|C14H12|c1ccc(/C=C/c2ccccc2)cc1|||Alken|Fluoreszierendes Diarylalken
alpha-Methylstyrol|2-Phenylpropen|C9H10|C=C(C)c1ccccc1|||Alken|Nebenprodukt der Cumol-Phenol-Synthese
Vinylchlorid|Chlorethen|C2H3Cl|C=CCl|||Halogenverbindung|Monomer für PVC, krebserzeugend
Propin|Methylacetylen|C3H4|CC#C|||Alkin|Einfachstes substituiertes Alkin
But-2-in|Dimethylacetylen|C4H6|CC#CC|||Alkin|Internes Alkin, Modellsubstrat der Lindlar-Hydrierung
Hex-1-in||C6H10|C#CCCCC|||Alkin|Terminales Alkin für Kupplungsreaktionen
Phenylacetylen|Ethinylbenzol|C8H6|C#Cc1ccccc1|||Alkin|Terminales Arylalkin, Partner der Sonogashira-Kupplung
Propargylalkohol|Prop-2-in-1-ol|C3H4O|C#CCO|||Alkohol|Alkinol, Baustein für Heterocyclen
Acrolein|Propenal|C3H4O|C=CC=O|||Aldehyd|Einfachster ungesättigter Aldehyd, stark reizend
Crotonaldehyd|But-2-enal|C4H6O|C/C=C/C=O|||Aldehyd|Aldolkondensationsprodukt des Acetaldehyds
Methylvinylketon|But-3-en-2-on|C4H6O|C=CC(C)=O|||Keton|Michael-Akzeptor, Baustein der Robinson-Anellierung
Mesityloxid|4-Methylpent-3-en-2-on|C6H10O|CC(=O)C=C(C)C|||Keton|Aldolkondensationsprodukt des Acetons
Acrylsäure|Propensäure|C3H4O2|C=CC(=O)O|||Carbonsäure|Monomer für Superabsorber und Acrylate
Methacrylsäure|2-Methylpropensäure|C4H6O2|C=C(C)C(=O)O|||Carbonsäure|Monomer für Methacrylate
Crotonsäure|(E)-But-2-ensäure|C4H6O2|C/C=C/C(=O)O|||Carbonsäure|Ungesättigte Carbonsäure
Sorbinsäure|Hexa-2,4-diensäure|C6H8O2|C/C=C/C=C/C(=O)O|||Carbonsäure|Konservierungsstoff E 200
Maleinsäure|(Z)-Butendisäure|C4H4O4|O=C(O)/C=C\C(=O)O|||Carbonsäure|cis-Isomer der Butendisäure, bildet ein cyclisches Anhydrid
Fumarsäure|(E)-Butendisäure|C4H4O4|O=C(O)/C=C/C(=O)O|||Carbonsäure|trans-Isomer der Butendisäure, Zwischenprodukt im Citratzyklus
Zimtsäure|(E)-3-Phenylprop-2-ensäure|C9H8O2|O=C(O)/C=C/c1ccccc1|||Carbonsäure|Produkt der Perkin- und Knoevenagel-Reaktion
Zimtaldehyd|(E)-3-Phenylprop-2-enal|C9H8O|O=C/C=C/c1ccccc1|||Aldehyd|Aromastoff des Zimts
Methylacrylat|Acrylsäuremethylester|C4H6O2|C=CC(=O)OC|||Ester|Monomer und Partner der Heck-Kupplung
Methylmethacrylat|MMA|C5H8O2|C=C(C)C(=O)OC|||Ester|Monomer für Acrylglas
Vinylacetat||C4H6O2|C=COC(C)=O|||Ester|Monomer für Polyvinylacetat
Maleinsäureanhydrid||C4H2O3|O=C1C=CC(=O)O1|||Säurederivat|Klassisches Dienophil der Diels-Alder-Reaktion
Ethylbenzol||C8H10|CCc1ccccc1|||Aromat|Vorstufe von Styrol
Cumol|Isopropylbenzol|C9H12|CC(C)c1ccccc1|||Aromat|Zwischenprodukt der Phenol-Aceton-Synthese
o-Xylol|1,2-Dimethylbenzol|C8H10|Cc1ccccc1C|||Aromat|Rohstoff für Phthalsäureanhydrid
m-Xylol|1,3-Dimethylbenzol|C8H10|Cc1cccc(C)c1|||Aromat|Xylolisomer
p-Xylol|1,4-Dimethylbenzol|C8H10|Cc1ccc(C)cc1|||Aromat|Rohstoff für Terephthalsäure und PET
Mesitylen|1,3,5-Trimethylbenzol|C9H12|Cc1cc(C)cc(C)c1|||Aromat|Symmetrisches Trimethylbenzol
tert-Butylbenzol||C10H14|CC(C)(C)c1ccccc1|||Aromat|Produkt der Friedel-Crafts-Alkylierung
Biphenyl|Diphenyl|C12H10|c1ccc(-c2ccccc2)cc1|||Aromat|Produkt der Suzuki-Kupplung von Brombenzol
Anthracen||C14H10|c1ccc2cc3ccccc3cc2c1|||Aromat|Linear kondensierter Aromat, fluoreszierend, Dien für Diels-Alder-Reaktionen
Phenanthren||C14H10|c1ccc2c(c1)ccc1ccccc12|||Aromat|Angular kondensierter Aromat
Anisol|Methoxybenzol|C7H8O|COc1ccccc1|||Aromat|Aktivierter Aromat für Zweitsubstitutionen
Chlorbenzol||C6H5Cl|Clc1ccccc1|||Halogenverbindung|Arylhalogenid und Lösungsmittel
Fluorbenzol||C6H5F|Fc1ccccc1|||Halogenverbindung|Arylfluorid
Iodbenzol||C6H5I|Ic1ccccc1|||Halogenverbindung|Reaktivstes Arylhalogenid für Kreuzkupplungen
4-Bromtoluol|p-Bromtoluol|C7H7Br|Cc1ccc(Br)cc1|||Halogenverbindung|Arylbromid für Kupplungsreaktionen
4-Bromanisol||C7H7BrO|COc1ccc(Br)cc1|||Halogenverbindung|Elektronenreiches Arylbromid
1-Bromnaphthalin||C10H7Br|Brc1cccc2ccccc12|||Halogenverbindung|Arylbromid des Naphthalins
4-Chlornitrobenzol|1-Chlor-4-nitrobenzol|C6H4ClNO2|O=[N+]([O-])c1ccc(Cl)cc1|||Aromat|Aktiviertes Substrat der nucleophilen aromatischen Substitution
2,4-Dinitrochlorbenzol|1-Chlor-2,4-dinitrobenzol|C6H3ClN2O4|O=[N+]([O-])c1ccc(Cl)c([N+](=O)[O-])c1|||Aromat|Stark aktiviertes SNAr-Substrat, hautsensibilisierend
4-Nitrotoluol|p-Nitrotoluol|C7H7NO2|Cc1ccc([N+](=O)[O-])cc1|||Aromat|Hauptprodukt der Toluolnitrierung
2-Nitrotoluol|o-Nitrotoluol|C7H7NO2|Cc1ccccc1[N+](=O)[O-]|||Aromat|Nebenprodukt der Toluolnitrierung
4-Nitrophenol|p-Nitrophenol|C6H5NO3|O=[N+]([O-])c1ccc(O)cc1|||Aromat|pH-Indikator (farblos/gelb), Vorstufe von Paracetamol
Thiophen||C4H4S|c1ccsc1|||Heteroaromat|Schwefelhaltiger Heteroaromat
Pyrrol||C4H5N|c1cc[nH]c1|||Heteroaromat|Elektronenreicher Heteroaromat, Baustein des Häms
Indol||C8H7N|c1ccc2[nH]ccc2c1|||Heteroaromat|Grundkörper von Tryptophan und Indigo
Chinolin||C9H7N|c1ccc2ncccc2c1|||Heteroaromat|Benzokondensiertes Pyridin
Imidazol||C3H4N2|c1c[nH]cn1|||Heteroaromat|Heteroaromat des Histidins
Pyrimidin||C4H4N2|c1cncnc1|||Heteroaromat|Grundkörper der Nucleobasen Cytosin, Thymin und Uracil
Furfural|Furan-2-carbaldehyd|C5H4O2|O=Cc1ccco1|||Aldehyd|Aus Pentosen gewonnener Aldehyd, nachwachsender Rohstoff
p-Kresol|4-Methylphenol|C7H8O|Cc1ccc(O)cc1|||Phenol|Phenol aus Steinkohlenteer
o-Kresol|2-Methylphenol|C7H8O|Cc1ccccc1O|||Phenol|Phenol, Vorstufe von Herbiziden
Brenzcatechin|Catechol;Benzol-1,2-diol|C6H6O2|Oc1ccccc1O|||Phenol|Zweiwertiges Phenol, Reduktionsmittel
Resorcin|Benzol-1,3-diol|C6H6O2|Oc1cccc(O)c1|||Phenol|Baustein von Fluorescein und Harzen
Hydrochinon|Benzol-1,4-diol|C6H6O2|Oc1ccc(O)cc1|||Phenol|Fotografischer Entwickler, oxidierbar zum Chinon
1-Naphthol|Naphthalen-1-ol|C10H8O|Oc1cccc2ccccc12|||Phenol|Kupplungskomponente für Azofarbstoffe
2-Naphthol|β-Naphthol|C10H8O|Oc1ccc2ccccc2c1|||Phenol|Klassische Kupplungskomponente für Azofarbstoffe
Guajacol|2-Methoxyphenol|C7H8O2|COc1ccccc1O|||Phenol|Aromastoff aus Holzrauch
Eugenol|4-Allyl-2-methoxyphenol|C10H12O2|C=CCc1ccc(O)c(OC)c1|||Naturstoff|Hauptbestandteil des Nelkenöls
Thymol|2-Isopropyl-5-methylphenol|C10H14O|Cc1ccc(C(C)C)c(O)c1|||Naturstoff|Antiseptischer Inhaltsstoff des Thymians
Bisphenol A|4,4'-Isopropylidendiphenol|C15H16O2|CC(C)(c1ccc(O)cc1)c1ccc(O)cc1|||Phenol|Monomer für Polycarbonat und Epoxidharze
4-Aminophenol|p-Aminophenol|C6H7NO|Nc1ccc(O)cc1|||Amin|Vorstufe von Paracetamol, fotografischer Entwickler
4-Nitroanilin|p-Nitroanilin|C6H6N2O2|Nc1ccc([N+](=O)[O-])cc1|||Amin|Schwach basisches Anilin, Diazokomponente
p-Toluidin|4-Methylanilin|C7H9N|Cc1ccc(N)cc1|||Amin|Aromatisches Amin
N,N-Dimethylanilin||C8H11N|CN(C)c1ccccc1|||Amin|Kupplungskomponente für Methylorange
N-Methylanilin||C7H9N|CNc1ccccc1|||Amin|Sekundäres aromatisches Amin
Diphenylamin||C12H11N|c1ccc(Nc2ccccc2)cc1|||Amin|Stabilisator und Redoxindikator
o-Phenylendiamin|Benzol-1,2-diamin|C6H8N2|Nc1ccccc1N|||Amin|Baustein für Benzimidazole
Sulfanilsäure|4-Aminobenzolsulfonsäure|C6H7NO3S|Nc1ccc(S(=O)(=O)O)cc1|||Amin|Diazokomponente für Methylorange
Acetanilid|N-Phenylacetamid|C8H9NO|CC(=O)Nc1ccccc1|||Amid|Acetyliertes Anilin, frühes Fiebermittel
Benzonitril||C7H5N|N#Cc1ccccc1|||Nitril|Aromatisches Nitril
Benzamid||C7H7NO|NC(=O)c1ccccc1|||Amid|Aromatisches Carbonsäureamid
Phenylhydrazin||C6H8N2|NNc1ccccc1|||Amin|Reagenz der Fischer-Indolsynthese, giftig
Benzylalkohol|Phenylmethanol|C7H8O|OCc1ccccc1|||Alkohol|Aromatischer primärer Alkohol
Benzylchlorid|Chlormethylbenzol|C7H7Cl|ClCc1ccccc1|||Halogenverbindung|Benzylierungsmittel, tränenreizend
Benzylbromid|Brommethylbenzol|C7H7Br|BrCc1ccccc1|||Halogenverbindung|Reaktives Benzylierungsmittel für Schutzgruppen
2-Phenylethanol|Phenethylalkohol|C8H10O|OCCc1ccccc1|||Alkohol|Duftstoff mit Rosengeruch
1-Phenylethanol||C8H10O|CC(O)c1ccccc1|||Alkohol|Sekundärer Alkohol aus der Acetophenonreduktion
Diphenylmethanol|Benzhydrol|C13H12O|OC(c1ccccc1)c1ccccc1|||Alkohol|Reduktionsprodukt des Benzophenons
Triphenylmethanol||C19H16O|OC(c1ccccc1)(c1ccccc1)c1ccccc1|||Alkohol|Klassisches Produkt der Grignard-Reaktion
Benzophenon|Diphenylketon|C13H10O|O=C(c1ccccc1)c1ccccc1|||Keton|Diarylketon, Photoinitiator
Benzil|Diphenylethandion|C14H10O2|O=C(C(=O)c1ccccc1)c1ccccc1|||Keton|1,2-Diketon aus der Benzoinoxidation
Benzoin|2-Hydroxy-1,2-diphenylethanon|C14H12O2|OC(C(=O)c1ccccc1)c1ccccc1|||Keton|Produkt der Benzoinkondensation
Chalkon|(E)-1,3-Diphenylprop-2-en-1-on|C15H12O|O=C(/C=C/c1ccccc1)c1ccccc1|||Keton|Grundkörper der Flavonoide, Produkt der Claisen-Schmidt-Kondensation
Dibenzalaceton|Dibenzylidenaceton|C17H14O|O=C(/C=C/c1ccccc1)/C=C/c1ccccc1|||Keton|Gelber UV-Filter, klassische Praktikumssynthese
Benzalaceton|(E)-4-Phenylbut-3-en-2-on|C10H10O|CC(=O)/C=C/c1ccccc1|||Keton|Einfaches Kondensationsprodukt aus Benzaldehyd und Aceton
4-Methoxyacetophenon||C9H10O2|COc1ccc(C(C)=O)cc1|||Keton|Produkt der Friedel-Crafts-Acylierung von Anisol
Anisaldehyd|4-Methoxybenzaldehyd|C8H8O2|COc1ccc(C=O)cc1|||Aldehyd|Aromastoff mit Anisduft
4-Chlorbenzaldehyd||C7H5ClO|O=Cc1ccc(Cl)cc1|||Aldehyd|Aromatischer Aldehyd
4-Nitrobenzaldehyd||C7H5NO3|O=Cc1ccc([N+](=O)[O-])cc1|||Aldehyd|Stark elektrophiler aromatischer Aldehyd
2-Nitrobenzaldehyd||C7H5NO3|O=Cc1ccccc1[N+](=O)[O-]|||Aldehyd|Ausgangsstoff der Indigosynthese nach Baeyer und Drewson
Salicylaldehyd|2-Hydroxybenzaldehyd|C7H6O2|O=Cc1ccccc1O|||Aldehyd|Produkt der Reimer-Tiemann-Reaktion, Baustein für Cumarin
Methylbenzoat|Benzoesäuremethylester|C8H8O2|COC(=O)c1ccccc1|||Ester|Aromatischer Ester, Nitrierungssubstrat im Praktikum
Ethylbenzoat|Benzoesäureethylester|C9H10O2|CCOC(=O)c1ccccc1|||Ester|Aromatischer Ester
Methylsalicylat|Salicylsäuremethylester;Wintergrünöl|C8H8O3|COC(=O)c1ccccc1O|||Ester|Wintergrünöl, klassische Veresterung im Schulversuch
Benzylacetat|Essigsäurebenzylester|C9H10O2|CC(=O)OCc1ccccc1|||Ester|Duftstoff mit Jasmingeruch
Phenylacetat|Essigsäurephenylester|C8H8O2|CC(=O)Oc1ccccc1|||Ester|Ester eines Phenols
Phthalsäureanhydrid||C8H4O3|O=C1OC(=O)c2ccccc12|||Säurederivat|Baustein für Farbstoffe und Weichmacher
Phthalsäure|Benzol-1,2-dicarbonsäure|C8H6O4|O=C(O)c1ccccc1C(=O)O|||Carbonsäure|Aromatische Dicarbonsäure
Terephthalsäure|Benzol-1,4-dicarbonsäure|C8H6O4|O=C(O)c1ccc(C(=O)O)cc1|||Carbonsäure|Monomer für PET
4-Aminobenzoesäure|PABA|C7H7NO2|Nc1ccc(C(=O)O)cc1|||Carbonsäure|Vorstufe von Benzocain
Benzocain|4-Aminobenzoesäureethylester|C9H11NO2|CCOC(=O)c1ccc(N)cc1|||Wirkstoff|Lokalanästhetikum, Produkt einer Fischer-Veresterung
4-Hydroxybenzoesäure||C7H6O3|O=C(O)c1ccc(O)cc1|||Carbonsäure|Grundkörper der Parabene
Gallussäure|3,4,5-Trihydroxybenzoesäure|C7H6O5|O=C(O)c1cc(O)c(O)c(O)c1|||Carbonsäure|Gerbstoffbaustein, Bestandteil von Eisengallustinte
4-Nitrobenzoesäure||C7H5NO4|O=C(O)c1ccc([N+](=O)[O-])cc1|||Carbonsäure|Oxidationsprodukt des 4-Nitrotoluols
3-Nitrobenzoesäure||C7H5NO4|O=C(O)c1cccc([N+](=O)[O-])c1|||Carbonsäure|Nitrierungsprodukt der Benzoesäure (meta-Stellung)
4-Chlorbenzoesäure||C7H5ClO2|O=C(O)c1ccc(Cl)cc1|||Carbonsäure|Halogenierte Benzoesäure
p-Toluylsäure|4-Methylbenzoesäure|C8H8O2|Cc1ccc(C(=O)O)cc1|||Carbonsäure|Methylierte Benzoesäure
Nicotinsäure|Niacin;Vitamin B3|C6H5NO2|O=C(O)c1cccnc1|||Carbonsäure|Pyridincarbonsäure, Vitamin
Nicotinamid||C6H6N2O|NC(=O)c1cccnc1|||Wirkstoff|Vitamin-B3-Amid
Indigo||C16H10N2O2|O=C1C(=C2Nc3ccccc3C2=O)Nc2ccccc21|||Farbstoff|Blauer Küpenfarbstoff der Jeans
Fluorescein||C20H12O5|O=C1OC2(c3ccc(O)cc3Oc3cc(O)ccc32)c2ccccc12|||Farbstoff|Leuchtend grün fluoreszierender Farbstoff
Methylorange|Helianthin|C14H14N3NaO3S|CN(C)c1ccc(/N=N/c2ccc(S(=O)(=O)[O-])cc2)cc1.[Na+]|||Indikator|Säure-Base-Indikator (rot/gelb, Umschlag bei pH 3,1–4,4)
Azobenzol||C12H10N2|c1ccc(/N=N/c2ccccc2)cc1|||Farbstoff|Einfachster Azofarbstoff, durch Licht schaltbar
Cumarin|2H-Chromen-2-on|C9H6O2|O=c1ccc2ccccc2o1|||Naturstoff|Duftstoff des Waldmeisters
7-Hydroxy-4-methylcumarin|Hymecromon|C10H8O3|Cc1cc(=O)oc2cc(O)ccc12|||Naturstoff|Produkt der Pechmann-Kondensation, fluoresziert blau
Anthrachinon||C14H8O2|O=C1c2ccccc2C(=O)c2ccccc21|||Keton|Grundkörper vieler Farbstoffe
p-Benzochinon|Chinon|C6H4O2|O=C1C=CC(=O)C=C1|||Keton|Oxidationsprodukt des Hydrochinons, Dienophil
Diphenylether||C12H10O|c1ccc(Oc2ccccc2)cc1|||Ether|Wärmeträger mit Geraniengeruch
Propan-1-ol|n-Propanol|C3H8O|CCCO|||Alkohol|Primärer Alkohol
Butan-2-ol|sec-Butanol|C4H10O|CCC(C)O|||Alkohol|Sekundärer Alkohol mit Stereozentrum
Isobutanol|2-Methylpropan-1-ol|C4H10O|CC(C)CO|||Alkohol|Primärer Alkohol, Produkt der Hydroborierung von Isobuten
tert-Butanol|2-Methylpropan-2-ol|C4H10O|CC(C)(C)O|||Alkohol|Tertiärer Alkohol, Modellsubstrat für SN1-Reaktionen
Pentan-1-ol|n-Pentanol;Amylalkohol|C5H12O|CCCCCO|||Alkohol|Primärer Alkohol
Isoamylalkohol|3-Methylbutan-1-ol|C5H12O|CC(C)CCO|||Alkohol|Fuselölbestandteil, Baustein des Bananenaromas
2-Methylbutan-2-ol|tert-Amylalkohol|C5H12O|CCC(C)(C)O|||Alkohol|Tertiärer Alkohol
Hexan-1-ol||C6H14O|CCCCCCO|||Alkohol|Primärer Alkohol mit Grasgeruch
Octan-1-ol||C8H18O|CCCCCCCCO|||Alkohol|Referenzsubstanz für den Octanol-Wasser-Verteilungskoeffizienten
Dodecan-1-ol|Laurylalkohol|C12H26O|CCCCCCCCCCCCO|||Alkohol|Fettalkohol für Tenside
2-Ethylhexanol||C8H18O|CCCCC(CC)CO|||Alkohol|Weichmacheralkohol
Cyclohexanol||C6H12O|OC1CCCCC1|||Alkohol|Sekundärer Alkohol, Dehydratisierung zu Cyclohexen
Cyclopentanol||C5H10O|OC1CCCC1|||Alkohol|Cyclischer sekundärer Alkohol
Allylalkohol|Prop-2-en-1-ol|C3H6O|C=CCO|||Alkohol|Ungesättigter Alkohol, sehr giftig
Propan-1,2-diol|Propylenglycol|C3H8O2|CC(O)CO|||Alkohol|Lebensmittelzusatz und Frostschutzmittel
Propan-1,3-diol||C3H8O2|OCCCO|||Alkohol|Monomer für Polyester
Sorbit|Glucitol|C6H14O6|OCC(O)C(O)C(O)C(O)CO|||Kohlenhydrat|Zuckeralkohol, Süßungsmittel
Menthol||C10H20O|CC(C)C1CCC(C)CC1O|||Naturstoff|Kühlender Inhaltsstoff der Pfefferminze
Geraniol||C10H18O|CC(C)=CCC/C(C)=C/CO|||Naturstoff|Terpenalkohol mit Rosenduft
Linalool||C10H18O|C=CC(C)(O)CCC=C(C)C|||Naturstoff|Tertiärer Terpenalkohol mit Lavendelduft
Dimethylether|Methoxymethan|C2H6O|COC|||Ether|Treibgas, einfachster Ether
MTBE|Methyl-tert-butylether|C5H12O|COC(C)(C)C|||Ether|Kraftstoffzusatz und Lösungsmittel
Diisopropylether||C6H14O|CC(C)OC(C)C|||Ether|Extraktionsmittel, starker Peroxidbildner
1,4-Dioxan|Dioxan|C4H8O2|C1COCCO1|||Ether|Wassermischbarer Ether, krebsverdächtig
2-Methyltetrahydrofuran|2-MeTHF|C5H10O|CC1CCCO1|||Ether|Nachhaltiger Ersatz für THF und Dichlormethan
Dimethoxyethan|Glyme|C4H10O2|COCCOC|||Ether|Chelatisierendes Ether-Lösungsmittel
Tetrahydropyran|Oxan|C5H10O|C1CCOCC1|||Ether|Sechsgliedriger cyclischer Ether
3,4-Dihydro-2H-pyran|DHP|C5H8O|C1=COCCC1|||Ether|Reagenz für THP-Schutzgruppen
Propylenoxid|Methyloxiran|C3H6O|CC1CO1|||Ether|Epoxid, Rohstoff für Polyurethane
Epichlorhydrin||C3H5ClO|ClCC1CO1|||Ether|Epoxid für Epoxidharze, krebserzeugend
Styroloxid|Phenyloxiran|C8H8O|C1OC1c1ccccc1|||Ether|Epoxid des Styrols
Cyclohexenoxid|7-Oxabicyclo[4.1.0]heptan|C6H10O|C1CCC2OC2C1|||Ether|Epoxid des Cyclohexens
Propanal|Propionaldehyd|C3H6O|CCC=O|||Aldehyd|Aliphatischer Aldehyd
Butanal|Butyraldehyd|C4H8O|CCCC=O|||Aldehyd|Produkt der Hydroformylierung von Propen
Isobutyraldehyd|2-Methylpropanal|C4H8O|CC(C)C=O|||Aldehyd|Verzweigter Aldehyd mit nur einem α-Wasserstoffatom
Pentanal|Valeraldehyd|C5H10O|CCCCC=O|||Aldehyd|Aliphatischer Aldehyd
Hexanal||C6H12O|CCCCCC=O|||Aldehyd|Geruch frisch gemähten Grases
Pivalaldehyd|2,2-Dimethylpropanal|C5H10O|CC(C)(C)C=O|||Aldehyd|Aldehyd ohne α-Wasserstoff, Substrat der Cannizzaro-Reaktion
Glyoxal|Ethandial|C2H2O2|O=CC=O|||Aldehyd|Einfachster Dialdehyd
Citral|Geranial|C10H16O|CC(C)=CCC/C(C)=C/C=O|||Naturstoff|Terpenaldehyd mit Zitronenduft
Pentan-2-on|Methylpropylketon|C5H10O|CCCC(C)=O|||Keton|Methylketon, Substrat der Haloformreaktion
Pentan-3-on|Diethylketon|C5H10O|CCC(=O)CC|||Keton|Symmetrisches Keton
3-Methylbutan-2-on|Methylisopropylketon|C5H10O|CC(=O)C(C)C|||Keton|Verzweigtes Methylketon
MIBK|4-Methylpentan-2-on;Methylisobutylketon|C6H12O|CC(=O)CC(C)C|||Keton|Extraktionsmittel
Cyclopentanon||C5H8O|O=C1CCCC1|||Keton|Cyclisches Keton
2-Methylcyclohexanon||C7H12O|CC1CCCCC1=O|||Keton|Unsymmetrisches cyclisches Keton
Acetylaceton|Pentan-2,4-dion|C5H8O2|CC(=O)CC(C)=O|||Keton|β-Diketon und Komplexbildner, teilweise als Enol
Acetessigester|Acetessigsäureethylester|C6H10O3|CCOC(=O)CC(C)=O|||Ester|β-Ketoester für Acetessigester-Synthesen
Diacetyl|Butandion|C4H6O2|CC(=O)C(C)=O|||Keton|Butteraroma
Hexan-2,5-dion|Acetonylaceton|C6H10O2|CC(=O)CCC(C)=O|||Keton|1,4-Diketon für die Paal-Knorr-Synthese
Campher||C10H16O|CC1(C)C2CCC1(C)C(=O)C2|||Naturstoff|Bicyclisches Terpenketon
Carvon||C10H14O|CC1=CCC(CC1=O)C(C)=C|||Naturstoff|Minz- oder Kümmelduft, je nach Enantiomer
Levulinsäure|4-Oxopentansäure|C5H8O3|CC(=O)CCC(=O)O|||Carbonsäure|Plattformchemikalie aus Biomasse
Propionsäure|Propansäure|C3H6O2|CCC(=O)O|||Carbonsäure|Konservierungsstoff E 280
Buttersäure|Butansäure|C4H8O2|CCCC(=O)O|||Carbonsäure|Riecht nach ranziger Butter
Isobuttersäure|2-Methylpropansäure|C4H8O2|CC(C)C(=O)O|||Carbonsäure|Verzweigte Carbonsäure
Valeriansäure|Pentansäure|C5H10O2|CCCCC(=O)O|||Carbonsäure|Übelriechende Carbonsäure, Substrat der Kolbe-Elektrolyse
Isovaleriansäure|3-Methylbutansäure|C5H10O2|CC(C)CC(=O)O|||Carbonsäure|Geruch nach Schweißfüßen
Hexansäure|Capronsäure|C6H12O2|CCCCCC(=O)O|||Carbonsäure|Mittelkettige Fettsäure
Octansäure|Caprylsäure|C8H16O2|CCCCCCCC(=O)O|||Carbonsäure|Fettsäure aus Kokosöl
Laurinsäure|Dodecansäure|C12H24O2|CCCCCCCCCCCC(=O)O|||Carbonsäure|Fettsäure aus Kokos- und Palmkernfett
Palmitinsäure|Hexadecansäure|C16H32O2|CCCCCCCCCCCCCCCC(=O)O|||Carbonsäure|Häufigste gesättigte Fettsäure
Ölsäure|(Z)-Octadec-9-ensäure|C18H34O2|CCCCCCCC/C=C\CCCCCCCC(=O)O|||Carbonsäure|Einfach ungesättigte Fettsäure des Olivenöls
Linolsäure|(9Z,12Z)-Octadeca-9,12-diensäure|C18H32O2|CCCCC/C=C\C/C=C\CCCCCCCC(=O)O|||Carbonsäure|Essentielle Omega-6-Fettsäure
Chloressigsäure|Monochloressigsäure|C2H3ClO2|O=C(O)CCl|||Carbonsäure|Starke, giftige Säure für Carboxymethylierungen
Trichloressigsäure|TCA|C2HCl3O2|O=C(O)C(Cl)(Cl)Cl|||Carbonsäure|Sehr starke organische Säure, fällt Proteine aus
Trifluoressigsäure|TFA|C2HF3O2|O=C(O)C(F)(F)F|||Carbonsäure|Sehr starke Säure zur Abspaltung von Boc-Schutzgruppen
Glycolsäure|Hydroxyessigsäure|C2H4O3|O=C(O)CO|||Carbonsäure|Einfachste α-Hydroxysäure
Milchsäure|2-Hydroxypropansäure|C3H6O3|CC(O)C(=O)O|||Carbonsäure|Gärungsprodukt, Monomer für Polymilchsäure
Brenztraubensäure|2-Oxopropansäure|C3H4O3|CC(=O)C(=O)O|||Carbonsäure|Endprodukt der Glykolyse
Malonsäure|Propandisäure|C3H4O4|O=C(O)CC(=O)O|||Carbonsäure|Dicarbonsäure für Knoevenagel-Kondensationen
Bernsteinsäure|Butandisäure|C4H6O4|O=C(O)CCC(=O)O|||Carbonsäure|Dicarbonsäure des Citratzyklus
Glutarsäure|Pentandisäure|C5H8O4|O=C(O)CCCC(=O)O|||Carbonsäure|Dicarbonsäure
Adipinsäure|Hexandisäure|C6H10O4|O=C(O)CCCCC(=O)O|||Carbonsäure|Monomer für Nylon-6,6
Sebacinsäure|Decandisäure|C10H18O4|O=C(O)CCCCCCCCC(=O)O|||Carbonsäure|Dicarbonsäure aus Rizinusöl, Monomer für Nylon-6,10
Weinsäure|2,3-Dihydroxybutandisäure|C4H6O6|O=C(O)C(O)C(O)C(=O)O|||Carbonsäure|Fruchtsäure aus Weinstein
Äpfelsäure|2-Hydroxybutandisäure|C4H6O5|O=C(O)CC(O)C(=O)O|||Carbonsäure|Fruchtsäure der Äpfel
Ascorbinsäure|Vitamin C|C6H8O6|OCC(O)C1OC(=O)C(O)=C1O|||Naturstoff|Vitamin C, starkes Reduktionsmittel (Endiol, keine Carboxygruppe)
Propylacetat|Essigsäurepropylester|C5H10O2|CCCOC(C)=O|||Ester|Birnenaroma
Butylacetat|Essigsäurebutylester|C6H12O2|CCCCOC(C)=O|||Ester|Lösungsmittel für Lacke
Isopropylacetat|Essigsäureisopropylester|C5H10O2|CC(C)OC(C)=O|||Ester|Lösungsmittel
Isoamylacetat|Essigsäureisoamylester;Bananenöl|C7H14O2|CC(=O)OCCC(C)C|||Ester|Bananenaroma, klassischer Schulversuch
Pentylacetat|Essigsäurepentylester|C7H14O2|CCCCCOC(C)=O|||Ester|Fruchtester
Ethylformiat|Ameisensäureethylester|C3H6O2|CCOC=O|||Ester|Rumaroma
Methylformiat|Ameisensäuremethylester|C2H4O2|COC=O|||Ester|Leichtflüchtiger Ester
Ethylpropionat|Propansäureethylester|C5H10O2|CCOC(=O)CC|||Ester|Fruchtester
Ethylbutyrat|Buttersäureethylester|C6H12O2|CCCC(=O)OCC|||Ester|Ananasaroma
Methylbutyrat|Buttersäuremethylester|C5H10O2|CCCC(=O)OC|||Ester|Apfelaroma
Ethyllactat|Milchsäureethylester|C5H10O3|CCOC(=O)C(C)O|||Ester|Biologisch abbaubares Lösungsmittel
Dimethylcarbonat||C3H6O3|COC(=O)OC|||Ester|Grünes Methylierungsmittel und Lösungsmittel
Ethylencarbonat|1,3-Dioxolan-2-on|C3H4O3|O=C1OCCO1|||Ester|Elektrolytlösungsmittel in Lithium-Ionen-Akkus
Propylencarbonat||C4H6O3|CC1COC(=O)O1|||Ester|Polar aprotisches Lösungsmittel der Elektrochemie
epsilon-Caprolacton|ε-Caprolacton|C6H10O2|O=C1CCCCCO1|||Ester|Lacton aus der Baeyer-Villiger-Oxidation von Cyclohexanon
Diethyloxalat|Oxalsäurediethylester|C6H10O4|CCOC(=O)C(=O)OCC|||Ester|Acylierungsmittel für Claisen-Kondensationen
Dimethylmalonat|Malonsäuredimethylester|C5H8O4|COC(=O)CC(=O)OC|||Ester|CH-acider Malonester
Diethylsuccinat|Bernsteinsäurediethylester|C8H14O4|CCOC(=O)CCC(=O)OCC|||Ester|Diester der Bernsteinsäure
Dimethylterephthalat||C10H10O4|COC(=O)c1ccc(C(=O)OC)cc1|||Ester|Rohstoff für PET
Triacetin|Glycerintriacetat|C9H14O6|CC(=O)OCC(COC(C)=O)OC(C)=O|||Fett|Triglycerid der Essigsäure, Lebensmittelzusatz
Tristearin|Glycerintristearat|C57H110O6|CCCCCCCCCCCCCCCCCC(=O)OCC(COC(=O)CCCCCCCCCCCCCCCCC)OC(=O)CCCCCCCCCCCCCCCCC|||Fett|Gesättigtes Fett, Rohstoff der Seifenherstellung
Triolein|Glycerintrioleat|C57H104O6|CCCCCCCC/C=C\CCCCCCCC(=O)OCC(COC(=O)CCCCCCC/C=C\CCCCCCCC)OC(=O)CCCCCCC/C=C\CCCCCCCC|||Fett|Hauptbestandteil des Olivenöls
Methylstearat|Stearinsäuremethylester|C19H38O2|CCCCCCCCCCCCCCCCCC(=O)OC|||Ester|Biodieselbestandteil (Fettsäuremethylester)
Methyloleat|Ölsäuremethylester|C19H36O2|CCCCCCCC/C=C\CCCCCCCC(=O)OC|||Ester|Hauptbestandteil von Rapsöl-Biodiesel
Methylcinnamat|Zimtsäuremethylester|C10H10O2|COC(=O)/C=C/c1ccccc1|||Ester|Erdbeeraroma
Triethylphosphonoacetat|Phosphonoessigsäuretriethylester|C8H17O5P|CCOC(=O)CP(=O)(OCC)OCC|||Reagenz|Reagenz der Horner-Wadsworth-Emmons-Reaktion
Propionylchlorid|Propanoylchlorid|C3H5ClO|CCC(=O)Cl|||Säurechlorid|Acylierungsmittel
Butyrylchlorid|Butanoylchlorid|C4H7ClO|CCCC(=O)Cl|||Säurechlorid|Acylierungsmittel
Oxalylchlorid||C2Cl2O2|O=C(Cl)C(=O)Cl|||Säurechlorid|Aktivator der Swern-Oxidation und Chlorierungsmittel
Chloracetylchlorid||C2H2Cl2O|O=C(Cl)CCl|||Säurechlorid|Bifunktionelles Acylierungsmittel
Adipoylchlorid|Hexandioyldichlorid|C6H8Cl2O2|O=C(Cl)CCCCC(=O)Cl|||Säurechlorid|Monomer für Nylon-6,6 im Grenzflächenversuch
Sebacoylchlorid|Decandioyldichlorid|C10H16Cl2O2|O=C(Cl)CCCCCCCCC(=O)Cl|||Säurechlorid|Monomer für den Nylonseil-Versuch
Terephthaloylchlorid||C8H4Cl2O2|O=C(Cl)c1ccc(C(=O)Cl)cc1|||Säurechlorid|Monomer für Aramidfasern
Bernsteinsäureanhydrid|Succinanhydrid|C4H4O3|O=C1CCC(=O)O1|||Säurederivat|Cyclisches Anhydrid für Friedel-Crafts-Acylierungen
N,N-Dimethylacetamid|DMAc|C4H9NO|CC(=O)N(C)C|||Lösungsmittel|Polar aprotisches Lösungsmittel
N-Methylpyrrolidon|NMP|C5H9NO|CN1CCCC1=O|||Lösungsmittel|Polar aprotisches Lösungsmittel, reproduktionstoxisch
Formamid|Methanamid|CH3NO|NC=O|||Amid|Einfachstes Amid, polares Lösungsmittel
Caprolactam|ε-Caprolactam|C6H11NO|O=C1CCCCCN1|||Amid|Monomer für Nylon-6, Produkt der Beckmann-Umlagerung
Phthalimid||C8H5NO2|O=C1NC(=O)c2ccccc12|||Amid|Stickstoffquelle der Gabriel-Synthese
Kaliumphthalimid||C8H4KNO2|O=C1[N-]C(=O)c2ccccc12.[K+]|||Reagenz|Nucleophil der Gabriel-Synthese
Succinimid||C4H5NO2|O=C1CCC(=O)N1|||Amid|Cyclisches Imid
N-Bromsuccinimid|NBS|C4H4BrNO2|O=C1CCC(=O)N1Br|||Reagenz|Bromierungsmittel für allylische und benzylische Positionen
N-Chlorsuccinimid|NCS|C4H4ClNO2|O=C1CCC(=O)N1Cl|||Reagenz|Chlorierungsmittel
Thioharnstoff|Thiocarbamid|CH4N2S|NC(N)=S|||Amid|Schwefelanalogon des Harnstoffs, Baustein für Thiazole
Boc-Anhydrid|Di-tert-butyldicarbonat|C10H18O5|CC(C)(C)OC(=O)OC(=O)OC(C)(C)C|||Reagenz|Reagenz zur Einführung der Boc-Schutzgruppe
Chlorameisensäurebenzylester|Cbz-Chlorid;Benzylchlorformiat|C8H7ClO2|O=C(Cl)OCc1ccccc1|||Reagenz|Reagenz für die Cbz-Schutzgruppe
DCC|N,N'-Dicyclohexylcarbodiimid|C13H22N2|C(=NC1CCCCC1)=NC1CCCCC1|||Reagenz|Kupplungsreagenz der Steglich-Veresterung, stark sensibilisierend
DMAP|4-Dimethylaminopyridin|C7H10N2|CN(C)c1ccncc1|||Katalysator|Acylierungskatalysator
Tosylchlorid|p-Toluolsulfonylchlorid|C7H7ClO2S|Cc1ccc(S(=O)(=O)Cl)cc1|||Reagenz|Überführt Alkohole in Tosylate
Mesylchlorid|Methansulfonylchlorid|CH3ClO2S|CS(=O)(=O)Cl|||Reagenz|Überführt Alkohole in Mesylate
p-Toluolsulfonsäure|Tosylsäure;pTsOH|C7H8O3S|Cc1ccc(S(=O)(=O)O)cc1|||Säure|Feste starke organische Säure, Veresterungskatalysator
Methansulfonsäure|MsOH|CH4O3S|CS(=O)(=O)O|||Säure|Starke organische Säure
Benzolsulfonsäure||C6H6O3S|O=S(=O)(O)c1ccccc1|||Säure|Produkt der Sulfonierung von Benzol
Sulfanilamid||C6H8N2O2S|Nc1ccc(S(N)(=O)=O)cc1|||Wirkstoff|Erstes Sulfonamid-Antibiotikum
Saccharin||C7H5NO3S|O=C1NS(=O)(=O)c2ccccc12|||Wirkstoff|Künstlicher Süßstoff
Ethylamin|Ethanamin|C2H7N|CCN|||Amin|Primäres Amin
Propylamin|Propan-1-amin|C3H9N|CCCN|||Amin|Primäres Amin
Butylamin|Butan-1-amin|C4H11N|CCCCN|||Amin|Primäres Amin
Isopropylamin|Propan-2-amin|C3H9N|CC(C)N|||Amin|Primäres Amin am sekundären Kohlenstoff
tert-Butylamin||C4H11N|CC(C)(C)N|||Amin|Sterisch gehindertes primäres Amin
Dimethylamin||C2H7N|CNC|||Amin|Sekundäres Amin
Diethylamin||C4H11N|CCNCC|||Amin|Sekundäres Amin
Diisopropylamin||C6H15N|CC(C)NC(C)C|||Amin|Vorstufe von Lithiumdiisopropylamid
DIPEA|Hünig-Base;Diisopropylethylamin|C8H19N|CCN(C(C)C)C(C)C|||Amin|Nicht nucleophile Hilfsbase
Piperidin||C5H11N|C1CCNCC1|||Amin|Sekundäres cyclisches Amin, Katalysator der Knoevenagel-Kondensation
Pyrrolidin||C4H9N|C1CCNC1|||Amin|Bildet mit Ketonen Enamine
Morpholin||C4H9NO|C1COCCN1|||Amin|Cyclisches Amin mit Ethergruppe
Ethylendiamin|Ethan-1,2-diamin|C2H8N2|NCCN|||Amin|Zweizähniger Komplexligand
Hexamethylendiamin|Hexan-1,6-diamin|C6H16N2|NCCCCCCN|||Amin|Monomer für Nylon-6,6
Hydrazin|Hydrazinhydrat|N2H4|NN|||Reduktionsmittel|Reagenz der Wolff-Kishner-Reduktion, giftig und krebserzeugend
Hydroxylamin||H3NO|NO|||Reagenz|Bildet mit Aldehyden und Ketonen Oxime
Valin||C5H11NO2|CC(C)C(N)C(=O)O|||Aminosäure|Essentielle verzweigtkettige Aminosäure
Leucin||C6H13NO2|CC(C)CC(N)C(=O)O|||Aminosäure|Essentielle verzweigtkettige Aminosäure
Isoleucin||C6H13NO2|CCC(C)C(N)C(=O)O|||Aminosäure|Essentielle Aminosäure mit zwei Stereozentren
Phenylalanin||C9H11NO2|NC(Cc1ccccc1)C(=O)O|||Aminosäure|Aromatische essentielle Aminosäure
Tyrosin||C9H11NO3|NC(Cc1ccc(O)cc1)C(=O)O|||Aminosäure|Phenolische Aminosäure
Tryptophan||C11H12N2O2|NC(Cc1c[nH]c2ccccc12)C(=O)O|||Aminosäure|Indolhaltige essentielle Aminosäure
Serin||C3H7NO3|NC(CO)C(=O)O|||Aminosäure|Hydroxyaminosäure
Cystein||C3H7NO2S|NC(CS)C(=O)O|||Aminosäure|Thiolhaltige Aminosäure, bildet Disulfidbrücken
Methionin||C5H11NO2S|CSCCC(N)C(=O)O|||Aminosäure|Schwefelhaltige essentielle Aminosäure
Asparaginsäure||C4H7NO4|NC(CC(=O)O)C(=O)O|||Aminosäure|Saure Aminosäure
Glutaminsäure||C5H9NO4|NC(CCC(=O)O)C(=O)O|||Aminosäure|Saure Aminosäure, Salz als Geschmacksverstärker
Lysin||C6H14N2O2|NCCCCC(N)C(=O)O|||Aminosäure|Basische essentielle Aminosäure
Prolin||C5H9NO2|O=C(O)C1CCCN1|||Aminosäure|Cyclische Aminosäure und Organokatalysator
Propionitril|Propannitril|C3H5N|CCC#N|||Nitril|Aliphatisches Nitril
Butyronitril|Butannitril|C4H7N|CCCC#N|||Nitril|Aliphatisches Nitril
Valeronitril|Pentannitril|C5H9N|CCCCC#N|||Nitril|Produkt der SN2-Reaktion von 1-Brombutan mit Cyanid
Malononitril|Propandinitril|C3H2N2|N#CCC#N|||Nitril|Stark CH-acides Dinitril für Knoevenagel-Reaktionen
Chlormethan|Methylchlorid|CH3Cl|CCl|||Halogenverbindung|Methylierungsmittel, Gas
Iodmethan|Methyliodid|CH3I|CI|||Halogenverbindung|Reaktives Methylierungsmittel, giftig
Bromethan|Ethylbromid|C2H5Br|CCBr|||Halogenverbindung|Primäres Halogenalkan
Iodethan|Ethyliodid|C2H5I|CCI|||Halogenverbindung|Ethylierungsmittel
1-Brompropan|n-Propylbromid|C3H7Br|CCCBr|||Halogenverbindung|Primäres Halogenalkan
2-Brompropan|Isopropylbromid|C3H7Br|CC(C)Br|||Halogenverbindung|Sekundäres Halogenalkan
1-Chlorbutan|n-Butylchlorid|C4H9Cl|CCCCCl|||Halogenverbindung|Primäres Halogenalkan
2-Brombutan|sec-Butylbromid|C4H9Br|CCC(C)Br|||Halogenverbindung|Sekundäres Halogenalkan, Modellsubstrat der E2-Eliminierung
1-Iodbutan||C4H9I|CCCCI|||Halogenverbindung|Produkt der Finkelstein-Reaktion
tert-Butylbromid|2-Brom-2-methylpropan|C4H9Br|CC(C)(C)Br|||Halogenverbindung|Tertiäres Halogenalkan für SN1 und E1
1-Bromhexan||C6H13Br|CCCCCCBr|||Halogenverbindung|Primäres Halogenalkan
Bromcyclohexan|Cyclohexylbromid|C6H11Br|BrC1CCCCC1|||Halogenverbindung|Sekundäres cyclisches Halogenalkan
Chlorcyclohexan||C6H11Cl|ClC1CCCCC1|||Halogenverbindung|Sekundäres cyclisches Halogenalkan
Allylbromid|3-Brompropen|C3H5Br|C=CCBr|||Halogenverbindung|Allylierungsmittel
Allylchlorid|3-Chlorpropen|C3H5Cl|C=CCCl|||Halogenverbindung|Rohstoff für Epichlorhydrin
1,2-Dibromethan||C2H4Br2|BrCCBr|||Halogenverbindung|Aktivator für Grignard-Reaktionen
1,2-Dichlorethan||C2H4Cl2|ClCCCl|||Halogenverbindung|Zwischenprodukt der PVC-Herstellung
Tetrachlormethan|Tetrachlorkohlenstoff|CCl4|ClC(Cl)(Cl)Cl|||Halogenverbindung|Früheres Lösungsmittel, lebertoxisch
Tetrachlorethen|Perchlorethylen|C2Cl4|ClC(Cl)=C(Cl)Cl|||Halogenverbindung|Lösungsmittel der chemischen Reinigung
Trichlorethen||C2HCl3|ClC=C(Cl)Cl|||Halogenverbindung|Entfettungsmittel, krebserzeugend
Bromoform|Tribrommethan|CHBr3|BrC(Br)Br|||Halogenverbindung|Schweres Halogenmethan
Iodoform|Triiodmethan|CHI3|IC(I)I|||Halogenverbindung|Gelber Niederschlag der Iodoformprobe
Dimethylsulfid||C2H6S|CSC|||Schwefelverbindung|Nebenprodukt der Swern-Oxidation, Kohlgeruch
Ethanthiol|Ethylmercaptan|C2H6S|CCS|||Schwefelverbindung|Odoriermittel für Erdgas
Thiophenol|Benzolthiol|C6H6S|Sc1ccccc1|||Schwefelverbindung|Aromatisches Thiol mit starkem Geruch
Sulfolan||C4H8O2S|O=S1(=O)CCCC1|||Lösungsmittel|Polar aprotisches Lösungsmittel
Triphenylphosphin||C18H15P|c1ccc(P(c2ccccc2)c2ccccc2)cc1|||Reagenz|Ligand und Reagenz der Wittig-, Appel- und Mitsunobu-Reaktion
Triphenylphosphinoxid||C18H15OP|O=P(c1ccccc1)(c1ccccc1)c1ccccc1|||Phosphorverbindung|Nebenprodukt der Wittig- und Appel-Reaktion
Methyltriphenylphosphoniumbromid||C19H18BrP|C[P+](c1ccccc1)(c1ccccc1)c1ccccc1.[Br-]|||Reagenz|Vorstufe des Methylen-Wittig-Ylids
Fructose|Fruchtzucker|C6H12O6|OCC1(O)OCC(O)C(O)C1O|||Kohlenhydrat|Ketohexose, süßester natürlicher Zucker
Galactose||C6H12O6|OC[C@H]1O[C@@H](O)[C@H](O)[C@@H](O)[C@H]1O|||Kohlenhydrat|Aldohexose, Baustein der Lactose
Ribose||C5H10O5|OCC1OC(O)C(O)C1O|||Kohlenhydrat|Aldopentose, Baustein der RNA
Lactose|Milchzucker|C12H22O11|OCC1OC(OC2C(CO)OC(O)C(O)C2O)C(O)C(O)C1O|||Kohlenhydrat|Reduzierendes Disaccharid der Milch
Stärke|Amylose|C6H10O5||||Kohlenhydrat|Polysaccharid (Formel der Glucoseeinheit), bildet mit Iod einen blauen Komplex
Theobromin||C7H8N4O2|Cn1cnc2c1c(=O)[nH]c(=O)n2C|||Naturstoff|Alkaloid des Kakaos
Nikotin||C10H14N2|CN1CCCC1c1cccnc1|||Naturstoff|Hochgiftiges Tabakalkaloid
Capsaicin||C18H27NO3|COc1cc(CNC(=O)CCCC/C=C/C(C)C)ccc1O|||Naturstoff|Scharfstoff der Chilischoten
Lidocain||C14H22N2O|CCN(CC)CC(=O)Nc1c(C)cccc1C|||Wirkstoff|Lokalanästhetikum
Naproxen||C14H14O3|COc1ccc2cc(C(C)C(=O)O)ccc2c1|||Wirkstoff|Entzündungshemmer
Ninhydrin||C9H6O4|O=C1c2ccccc2C(=O)C1(O)O|||Nachweisreagenz|Färbt Aminosäuren violett (Ruhemanns Purpur)
mCPBA|3-Chlorperbenzoesäure|C7H5ClO3|O=C(OO)c1cccc(Cl)c1|||Oxidationsmittel|Persäure für Epoxidierungen und Baeyer-Villiger-Oxidationen
PCC|Pyridiniumchlorochromat|C5H6ClCrNO3|[O-][Cr](=O)(=O)Cl.c1cc[nH+]cc1|||Oxidationsmittel|Chrom(VI)-Reagenz für die Oxidation zu Aldehyden, krebserzeugend
Dess-Martin-Periodinan|DMP|C13H13IO8|CC(=O)OI1(OC(C)=O)(OC(C)=O)OC(=O)c2ccccc21|||Oxidationsmittel|Mildes hypervalentes Iodreagenz für Alkoholoxidationen
DIBAL-H|Diisobutylaluminiumhydrid|C8H19Al|CC(C)C[AlH]CC(C)C|||Reduktionsmittel|Reduziert Ester bei −78 °C zum Aldehyd, pyrophor
LDA|Lithiumdiisopropylamid|C6H14LiN|CC(C)[N-]C(C)C.[Li+]|||Base|Starke, nicht nucleophile Base für Enolate
Natriummethanolat|Natriummethylat|CH3NaO|C[O-].[Na+]|||Base|Starke Base, Katalysator der Biodieselherstellung
Natriumethanolat|Natriumethylat|C2H5NaO|CC[O-].[Na+]|||Base|Base der Claisen-Kondensation und Malonestersynthese
Kalium-tert-butanolat|Kalium-tert-butylat|C4H9KO|CC(C)(C)[O-].[K+]|||Base|Sperrige starke Base
Natriumacetat||C2H3NaO2|CC(=O)[O-].[Na+]|||Salz|Puffersalz, Base der Perkin-Reaktion
Kaliumacetat||C2H3KO2|CC(=O)[O-].[K+]|||Salz|Puffersalz
Natriumbenzoat||C7H5NaO2|O=C([O-])c1ccccc1.[Na+]|||Salz|Konservierungsstoff E 211
Natriumstearat|Kernseife|C18H35NaO2|CCCCCCCCCCCCCCCCCC(=O)[O-].[Na+]|||Tensid|Seife aus der Verseifung von Tristearin
Natriumdodecylsulfat|SDS|C12H25NaO4S|CCCCCCCCCCCCOS(=O)(=O)[O-].[Na+]|||Tensid|Anionisches Tensid in Waschmitteln
Natriumcyanoborhydrid||CH3BNNa|[BH3-]C#N.[Na+]|||Reduktionsmittel|Selektives Hydrid für reduktive Aminierungen, giftig
Thiaminchlorid|Vitamin B1|C12H17ClN4OS|Cc1ncc(C[n+]2csc(CCO)c2C)c(N)n1.[Cl-]|||Katalysator|Vitamin B1, Organokatalysator der Benzoinkondensation
Palladium(II)-acetat||C4H6O4Pd|CC(=O)[O-].CC(=O)[O-].[Pd+2]|||Katalysator|Katalysatorvorstufe für Heck- und Suzuki-Kupplungen
Tetrakis(triphenylphosphin)palladium|Pd(PPh3)4|C72H60P4Pd|[Pd].c1ccc(P(c2ccccc2)c2ccccc2)cc1.c1ccc(P(c2ccccc2)c2ccccc2)cc1.c1ccc(P(c2ccccc2)c2ccccc2)cc1.c1ccc(P(c2ccccc2)c2ccccc2)cc1|||Katalysator|Palladium(0)-Katalysator für Kreuzkupplungen
Grubbs-Katalysator|Grubbs I|C43H72Cl2P2Ru||||Katalysator|Rutheniumkatalysator der Olefinmetathese
Thionylchlorid||Cl2OS|O=S(Cl)Cl|||Reagenz|Überführt Carbonsäuren in Säurechloride; SO₂ und HCl entweichen
Tetrabrommethan|Tetrabromkohlenstoff|CBr4|BrC(Br)(Br)Br|||Reagenz|Bromquelle der Appel-Reaktion
Boran|Boran-THF-Komplex|BH3|B|||Reagenz|Addiert an Alkene (Hydroborierung); als THF-Komplex im Handel
Methylentriphenylphosphoran|Methylen-Wittig-Ylid|C19H17P|C=P(c1ccccc1)(c1ccccc1)c1ccccc1|||Reagenz|Wittig-Ylid, überführt Carbonylgruppen in Methylengruppen
Methylmagnesiumbromid|MeMgBr|CH3BrMg|C[Mg]Br|||Reagenz|Grignard-Reagenz, in Ether gelöst, reagiert heftig mit Wasser
Ethylmagnesiumbromid|EtMgBr|C2H5BrMg|CC[Mg]Br|||Reagenz|Grignard-Reagenz
Phenylmagnesiumbromid|PhMgBr|C6H5BrMg|Br[Mg]c1ccccc1|||Reagenz|Aryl-Grignard-Reagenz, Baustein für Triphenylmethanol
Dinatrium-EDTA|Titriplex III;Na2H2EDTA|C10H14N2Na2O8|O=C(O)CN(CCN(CC(=O)[O-])CC(=O)[O-])CC(=O)O.[Na+].[Na+]|||Reagenz|Sechszähniger Komplexbildner, Maßlösung der Wasserhärtebestimmung
Phosphoroxychlorid|Phosphorylchlorid;POCl3|Cl3OP|O=P(Cl)(Cl)Cl|||Reagenz|Chlorierungsmittel, etwa für Hydroxypyridine und Vilsmeier-Reaktionen
Sulfurylchlorid||Cl2O2S|O=S(=O)(Cl)Cl|||Reagenz|Chlorierungsmittel
Chlorsulfonsäure||ClHO3S|O=S(=O)(O)Cl|||Säure|Führt Sulfonylchloridgruppen in Aromaten ein
Phosphortribromid||Br3P|BrP(Br)Br|||Reagenz|Überführt Alkohole in Bromalkane
Trimethylsilylchlorid|Chlortrimethylsilan;TMSCl|C3H9ClSi|C[Si](C)(C)Cl|||Reagenz|Silylierungsmittel, Schutzgruppe für Alkohole
1-Methylpiperazin|N-Methylpiperazin|C5H12N2|CN1CCNCC1|||Amin|Baustein vieler Wirkstoffe
Piperazin||C4H10N2|C1CNCCN1|||Amin|Cyclisches Diamin, Wirkstoffbaustein
Ethanolamin|2-Aminoethanol;Monoethanolamin|C2H7NO|NCCO|||Amin|Aminoalkohol
3-Aminopropan-1-ol|3-Aminopropanol|C3H9NO|NCCCO|||Amin|Aminoalkohol
Cyclopropylamin||C3H7N|NC1CC1|||Amin|Kleinstes cyclisches primäres Amin
Cyclopentylamin||C5H11N|NC1CCCC1|||Amin|Primäres Amin
Cyclohexylamin||C6H13N|NC1CCCCC1|||Amin|Primäres Amin
Isobutylamin|2-Methylpropan-1-amin|C4H11N|CC(C)CN|||Amin|Primäres Amin
Allylamin|Prop-2-en-1-amin|C3H7N|C=CCN|||Amin|Ungesättigtes primäres Amin
2-Methoxyethylamin||C3H9NO|COCCN|||Amin|Primäres Amin mit Etherfunktion
Dipropylamin||C6H15N|CCCNCCC|||Amin|Sekundäres Amin
Azetidin||C3H7N|C1CNC1|||Amin|Viergliedriges cyclisches Amin
4-Hydroxypiperidin|Piperidin-4-ol|C5H11NO|OC1CCNCC1|||Amin|Wirkstoffbaustein
4-Piperidon|Piperidin-4-on|C5H9NO|O=C1CCNCC1|||Keton|Wirkstoffbaustein
Thiomorpholin||C4H9NS|C1CSCCN1|||Amin|Schwefelanalogon des Morpholins
N,N-Dimethylethylendiamin||C4H12N2|CN(C)CCN|||Amin|Diamin mit tertiärer und primärer Aminogruppe
N,O-Dimethylhydroxylamin||C2H7NO|CNOC|||Amin|Baustein der Weinreb-Amide
O-Methylhydroxylamin|Methoxyamin|CH5NO|CON|||Amin|Bildet mit Carbonylverbindungen Oximether
Cyclopropylmethylamin||C4H9N|NCC1CC1|||Amin|Primäres Amin
4-Fluoranilin||C6H6FN|Nc1ccc(F)cc1|||Amin|Aromatisches Amin
4-Chloranilin||C6H6ClN|Nc1ccc(Cl)cc1|||Amin|Aromatisches Amin
p-Anisidin|4-Methoxyanilin|C7H9NO|COc1ccc(N)cc1|||Amin|Aromatisches Amin
4-Fluorbenzylamin||C7H8FN|NCc1ccc(F)cc1|||Amin|Benzylamin-Derivat
2-Aminopyridin||C5H6N2|Nc1ccccn1|||Heteroaromat|Heteroaromatisches Amin
2-Aminothiazol||C3H4N2S|Nc1nccs1|||Heteroaromat|Heteroaromatisches Amin
1,2,4-Triazol||C2H3N3|c1nc[nH]n1|||Heteroaromat|Stickstoffreicher Heteroaromat, Wirkstoffbaustein
Pyrazol||C3H4N2|c1cn[nH]c1|||Heteroaromat|Fünfring-Heteroaromat mit zwei Stickstoffatomen
2-Brompyridin||C5H4BrN|Brc1ccccn1|||Heteroaromat|Halogenpyridin für Kreuzkupplungen
3-Brompyridin||C5H4BrN|Brc1cccnc1|||Heteroaromat|Halogenpyridin für Kreuzkupplungen
3-Hydroxypyridin|Pyridin-3-ol|C5H5NO|Oc1cccnc1|||Heteroaromat|Hydroxypyridin
Pyridin-3-carbaldehyd|Nicotinaldehyd|C6H5NO|O=Cc1cccnc1|||Aldehyd|Heteroaromatischer Aldehyd
2-(Chlormethyl)pyridin|2-Picolylchlorid|C6H6ClN|ClCc1ccccn1|||Halogenverbindung|Alkylierungsmittel
Pyridin-3-boronsäure|3-Pyridylboronsäure|C5H6BNO2|OB(O)c1cccnc1|||Boronsäure|Kupplungspartner der Suzuki-Reaktion
Cyclopropylboronsäure||C3H7BO2|OB(O)C1CC1|||Boronsäure|Kupplungspartner der Suzuki-Reaktion
4-Hydroxybenzaldehyd||C7H6O2|O=Cc1ccc(O)cc1|||Aldehyd|Phenolischer Aldehyd
4-Fluorbenzaldehyd||C7H5FO|O=Cc1ccc(F)cc1|||Aldehyd|Aromatischer Aldehyd
4-Brombenzaldehyd||C7H5BrO|O=Cc1ccc(Br)cc1|||Aldehyd|Aromatischer Aldehyd
4-Bromphenol||C6H5BrO|Oc1ccc(Br)cc1|||Phenol|Halogenphenol
4-Chlorphenol||C6H5ClO|Oc1ccc(Cl)cc1|||Phenol|Halogenphenol
4-Fluorphenol||C6H5FO|Oc1ccc(F)cc1|||Phenol|Halogenphenol
4-Fluorbenzonitril||C7H4FN|N#Cc1ccc(F)cc1|||Nitril|Aromatisches Nitril
4-Fluorbenzylbromid||C7H6BrF|Fc1ccc(CBr)cc1|||Halogenverbindung|Benzylierungsmittel
Bromessigsäureethylester|Ethylbromacetat|C4H7BrO2|CCOC(=O)CBr|||Ester|Alkylierungsmittel, Reformatsky-Reagenz
Bromessigsäuremethylester|Methylbromacetat|C3H5BrO2|COC(=O)CBr|||Ester|Alkylierungsmittel
Cyanessigsäureethylester|Ethylcyanoacetat|C5H7NO2|CCOC(=O)CC#N|||Ester|CH-acide Verbindung der Knoevenagel-Reaktion
Glycinethylester||C4H9NO2|CCOC(=O)CN|||Ester|Ester der einfachsten Aminosäure
Chlorameisensäureethylester|Ethylchlorformiat|C3H5ClO2|CCOC(=O)Cl|||Säurechlorid|Bildet Carbamate und gemischte Anhydride
Chlorameisensäuremethylester|Methylchlorformiat|C2H3ClO2|COC(=O)Cl|||Säurechlorid|Bildet Carbamate
Pivaloylchlorid||C5H9ClO|CC(C)(C)C(=O)Cl|||Säurechlorid|Sterisch anspruchsvolles Säurechlorid
Isobutyrylchlorid||C4H7ClO|CC(C)C(=O)Cl|||Säurechlorid|Säurechlorid
Cyclopropancarbonsäurechlorid||C4H5ClO|O=C(Cl)C1CC1|||Säurechlorid|Säurechlorid
Acryloylchlorid|Acrylsäurechlorid|C3H3ClO|C=CC(=O)Cl|||Säurechlorid|Führt Acrylamidgruppen ein
Methoxyacetylchlorid||C3H5ClO2|COCC(=O)Cl|||Säurechlorid|Säurechlorid
Bromacetylbromid||C2H2Br2O|O=C(Br)CBr|||Säurechlorid|Bifunktionelles Acylierungsmittel
Ethansulfonylchlorid||C2H5ClO2S|CCS(=O)(=O)Cl|||Säurechlorid|Bildet Sulfonamide und Sulfonate
Methansulfonamid||CH5NO2S|CS(N)(=O)=O|||Amid|Einfachstes Sulfonamid
Phenylisocyanat||C7H5NO|O=C=Nc1ccccc1|||Reagenz|Bildet mit Aminen Harnstoffe, mit Alkoholen Urethane
Trimethylsilylacetylen|Ethinyltrimethylsilan|C5H10Si|C#C[Si](C)(C)C|||Alkin|Geschütztes Acetylen für Sonogashira-Kupplungen
Propargylbromid|3-Brompropin|C3H3Br|C#CCBr|||Halogenverbindung|Alkylierungsmittel
2-Iodpropan|Isopropyliodid|C3H7I|CC(C)I|||Halogenverbindung|Alkylierungsmittel
1-Iodpropan|Propyliodid|C3H7I|CCCI|||Halogenverbindung|Alkylierungsmittel
(Brommethyl)cyclopropan||C4H7Br|BrCC1CC1|||Halogenverbindung|Alkylierungsmittel
Bromcyclopentan|Cyclopentylbromid|C5H9Br|BrC1CCCC1|||Halogenverbindung|Alkylierungsmittel
1-Brom-3-chlorpropan||C3H6BrCl|ClCCCBr|||Halogenverbindung|Bifunktionelles Alkylierungsmittel
1,3-Dibrompropan||C3H6Br2|BrCCCBr|||Halogenverbindung|Bifunktionelles Alkylierungsmittel
1,4-Dibrombutan||C4H8Br2|BrCCCCBr|||Halogenverbindung|Bifunktionelles Alkylierungsmittel
2-Bromethanol||C2H5BrO|OCCBr|||Halogenverbindung|Hydroxyethylierungsmittel
3-Brompropan-1-ol||C3H7BrO|OCCCBr|||Halogenverbindung|Hydroxypropylierungsmittel
2-Bromethylmethylether|1-Brom-2-methoxyethan|C3H7BrO|COCCBr|||Halogenverbindung|Alkylierungsmittel
Bromacetonitril||C2H2BrN|N#CCBr|||Nitril|Cyanmethylierungsmittel
Chloracetonitril||C2H2ClN|N#CCCl|||Nitril|Cyanmethylierungsmittel
2-Methoxyethanol|Methylglykol|C3H8O2|COCCO|||Alkohol|Glykolether, Lösungsmittel
2-Oxazolidinon||C3H5NO2|O=C1NCCO1|||Amid|Cyclisches Carbamat
Benzylmercaptan|Phenylmethanthiol|C7H8S|SCc1ccccc1|||Schwefelverbindung|Thiol
N-Iodsuccinimid|NIS|C4H4INO2|O=C1CCC(=O)N1I|||Reagenz|Iodierungsmittel
(Trifluormethyl)trimethylsilan|Ruppert-Prakash-Reagenz;TMSCF3|C4H9F3Si|C[Si](C)(C)C(F)(F)F|||Reagenz|Überträgt die Trifluormethylgruppe
Schwefelkohlenstoff|Kohlenstoffdisulfid|CS2|S=C=S|||Lösungsmittel|Leicht entzündliches Lösungsmittel, Baustein für Dithiocarbamate
Acrylsäureethylester|Ethylacrylat|C5H8O2|C=CC(=O)OCC|||Ester|Michael-Akzeptor und Monomer
2,2′-Bipyridin|bipy;2,2′-Dipyridyl|C10H8N2|c1ccc(-c2ccccn2)nc1|||Heteroaromat|Zweizähniger Chelatligand; bildet mit Eisen(II) einen roten Komplex
1,10-Phenanthrolin|phen|C12H8N2|c1cnc2c(c1)ccc1cccnc12|||Heteroaromat|Zweizähniger Chelatligand; mit Eisen(II) entsteht der Redoxindikator Ferroin
Dimethylglyoxim|Diacetyldioxim;Tschugaeffs Reagenz|C4H8N2O2|CC(=NO)C(C)=NO|||Reagenz|Nachweisreagenz für Nickel: himbeerroter Niederschlag
8-Hydroxychinolin|Oxin;Chinolin-8-ol|C9H7NO|Oc1cccc2cccnc12|||Heteroaromat|Chelatbildner für die Fällung und Bestimmung von Metall-Ionen
Kaliumnatriumtartrat|Seignettesalz|C4H4KNaO6|O=C([O-])C(O)C(O)C(=O)[O-].[K+].[Na+]|||Salz|Hält in der Fehlingschen Lösung Kupfer(II) als Tartratkomplex gelöst
`.trim();
