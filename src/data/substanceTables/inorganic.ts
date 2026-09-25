/**
 * Erweiterte anorganische Stoffe: Elemente, Säuren, Basen, Oxide und Salze.
 *
 * Format wie in organic.ts. Salze stehen ohne SMILES – die Werkbank rechnet
 * mit ihnen über die Summenformel und das Ionenmodell.
 */
export const INORGANIC_TABLE = String.raw`
Lithium||Li||||Element|Leichtestes Metall, reagiert mit Wasser unter Wasserstoffentwicklung
Natrium||Na||||Element|Weiches Alkalimetall, reagiert heftig mit Wasser
Kalium||K||||Element|Sehr reaktives Alkalimetall, entzündet den entstehenden Wasserstoff
Magnesium||Mg||||Element|Leichtmetall, verbrennt mit grellweißer Flamme
Calcium||Ca||||Element|Erdalkalimetall, reagiert mit Wasser zu Kalkwasser
Aluminium||Al||||Element|Leichtmetall mit schützender Oxidschicht
Zink||Zn||||Element|Unedles Metall für Wasserstoffentwicklung und Verzinkung
Eisen||Fe||||Element|Wichtigstes Gebrauchsmetall
Nickel||Ni||||Element|Metall für Legierungen und Hydrierkatalysatoren
Zinn||Sn||||Element|Metall für Weißblech und Lote
Blei||Pb||||Element|Giftiges Schwermetall
Kupfer||Cu||||Element|Edleres Metall, guter elektrischer Leiter
Silber||Ag||||Element|Edelmetall, bester elektrischer Leiter
Gold||Au||||Element|Edelmetall, löst sich nur in Königswasser
Platin||Pt||||Element|Edelmetall und Katalysator
Palladium auf Aktivkohle|Pd/C;Palladium|Pd||||Katalysator|Hydrierkatalysator
Lindlar-Katalysator|Pd/CaCO3 vergiftet|Pd||||Katalysator|Vergifteter Palladiumkatalysator: hydriert Alkine nur bis zum cis-Alken
Quecksilber||Hg||||Element|Flüssiges, sehr giftiges Metall
Kohlenstoff|Graphit;Holzkohle|C||||Element|Reduktionsmittel und Brennstoff
Schwefel||S||||Element|Gelbes Nichtmetall, verbrennt zu Schwefeldioxid
Roter Phosphor|Phosphor|P||||Element|Reibflächenbestandteil von Streichholzschachteln
Iod||I2|II|||Element|Violett sublimierendes Halogen
Brom|Bromwasser|Br2|BrBr|||Element|Einziges bei Raumtemperatur flüssiges Nichtmetall, ätzend
Silicium||Si||||Element|Halbmetall, Grundstoff der Halbleitertechnik
Helium||He||||Element|Edelgas, reaktionsträge
Argon||Ar||||Element|Edelgas und Schutzgas
Ozon||O3|[O-][O+]=O|||Gas|Allotrop des Sauerstoffs, starkes Oxidationsmittel
Bromwasserstoffsäure|Bromwasserstoff|HBr|Br|||Säure|Starke Säure, addiert an Alkene
Iodwasserstoffsäure|Iodwasserstoff|HI|I|||Säure|Stärkste Halogenwasserstoffsäure, spaltet Ether
Flusssäure|Fluorwasserstoff|HF|F|||Säure|Ätzt Glas; dringt in die Haut ein und bindet Calcium – extrem gefährlich
Kohlensäure||H2CO3|OC(=O)O|||Säure|Schwache Säure, zerfällt in Kohlenstoffdioxid und Wasser
Schweflige Säure||H2SO3|OS(=O)O|||Säure|Lösung von Schwefeldioxid in Wasser
Borsäure||H3BO3|OB(O)O|||Säure|Sehr schwache Säure
Schwefelwasserstoff||H2S|S|||Gas|Sehr giftiges Gas mit Geruch nach faulen Eiern
Lithiumhydroxid||LiOH||||Base|Starke Base
Calciumhydroxid|Löschkalk;Kalkwasser|Ca(OH)2||||Base|Kalkwasser dient als Nachweis für Kohlenstoffdioxid
Bariumhydroxid|Barytwasser|Ba(OH)2||||Base|Starke Base, giftig
Magnesiumhydroxid||Mg(OH)2||||Base|Schwerlösliche Base, Antazidum
Aluminiumhydroxid||Al(OH)3||||Base|Amphoteres Hydroxid, weißer gallertiger Niederschlag
Eisen(III)-hydroxid||Fe(OH)3||||Base|Rostbrauner Niederschlag
Eisen(II)-hydroxid||Fe(OH)2||||Base|Grünlich-weißer Niederschlag, oxidiert an der Luft
Kupfer(II)-hydroxid||Cu(OH)2||||Base|Hellblauer Niederschlag
Zinkhydroxid||Zn(OH)2||||Base|Amphoteres weißes Hydroxid
Natriumhydrid||NaH||||Base|Starke Base, entwickelt mit Wasser Wasserstoff
Natriumamid||NaNH2||||Base|Sehr starke Base zur Deprotonierung terminaler Alkine
Calciumcarbid|Carbid|CaC2||||Salz|Entwickelt mit Wasser Ethin (Acetylen)
Magnesiumoxid||MgO||||Oxid|Weißes Oxid aus der Magnesiumverbrennung
Natriumoxid||Na2O||||Oxid|Basisches Oxid
Kaliumoxid||K2O||||Oxid|Basisches Oxid
Lithiumoxid||Li2O||||Oxid|Basisches Oxid
Bariumoxid||BaO||||Oxid|Basisches Oxid
Eisen(II)-oxid||FeO||||Oxid|Schwarzes Eisenoxid
Eisen(II,III)-oxid|Magnetit;Hammerschlag|Fe3O4||||Oxid|Magnetisches Eisenoxid
Kupfer(II)-oxid||CuO||||Oxid|Schwarzes Oxid, Oxidationsmittel
Kupfer(I)-oxid||Cu2O||||Oxid|Rotes Oxid, Niederschlag der Fehling-Probe
Zinkoxid||ZnO||||Oxid|Weißpigment, Wundsalbe
Blei(II)-oxid|Bleiglätte|PbO||||Oxid|Gelbes Bleioxid
Blei(IV)-oxid|Bleidioxid|PbO2||||Oxid|Starkes Oxidationsmittel im Bleiakku
Mangandioxid|Braunstein|MnO2||||Oxid|Katalysator für die Zersetzung von Wasserstoffperoxid
Silberoxid||Ag2O||||Oxid|Braunes Oxid, zerfällt beim Erhitzen
Quecksilber(II)-oxid||HgO||||Oxid|Rotes Oxid, Lavoisiers Sauerstoffquelle, giftig
Chrom(III)-oxid|Chromoxidgrün|Cr2O3||||Oxid|Grünes Pigment
Distickstoffmonoxid|Lachgas|N2O|[N-]=[N+]=O|||Gas|Narkosegas und Treibhausgas
Phosphorpentoxid|Phosphor(V)-oxid|P4O10||||Oxid|Stärkstes Trockenmittel
Natriumperoxid||Na2O2||||Oxidationsmittel|Starkes Oxidationsmittel
Kaliumchlorid||KCl||||Salz|Düngesalz und Kochsalzersatz
Lithiumchlorid||LiCl||||Salz|Hygroskopisches Salz, rote Flammenfärbung
Calciumchlorid||CaCl2||||Salz|Trockenmittel und Streusalz
Magnesiumchlorid||MgCl2||||Salz|Bestandteil des Meerwassers
Bariumchlorid||BaCl2||||Salz|Nachweisreagenz für Sulfat, giftig
Aluminiumchlorid||AlCl3||||Salz|Lewis-Säure der Friedel-Crafts-Reaktion
Eisen(II)-chlorid||FeCl2||||Salz|Grünliches Eisensalz
Eisen(III)-chlorid||FeCl3||||Salz|Ätzmittel für Leiterplatten und Lewis-Säure
Kupfer(II)-chlorid||CuCl2||||Salz|Grünes Kupfersalz
Kupfer(I)-chlorid||CuCl||||Salz|Katalysator der Sandmeyer-Reaktion
Kupfer(I)-bromid||CuBr||||Salz|Katalysator der Sandmeyer-Bromierung
Kupfer(I)-iodid||CuI||||Salz|Cokatalysator der Sonogashira-Kupplung
Zinkchlorid||ZnCl2||||Salz|Lewis-Säure, Lötwasser
Nickel(II)-chlorid||NiCl2||||Salz|Grünes Nickelsalz
Cobalt(II)-chlorid||CoCl2||||Salz|Feuchtigkeitsindikator (blau/rosa)
Chrom(III)-chlorid|Chromtrichlorid-Hexahydrat|CrCl3·6H2O||||Salz|Grünes Chromsalz; in Lösung liegt Chrom(III) als Aquakomplex vor
Palladium(II)-chlorid||PdCl2||||Salz|Ausgangsstoff für Palladiumkatalysatoren
Mangan(II)-chlorid||MnCl2||||Salz|Blassrosa Mangansalz
Zinn(II)-chlorid||SnCl2||||Salz|Reduktionsmittel für Nitroaromaten
Ammoniumchlorid|Salmiak|NH4Cl||||Salz|Sublimiert beim Erhitzen unter Zerfall
Silberchlorid||AgCl||||Salz|Weißer, lichtempfindlicher Niederschlag
Blei(II)-chlorid||PbCl2||||Salz|Schwerlösliches Bleisalz
Natriumbromid||NaBr||||Salz|Bromidquelle
Kaliumbromid||KBr||||Salz|Bromidquelle und IR-Pressling
Natriumiodid||NaI||||Salz|Iodidquelle der Finkelstein-Reaktion
Kaliumiodid||KI||||Salz|Iodidquelle und Katalysator der Wasserstoffperoxid-Zersetzung
Silberbromid||AgBr||||Salz|Lichtempfindliches Salz der Fotografie
Silberiodid||AgI||||Salz|Gelber Niederschlag
Blei(II)-iodid||PbI2||||Salz|Goldgelbe Kristalle im Goldregen-Versuch
Natriumfluorid||NaF||||Salz|Fluoridquelle in Zahnpasta
Calciumfluorid|Flussspat|CaF2||||Salz|Mineral, Rohstoff für Flusssäure
Natriumsulfat||Na2SO4||||Salz|Trockenmittel für organische Lösungen
Kaliumsulfat||K2SO4||||Salz|Düngemittel
Magnesiumsulfat|Bittersalz|MgSO4||||Salz|Trockenmittel und Abführmittel
Calciumsulfat|Gips|CaSO4·2H2O||||Salz|Baustoff, schwer löslich
Bariumsulfat|Schwerspat|BaSO4||||Salz|Unlösliches Röntgenkontrastmittel
Kupfersulfat wasserfrei|Kupfer(II)-sulfat|CuSO4||||Salz|Weißes Pulver, färbt sich mit Wasser blau (Wassernachweis)
Eisen(II)-sulfat|Eisenvitriol|FeSO4·7H2O||||Salz|Grünes Eisensalz und Reduktionsmittel
Eisen(III)-sulfat||Fe2(SO4)3||||Salz|Gelbbraunes Eisensalz
Zinksulfat|Zinkvitriol|ZnSO4·7H2O||||Salz|Elektrolyt des Daniell-Elements
Nickel(II)-sulfat||NiSO4·6H2O||||Salz|Grünes Salz, Elektrolyt der Vernickelung
Mangan(II)-sulfat||MnSO4||||Salz|Blassrosa Mangansalz
Aluminiumsulfat||Al2(SO4)3||||Salz|Flockungsmittel in der Wasseraufbereitung
Ammoniumsulfat||(NH4)2SO4||||Salz|Stickstoffdünger
Kaliumalaun|Alaun|KAl(SO4)2·12H2O||||Salz|Doppelsalz, bildet große Oktaeder
Blei(II)-sulfat||PbSO4||||Salz|Weißer Niederschlag, entsteht im Bleiakku
Silbersulfat||Ag2SO4||||Salz|Mäßig lösliches Silbersalz
Natriumhydrogensulfat||NaHSO4||||Salz|Saures Salz, Reinigungsmittel
Natriumnitrat|Chilesalpeter|NaNO3||||Salz|Düngemittel und Oxidationsmittel
Kaliumnitrat|Salpeter|KNO3||||Salz|Düngemittel und Oxidationsmittel
Silbernitrat|Höllenstein|AgNO3||||Salz|Nachweisreagenz für Halogenide
Blei(II)-nitrat||Pb(NO3)2||||Salz|Lösliches Bleisalz, giftig
Kupfer(II)-nitrat||Cu(NO3)2||||Salz|Blaues Kupfersalz
Calciumnitrat||Ca(NO3)2||||Salz|Düngemittel
Magnesiumnitrat||Mg(NO3)2||||Salz|Lösliches Magnesiumsalz
Bariumnitrat||Ba(NO3)2||||Salz|Lösliches Bariumsalz, giftig
Zinknitrat||Zn(NO3)2||||Salz|Lösliches Zinksalz
Eisen(III)-nitrat||Fe(NO3)3||||Salz|Lösliches Eisensalz
Aluminiumnitrat||Al(NO3)3||||Salz|Lösliches Aluminiumsalz
Ammoniumnitrat||NH4NO3||||Salz|Stickstoffdünger, brandfördernd
Nickel(II)-nitrat||Ni(NO3)2||||Salz|Grünes Nickelsalz
Cobalt(II)-nitrat||Co(NO3)2||||Salz|Rotes Cobaltsalz
Natriumnitrit||NaNO2||||Salz|Reagenz der Diazotierung, Pökelsalz
Kaliumcarbonat|Pottasche|K2CO3||||Salz|Base für Alkylierungen
Lithiumcarbonat||Li2CO3||||Salz|Lithiumrohstoff
Magnesiumcarbonat||MgCO3||||Salz|Turnermagnesia
Bariumcarbonat||BaCO3||||Salz|Schwerlösliches Carbonat
Zinkcarbonat||ZnCO3||||Salz|Zinkspat
Kupfercarbonat basisch|Malachit|Cu2(OH)2CO3||||Salz|Grünes Kupfermineral, Patina
Ammoniumcarbonat||(NH4)2CO3||||Salz|Zerfällt beim Erhitzen in Ammoniak, Kohlenstoffdioxid und Wasser
Ammoniumhydrogencarbonat|Hirschhornsalz|NH4HCO3||||Salz|Backtriebmittel
Kaliumhydrogencarbonat||KHCO3||||Salz|Backtriebmittel und Löschmittel
Calciumhydrogencarbonat||Ca(HCO3)2||||Salz|Nur in Lösung beständig, Ursache der Wasserhärte
Natriumphosphat|Trinatriumphosphat|Na3PO4||||Salz|Stark alkalisches Reinigungssalz
Kaliumphosphat||K3PO4||||Salz|Base für Suzuki-Kupplungen
Dinatriumhydrogenphosphat||Na2HPO4||||Salz|Pufferbestandteil
Natriumdihydrogenphosphat||NaH2PO4||||Salz|Pufferbestandteil
Calciumphosphat||Ca3(PO4)2||||Salz|Knochenmineral, schwer löslich
Silberphosphat||Ag3PO4||||Salz|Gelber Niederschlag des Phosphatnachweises
Natriumsulfid||Na2S||||Salz|Sulfidquelle, setzt mit Säuren Schwefelwasserstoff frei
Eisen(II)-sulfid||FeS||||Salz|Schwarzes Sulfid aus Eisen und Schwefel
Zinksulfid||ZnS||||Salz|Weißes Sulfid, Leuchtstoff
Kupfer(II)-sulfid||CuS||||Salz|Schwarzer Niederschlag
Blei(II)-sulfid|Bleiglanz|PbS||||Salz|Schwarzes Bleierz
Silbersulfid||Ag2S||||Salz|Schwarzer Anlauf auf Silber
Kupfer(I)-sulfid||Cu2S||||Salz|Produkt der Reaktion von Kupfer mit Schwefel
Natriumsulfit||Na2SO3||||Salz|Reduktionsmittel und Konservierungsstoff
Natriumthiosulfat|Fixiersalz|Na2S2O3||||Salz|Fixiersalz der Fotografie, Maßlösung der Iodometrie
Blei(II)-acetat|Bleizucker|Pb(CH3COO)2|CC(=O)[O-].CC(=O)[O-].[Pb+2]|||Salz|Nachweisreagenz für Sulfid, giftig
Kupfer(II)-acetat||Cu(CH3COO)2|CC(=O)[O-].CC(=O)[O-].[Cu+2]|||Salz|Blaugrünes Kupfersalz
Ammoniumacetat||CH3COONH4|CC(=O)[O-].[NH4+]|||Salz|Puffersalz
Natriumoxalat||Na2C2O4|O=C([O-])C(=O)[O-].[Na+].[Na+]|||Salz|Urtitersubstanz der Permanganometrie
Calciumoxalat||CaC2O4|O=C([O-])C(=O)[O-].[Ca+2]|||Salz|Schwerlöslich, Bestandteil von Nierensteinen
Kaliumchromat||K2CrO4||||Salz|Gelbes Chromat, Indikator der Mohr-Titration, krebserzeugend
Bleichromat|Chromgelb|PbCrO4||||Salz|Gelbes Pigment
Silberchromat||Ag2CrO4||||Salz|Rotbrauner Niederschlag
Bariumchromat||BaCrO4||||Salz|Gelber Niederschlag
Natriumhypochlorit|Chlorbleiche;Javelwasser|NaClO||||Oxidationsmittel|Bleich- und Desinfektionsmittel
Kaliumchlorat||KClO3||||Oxidationsmittel|Starkes Oxidationsmittel, Sauerstoffquelle
Kaliumiodat||KIO3||||Oxidationsmittel|Reagenz der Iod-Uhr
Natriumcyanid||NaCN|[C-]#N.[Na+]|||Salz|Hochgiftig, Nucleophil der Nitrilsynthese
Kaliumcyanid||KCN|[C-]#N.[K+]|||Salz|Hochgiftig
Kaliumhexacyanoferrat(II)|Gelbes Blutlaugensalz|K4[Fe(CN)6]||||Salz|Bildet mit Eisen(III)-Ionen Berliner Blau
Kaliumhexacyanoferrat(III)|Rotes Blutlaugensalz|K3[Fe(CN)6]||||Salz|Bildet mit Eisen(II)-Ionen Turnbulls Blau
Kaliumthiocyanat|Kaliumrhodanid|KSCN||||Salz|Nachweisreagenz für Eisen(III)-Ionen (blutrot)
Natriumsilicat|Wasserglas|Na2SiO3||||Salz|Kieselsäurequelle, Grundlage des chemischen Gartens
Borax|Natriumtetraborat|Na2B4O7·10H2O||||Salz|Borsäurequelle und Flussmittel
Lugolsche Lösung|Iod-Kaliumiodid-Lösung|KI3||||Nachweisreagenz|Braune Iodlösung, färbt Stärke blauschwarz
Tollens-Reagenz|ammoniakalische Silbernitratlösung|[Ag(NH3)2]OH||||Nachweisreagenz|Weist Aldehyde durch einen Silberspiegel nach
Fehling-Reagenz|Fehlingsche Lösung|Cu(OH)2||||Nachweisreagenz|Tiefblaue alkalische Kupfer(II)-Tartratlösung, weist reduzierende Zucker und Aldehyde nach
`.trim();
