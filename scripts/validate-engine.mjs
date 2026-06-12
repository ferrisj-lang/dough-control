/* ════════════════════════════════════════════════════════════════
   VALIDATION DU MOTEUR — gate CI (npm run validate)
   Reproduit les benchmarks de la bible (§11). Si un de ces tests
   casse, c'est que quelqu'un a touché aux constantes du moteur :
   le déploiement est bloqué. NE PAS "ajuster les attendus" pour
   faire passer — relire la bible d'abord.
   ════════════════════════════════════════════════════════════════ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rate6 = (T) => 2 ** ((T - 20) / 6);
const HUMF = { dry: 1.05, normal: 1, humid: 0.95 };
const idyPct = (h, T, hum) => clamp((2.4 / h) * 2 ** ((20 - T) / 6) * HUMF[hum], 0.01, 1);
const coldIdyPct = (rH, amb, cH, cT, hum) =>
  clamp((2.4 / (rH * rate6(amb) + cH * rate6(cT))) * HUMF[hum], 0.01, 1);
const bulkHoldIdyPct = (rH, amb, cH, cT, hum) =>
  clamp((3.8 / (rH * rate6(amb) + 0.4 * cH * rate6(cT))) * HUMF[hum], 0.01, 1);
const bigaIdyPct = (t) => clamp(0.33 * 2 ** ((18 - t) / 6), 0.1, 0.7);
const ballWeight = (dia, den) =>
  clamp(Math.round((Math.PI * (dia / 2) ** 2 * den) / 5) * 5, 150, 420);

let failed = 0;
function check(name, got, expected, tol) {
  const ok = Math.abs(got - expected) <= tol;
  console.log(`${ok ? "✓" : "✗"} ${name}: ${got.toFixed(2)} (attendu ${expected} ± ${tol})`);
  if (!ok) failed++;
}

// 1. Benchmark pizzaiolo 24H : 645 g farine, bulk-then-hold 14 h @22 °C + 10 h @5 °C → ≈4 g fraîche
check(
  "24H bulk-then-hold, levure fraîche (g / 645 g farine)",
  (645 * bulkHoldIdyPct(14, 22, 10, 5, "normal")) / 100 * 3,
  4.0, 0.15
);

// 2. Recette overnight cold-maturation : 4 h @21 °C + 24 h frigo @5 °C → ≈2.3 g ADY
check(
  "ColdMat overnight, ADY (g / 645 g farine)",
  (645 * coldIdyPct(4, 21, 24, 5, "normal")) / 100 * 1.25,
  2.3, 0.2
);

// 3. Ancrage du modèle direct : 24 h @20 °C = 0.10 % IDY
check("Ancrage direct 24 h @20 °C (% IDY)", idyPct(24, 20, "normal"), 0.1, 0.005);

// 4. Biga : 0.33 % IDY sur farine de biga à 18 °C
check("Biga @18 °C (% IDY)", bigaIdyPct(18), 0.33, 0.005);

// 5. Pâton : 30 cm classique ≈ 255 g (recommandation Ooni/Gozney ~250 g pour 12")
check("Pâton 30 cm classique (g)", ballWeight(30, 0.36), 255, 5);

if (failed) {
  console.error(`\n${failed} benchmark(s) cassé(s) — déploiement bloqué.`);
  process.exit(1);
}
console.log("\nMoteur conforme à la bible §11 ✓");
