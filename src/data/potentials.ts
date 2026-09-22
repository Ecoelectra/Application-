/**
 * Elektrochemische Spannungsreihe.
 *
 * Alle Werte sind Standardreduktionspotentiale in Volt gegen die
 * Normalwasserstoffelektrode (25 °C, 1 mol/L, 1013 hPa).
 * Format: Oxidierte Form | Reduzierte Form | z | E° | Kategorie | Gleichung
 */
import type { StandardPotential } from './types';

const TABLE = `
Li+|Li|1|-3.040|Metall|Li⁺ + e⁻ ⇌ Li
K+|K|1|-2.931|Metall|K⁺ + e⁻ ⇌ K
Ca2+|Ca|2|-2.868|Metall|Ca²⁺ + 2 e⁻ ⇌ Ca
Na+|Na|1|-2.710|Metall|Na⁺ + e⁻ ⇌ Na
Mg2+|Mg|2|-2.372|Metall|Mg²⁺ + 2 e⁻ ⇌ Mg
Al3+|Al|3|-1.662|Metall|Al³⁺ + 3 e⁻ ⇌ Al
Mn2+|Mn|2|-1.185|Metall|Mn²⁺ + 2 e⁻ ⇌ Mn
Zn2+|Zn|2|-0.762|Metall|Zn²⁺ + 2 e⁻ ⇌ Zn
Cr3+|Cr|3|-0.744|Metall|Cr³⁺ + 3 e⁻ ⇌ Cr
Fe2+|Fe|2|-0.447|Metall|Fe²⁺ + 2 e⁻ ⇌ Fe
Cd2+|Cd|2|-0.403|Metall|Cd²⁺ + 2 e⁻ ⇌ Cd
Co2+|Co|2|-0.280|Metall|Co²⁺ + 2 e⁻ ⇌ Co
Ni2+|Ni|2|-0.257|Metall|Ni²⁺ + 2 e⁻ ⇌ Ni
Sn2+|Sn|2|-0.138|Metall|Sn²⁺ + 2 e⁻ ⇌ Sn
Pb2+|Pb|2|-0.126|Metall|Pb²⁺ + 2 e⁻ ⇌ Pb
H+|H2|2|0.000|Nichtmetall|2 H⁺ + 2 e⁻ ⇌ H₂ (Bezugspunkt)
Cu2+|Cu+|1|0.153|Metall|Cu²⁺ + e⁻ ⇌ Cu⁺
AgCl|Ag|1|0.222|Metall|AgCl + e⁻ ⇌ Ag + Cl⁻ (Referenzelektrode)
Hg2Cl2|Hg|2|0.268|Metall|Hg₂Cl₂ + 2 e⁻ ⇌ 2 Hg + 2 Cl⁻ (Kalomelelektrode)
Cu2+|Cu|2|0.342|Metall|Cu²⁺ + 2 e⁻ ⇌ Cu
O2|OH-|4|0.401|Sauerstoff/Wasser|O₂ + 2 H₂O + 4 e⁻ ⇌ 4 OH⁻ (basisch)
I2|I-|2|0.536|Nichtmetall|I₂ + 2 e⁻ ⇌ 2 I⁻
MnO4-|MnO4^2-|1|0.558|Komplex|MnO₄⁻ + e⁻ ⇌ MnO₄²⁻
O2|H2O2|2|0.695|Sauerstoff/Wasser|O₂ + 2 H⁺ + 2 e⁻ ⇌ H₂O₂
Fe3+|Fe2+|1|0.771|Metall|Fe³⁺ + e⁻ ⇌ Fe²⁺
Ag+|Ag|1|0.799|Metall|Ag⁺ + e⁻ ⇌ Ag
Hg2+|Hg|2|0.851|Metall|Hg²⁺ + 2 e⁻ ⇌ Hg
NO3-|NO|3|0.957|Nichtmetall|NO₃⁻ + 4 H⁺ + 3 e⁻ ⇌ NO + 2 H₂O
Br2|Br-|2|1.066|Nichtmetall|Br₂ + 2 e⁻ ⇌ 2 Br⁻
O2|H2O|4|1.229|Sauerstoff/Wasser|O₂ + 4 H⁺ + 4 e⁻ ⇌ 2 H₂O
MnO2|Mn2+|2|1.224|Metall|MnO₂ + 4 H⁺ + 2 e⁻ ⇌ Mn²⁺ + 2 H₂O
Cr2O7^2-|Cr3+|6|1.232|Metall|Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ ⇌ 2 Cr³⁺ + 7 H₂O
Cl2|Cl-|2|1.358|Nichtmetall|Cl₂ + 2 e⁻ ⇌ 2 Cl⁻
Au3+|Au|3|1.498|Metall|Au³⁺ + 3 e⁻ ⇌ Au
MnO4-|Mn2+|5|1.507|Metall|MnO₄⁻ + 8 H⁺ + 5 e⁻ ⇌ Mn²⁺ + 4 H₂O
Ce4+|Ce3+|1|1.720|Metall|Ce⁴⁺ + e⁻ ⇌ Ce³⁺
H2O2|H2O|2|1.776|Sauerstoff/Wasser|H₂O₂ + 2 H⁺ + 2 e⁻ ⇌ 2 H₂O
Co3+|Co2+|1|1.920|Metall|Co³⁺ + e⁻ ⇌ Co²⁺
S2O8^2-|SO4^2-|2|2.010|Nichtmetall|S₂O₈²⁻ + 2 e⁻ ⇌ 2 SO₄²⁻
O3|O2|2|2.076|Sauerstoff/Wasser|O₃ + 2 H⁺ + 2 e⁻ ⇌ O₂ + H₂O
F2|F-|2|2.866|Halogen|F₂ + 2 e⁻ ⇌ 2 F⁻ (stärkstes Oxidationsmittel)
Sn4+|Sn2+|2|0.151|Metall|Sn⁴⁺ + 2 e⁻ ⇌ Sn²⁺
SO4^2-|SO2|2|0.172|Nichtmetall|SO₄²⁻ + 4 H⁺ + 2 e⁻ ⇌ SO₂ + 2 H₂O
Cu+|Cu|1|0.521|Metall|Cu⁺ + e⁻ ⇌ Cu
Pt2+|Pt|2|1.180|Metall|Pt²⁺ + 2 e⁻ ⇌ Pt
S|S2-|2|-0.476|Nichtmetall|S + 2 e⁻ ⇌ S²⁻
H2O|H2|2|-0.828|Sauerstoff/Wasser|2 H₂O + 2 e⁻ ⇌ H₂ + 2 OH⁻ (basisch)
Zn(OH)2|Zn|2|-1.249|Komplex|Zn(OH)₂ + 2 e⁻ ⇌ Zn + 2 OH⁻
Cr3+|Cr2+|1|-0.407|Metall|Cr³⁺ + e⁻ ⇌ Cr²⁺
Ti2+|Ti|2|-1.630|Metall|Ti²⁺ + 2 e⁻ ⇌ Ti
PbO2|PbSO4|2|1.691|Metall|PbO₂ + SO₄²⁻ + 4 H⁺ + 2 e⁻ ⇌ PbSO₄ + 2 H₂O (Bleiakku)
PbSO4|Pb|2|-0.359|Metall|PbSO₄ + 2 e⁻ ⇌ Pb + SO₄²⁻ (Bleiakku)
NiOOH|Ni(OH)2|1|0.490|Komplex|NiOOH + H₂O + e⁻ ⇌ Ni(OH)₂ + OH⁻ (NiMH-Akku)
Li+|LiC6|1|-3.040|Organisch|Li⁺ + e⁻ + C₆ ⇌ LiC₆ (Lithium-Ionen-Akku)
ClO-|Cl-|2|0.890|Halogen|ClO⁻ + H₂O + 2 e⁻ ⇌ Cl⁻ + 2 OH⁻
NO3-|NH4+|8|0.875|Nichtmetall|NO₃⁻ + 10 H⁺ + 8 e⁻ ⇌ NH₄⁺ + 3 H₂O
CO2|HCOOH|2|-0.199|Organisch|CO₂ + 2 H⁺ + 2 e⁻ ⇌ HCOOH
CO2|CO|2|-0.106|Organisch|CO₂ + 2 H⁺ + 2 e⁻ ⇌ CO + H₂O
CO2|CH4|8|0.169|Organisch|CO₂ + 8 H⁺ + 8 e⁻ ⇌ CH₄ + 2 H₂O
C6H4O2|C6H4(OH)2|2|0.699|Organisch|Chinon + 2 H⁺ + 2 e⁻ ⇌ Hydrochinon
TEMPO+|TEMPO|1|0.620|Organisch|TEMPO⁺ + e⁻ ⇌ TEMPO (Mediator)
`.trim();

export const STANDARD_POTENTIALS: StandardPotential[] = TABLE.split('\n').map((line) => {
  const [oxidized, reduced, electrons, potential, category, halfReaction] = line.split('|');
  return {
    oxidized,
    reduced,
    electrons: Number(electrons),
    potential: Number(potential),
    category: category as StandardPotential['category'],
    halfReaction,
  };
});

/** Nach Potential absteigend sortiert – oben die stärksten Oxidationsmittel. */
export const POTENTIALS_BY_STRENGTH = [...STANDARD_POTENTIALS].sort(
  (a, b) => b.potential - a.potential,
);

export function findPotential(species: string): StandardPotential | undefined {
  const needle = species.trim().toLowerCase();
  return STANDARD_POTENTIALS.find(
    (entry) =>
      entry.oxidized.toLowerCase() === needle ||
      entry.reduced.toLowerCase() === needle,
  );
}

/** Alle Halbzellen, in denen ein Element vorkommt. */
export function potentialsForElement(symbol: string): StandardPotential[] {
  const pattern = new RegExp(`(^|[^a-z])${symbol}([^a-z]|$)`);
  return STANDARD_POTENTIALS.filter(
    (entry) => pattern.test(entry.oxidized) || pattern.test(entry.reduced),
  );
}
