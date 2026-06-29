import { useState, useMemo, useEffect } from "react";

/* ════════════════════════════════════════════════════════════════
   DOUGH CONTROL — v3 (Sprint 3 wizard redesign)
   6 pages · bilingue FR/EN · dough tiers (Classico/Napoletano/Maestro)
   · ferment methods (Diretto/Freddo/Lento) · page Schedule (Passionné+)
   ENGINE INCHANGÉ (§5 de la bible) — seules l'UI et les données bougent.
   ════════════════════════════════════════════════════════════════ */

/* ───────────────────────── ENGINE (pur, §5 de la bible) ───────── */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round5 = (v) => Math.round(v / 5) * 5;
const rate6 = (T) => Math.pow(2, (T - 20) / 6);
const HUMF = { dry: 1.05, normal: 1.0, humid: 0.95 };

const idyPct = (h, T, hum) =>
  clamp((2.4 / h) * Math.pow(2, (20 - T) / 6) * HUMF[hum], 0.01, 1.0);
const coldIdyPct = (rH, amb, cH, cT, hum) =>
  clamp((2.4 / (rH * rate6(amb) + cH * rate6(cT))) * HUMF[hum], 0.01, 1.0);
const bulkHoldIdyPct = (rH, amb, cH, cT, hum) =>
  clamp((3.8 / (rH * rate6(amb) + 0.4 * cH * rate6(cT))) * HUMF[hum], 0.01, 1.0);
const bigaIdyPct = (t) => clamp(0.33 * Math.pow(2, (18 - t) / 6), 0.1, 0.7);

const YCONV = { instant: 1, ady: 1.25, fresh: 3 };
const FRICTION = { hand: 1, spiral: 3, stand: 5 };
const ballWeight = (dia, den) =>
  clamp(round5(Math.PI * Math.pow(dia / 2, 2) * den), 150, 420);

/* ───────────────────────── R1 — RÉGIONS & UNITÉS ──────────────── */
const REGIONS = {
  eu: {
    label: "Europe", flag: "🇪🇺",
    flour00: "Caputo Pizzeria (bleu) ★, Le 5 Stagioni, Molino Dallagiovanna",
    flourStrong: "Caputo Cuoco (rouge) ★, Caputo Nuvola, Petra",
    flourBread: "Farine de force T65 / Manitoba",
    flourAP: "Farine T55 classique",
    fresh: "Cube de levure fraîche de supermarché ★",
    instant: "Caputo Lievito, Mauripan",
    ady: "Levure sèche active classique",
    tomato: "San Marzano dell'Agro Sarnese-Nocerino DOP ★",
    salt: "Sel fin de mer (sale fino)",
  },
  us: {
    label: "United States", flag: "🇺🇸",
    flour00: "Antimo Caputo blue (imported) ★, King Arthur '00', Central Milling 00",
    flourStrong: "Caputo Cuoco (imported) ★, King Arthur bread flour, All Trumps",
    flourBread: "King Arthur Bread Flour",
    flourAP: "Gold Medal / KA All-Purpose",
    fresh: "Red Star / Fleischmann's cake yeast",
    instant: "SAF Instant (red) ★, Fleischmann's RapidRise",
    ady: "Red Star Active Dry",
    tomato: "San Marzano (imported) ★, Bianco DiNapoli, Cento DOP",
    salt: "Fine sea salt (Diamond Crystal works too)",
  },
};
const fmtTemp = (c, region) =>
  region === "us" ? `${Math.round((c * 9) / 5 + 32)} °F` : `${c} °C`;
const ozOf = (g) => (g / 28.3495).toFixed(1);
/* Convertit les températures absolues codées en dur dans un texte (ex. tips fours).
   À n'utiliser QUE sur des températures absolues, jamais sur des deltas (+1 °C de friction). */
const locTemps = (s, region) => {
  if (region !== "us") return s;
  const f = (c) => Math.round((+c * 9) / 5 + 32);
  return s.replace(/(\d+)\s?[–-]\s?(\d+)\s?°C/g, (_, a, b) => `${f(a)}–${f(b)} °F`)
          .replace(/(\d+)\s?°C/g, (_, a) => `${f(a)} °F`);
};

/* ───────────────────────── R2 — NIVEAUX (expertise) ───────────── */
const TIERS = {
  amateur: {
    name: { fr: "Amateur", en: "Amateur" }, flavor: "Piece of Cake", icon: "🍕",
    desc: {
      fr: "Je réponds à quelques questions, l'outil choisit tout le reste. Résultat garanti.",
      en: "I answer a few questions, the tool picks everything else. Guaranteed result.",
    },
  },
  enthusiast: {
    name: { fr: "Passionné", en: "Passionate" }, flavor: "Let's Rock", icon: "🔥", preferred: true,
    desc: {
      fr: "Je règle mon environnement, mes ingrédients et mon planning ; la chimie reste verrouillée.",
      en: "I set my environment, ingredients and schedule; the chemistry stays locked.",
    },
  },
  expert: {
    name: { fr: "Pizzaiolo", en: "Pizzaiolo" }, flavor: "Damn I'm Good", icon: "👨‍🍳",
    desc: {
      fr: "Tous les curseurs : hydratation, sel, FDT, poids de pâton, stratégies, biga.",
      en: "Every slider: hydration, salt, dough temp, ball weight, strategies, biga.",
    },
  },
};

/* ───────────────────────── MÉTHODES (engine: heures + bench) ──── */
const METHODS = {
  h6: {
    id: "h6", name: "6 H", hours: 6,
    bench: { hyd: 60, saltP: 2.5, fdt: 25, roomHours: 6, coldHours: 0 },
  },
  h24: {
    id: "h24", name: "24 H", hours: 24, preferred: true,
    bench: { hyd: 62, saltP: 2.33, fdt: 23, roomHours: 14, coldHours: 10 },
  },
  h48: {
    id: "h48", name: "48 H", hours: 48,
    bench: { hyd: 65, saltP: 2.5, fdt: 22, roomHours: 8, coldHours: 22, bigaPct: 30, bigaTemp: 18 },
  },
};

/* Tiers de pâte (page 2) — couche d'affichage par-dessus METHODS */
const DOUGH_TIERS = [
  {
    id: "h6", name: "Classico",
    tag: { fr: "Express · 6 h", en: "Express · 6 h" },
    hint: {
      fr: "Pâte directe, arômes simples, prête le jour même. Le plus facile à réussir.",
      en: "Direct dough, simple aromas, ready the same day. Easiest to nail.",
    },
  },
  {
    id: "h24", name: "Napoletano", preferred: true,
    tag: { fr: "Standard · 24 h", en: "Standard · 24 h" },
    hint: {
      fr: "Maturation complète, digestibilité, le profil du benchmark primé. Meilleur équilibre goût / effort.",
      en: "Full maturation, digestibility, the award-winning benchmark profile. Best taste/effort balance.",
    },
    whyPreferred: {
      fr: "La recette de référence : meilleur équilibre goût / effort.",
      en: "The reference recipe: best taste-to-effort balance.",
    },
  },
  {
    id: "h48", name: "Maestro",
    tag: { fr: "Biga · 48 h", en: "Biga · 48 h" },
    hint: {
      fr: "Préferment (biga), complexité aromatique maximale, alvéolage canotto spectaculaire.",
      en: "Preferment (biga), maximum aromatic complexity, spectacular canotto crumb.",
    },
  },
];

const OVENS = [
  { id: "koda12", name: "Ooni Koda 12", maxDia: 30, hot: true, preheat: 20, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Sole ~430–450 °C. Quart de tour toutes les 20 s.", en: "Stone ~430–450 °C. Quarter-turn every 20 s." } },
  { id: "koda16", name: "Ooni Koda 16", maxDia: 40, hot: true, preheat: 25, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Brûleur en L : moins de rotations nécessaires.", en: "L-shaped burner: fewer rotations needed." } },
  { id: "karu12", name: "Ooni Karu 12", maxDia: 30, hot: true, preheat: 20, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Bois ou gaz. Au bois, gérer la flamme avant chaque enfournement.", en: "Wood or gas. On wood, manage the flame before each launch." } },
  { id: "karu16", name: "Ooni Karu 16", maxDia: 40, hot: true, preheat: 25, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Multi-combustible, recommandé AVPN.", en: "Multi-fuel, AVPN-recommended." } },
  { id: "volt12", name: "Ooni Volt 12", maxDia: 30, hot: true, preheat: 25, bake: { fr: "90–120 s", en: "90–120 s" }, tip: { fr: "Électrique, plafonne ~400 °C : cuisson un peu plus longue.", en: "Electric, caps ~400 °C: slightly longer bake." } },
  { id: "roccbox", name: "Gozney Roccbox", maxDia: 30, hot: true, preheat: 25, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Pierre dense, excellente rétention entre deux pizzas.", en: "Dense stone, great heat retention between pizzas." } },
  { id: "arc", name: "Gozney Arc", maxDia: 35, hot: true, preheat: 25, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Flamme latérale roulante : moins de rotations.", en: "Rolling side flame: fewer rotations." } },
  { id: "arcxl", name: "Gozney Arc XL", maxDia: 40, hot: true, preheat: 25, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Flamme latérale, chaleur douce et homogène.", en: "Side flame, gentle even heat." } },
  { id: "dome", name: "Gozney Dome", maxDia: 40, hot: true, preheat: 30, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Bois/gaz, énorme inertie thermique.", en: "Wood/gas, huge thermal mass." } },
  { id: "wood", name: { fr: "Four à bois (autre)", en: "Wood oven (other)" }, maxDia: 42, hot: true, preheat: 60, bake: { fr: "60–90 s", en: "60–90 s" }, tip: { fr: "Viser 450–485 °C de voûte.", en: "Aim for 450–485 °C dome." } },
  { id: "home", name: { fr: "Four domestique + acier/pierre", en: "Home oven + steel/stone" }, maxDia: 33, hot: false, preheat: 60, bake: { fr: "6–8 min en 2 temps", en: "6–8 min, two-stage" }, tip: { fr: "250–300 °C max : cuisson en deux temps obligatoire.", en: "250–300 °C max: two-stage bake required." } },
];

const CRUSTS = [
  { id: "thin", name: { fr: "Fine", en: "Thin" }, den: 0.32, tip: { fr: "Croûte basse, croustillante.", en: "Low, crisp crust." } },
  { id: "classic", name: { fr: "Classique napolitaine", en: "Classic Neapolitan" }, den: 0.36, preferred: true,
    whyPreferred: { fr: "Le standard napolitain : corniche aérée, centre souple.", en: "The Neapolitan standard: airy rim, soft center." },
    tip: { fr: "Le bon équilibre corniche / centre.", en: "The right rim-to-center balance." } },
  { id: "canotto", name: "Canotto", den: 0.42, tip: { fr: "Corniche XXL très gonflée — idéal avec biga.", en: "Huge puffy rim — ideal with biga." } },
];

const FLOURS = {
  pizzeria00: {
    name: { fr: "Tipo 00 pizzeria", en: "Tipo 00 pizzeria" }, sub: { fr: "W260–300 · ~12,5 % prot.", en: "W260–300 · ~12.5% prot." },
    maxHyd: 65, window: "6–24 h", preferredFor: "direct",
    whyPreferred: { fr: "La farine de référence pour le direct 6–24 h.", en: "The reference flour for 6–24 h direct doughs." },
    exKey: "flour00",
    tip: { fr: "La référence napolitaine pour fermentation directe.", en: "The Neapolitan reference for direct fermentation." },
  },
  strong00: {
    name: { fr: "Tipo 00 forte", en: "Tipo 00 strong" }, sub: { fr: "W300–340 · 13–14 % prot.", en: "W300–340 · 13–14% prot." },
    maxHyd: 72, window: "24–72 h", preferredFor: "biga",
    whyPreferred: { fr: "Assez de force pour la biga et les longues maturations.", en: "Enough strength for biga and long maturations." },
    exKey: "flourStrong",
    tip: { fr: "Pour longues maturations et préferments.", en: "For long maturations and preferments." },
  },
  bread: {
    name: { fr: "Farine de force", en: "Bread flour" }, sub: { fr: "~12,5 % prot.", en: "~12.5% prot." },
    maxHyd: 68, window: "6–48 h", exKey: "flourBread",
    tip: { fr: "Substitut accessible, croûte un peu plus croustillante.", en: "Accessible substitute, slightly crisper crust." },
  },
  ap: {
    name: { fr: "Farine classique", en: "All-purpose flour" }, sub: { fr: "~10,5 % prot.", en: "~10.5% prot." },
    maxHyd: 58, window: "≤ 6 h", exKey: "flourAP",
    tip: { fr: "Faible : éviter au-delà de 6 h ou de 58 % d'hydratation.", en: "Weak: avoid beyond 6 h or 58% hydration." },
    warn: true,
  },
};

const SEASONS = [
  { id: "winter", name: { fr: "Hiver", en: "Winter" }, amb: 19, hum: "dry" },
  { id: "spring", name: { fr: "Printemps", en: "Spring" }, amb: 21, hum: "normal" },
  { id: "summer", name: { fr: "Été", en: "Summer" }, amb: 26, hum: "humid" },
  { id: "autumn", name: { fr: "Automne", en: "Autumn" }, amb: 21, hum: "normal" },
];

/* R4 — presets de stockage farine */
const STORAGE_PRESETS = [
  { id: "cupboard", name: { fr: "Placard de cuisine", en: "Kitchen cupboard" }, icon: "🏠", t: 21, preferred: true,
    whyPreferred: { fr: "Le cas le plus courant à la maison.", en: "The most common home case." } },
  { id: "cool", name: { fr: "Endroit frais et sec", en: "Cool dry place" }, icon: "🌬️", t: 18 },
  { id: "cellar", name: { fr: "Cave / cellier", en: "Cellar / larder" }, icon: "🧱", t: 15 },
];

const MIXERS = [
  { id: "hand", name: { fr: "À la main", en: "By hand" },
    tip: { fr: "Slap & fold 8–10 min. Friction +1 °C.", en: "Slap & fold 8–10 min. Friction +1 °C." },
    why: { fr: "Suffisant et recommandé pour 1–6 pâtons.", en: "Plenty, and recommended for 1–6 balls." } },
  { id: "stand", name: { fr: "Robot pâtissier (KitchenAid)", en: "Stand mixer (KitchenAid)" },
    tip: { fr: "Crochet, vitesse 1–2, ~10 min. Friction +5 °C.", en: "Hook, speed 1–2, ~10 min. Friction +5 °C." },
    why: { fr: "Recommandé au-delà de 6 pâtons : la main fatigue.", en: "Recommended past 6 balls: hands tire out." } },
  { id: "spiral", name: { fr: "Pétrin spirale", en: "Spiral mixer" },
    best: { fr: "Le meilleur si vous en possédez un.", en: "The best if you own one." },
    tip: { fr: "8 min vitesse lente. Friction +3 °C.", en: "8 min low speed. Friction +3 °C." } },
];

const YEASTS = {
  fresh: { name: { fr: "Fraîche", en: "Fresh" }, exKey: "fresh", preferred: true,
    whyPreferred: { fr: "La tradition napolitaine — et notre benchmark la reproduit au gramme.", en: "The Neapolitan tradition — and our benchmark matches it to the gram." },
    tip: { fr: "Conserver au frigo, utiliser sous 2 semaines.", en: "Keep refrigerated, use within 2 weeks." } },
  instant: { name: { fr: "Sèche instantanée", en: "Instant dry" }, exKey: "instant", beginner: true,
    whyPreferred: { fr: "Le choix le plus fiable pour débuter : se conserve longtemps, dosage stable.", en: "The most reliable choice to start: long shelf life, stable dosing." },
    tip: { fr: "Directement dans la farine, jamais dans l'eau salée. Se conserve très bien.", en: "Straight into the flour, never into salted water. Keeps very well." } },
  ady: { name: { fr: "Sèche active", en: "Active dry" }, exKey: "ady",
    tip: { fr: "Réhydrater 10 min dans un peu d'eau tiède avant usage.", en: "Rehydrate 10 min in a little warm water before use." } },
};

/* Stratégies de fermentation = Diretto / Freddo★ / Lento (clés engine inchangées) */
const STRATEGIES = {
  ambient: {
    it: "Diretto",
    name: { fr: "Diretto (température ambiante)", en: "Diretto (room temperature)" },
    desc: { fr: "Aucun passage au froid : tout se joue à température ambiante.", en: "No fridge: everything happens at room temperature." },
    flavor: { fr: "Arômes frais et lactés, mie tendre. Idéal sur 6–8 h.", en: "Fresh, milky aromas, tender crumb. Best over 6–8 h." },
    timing: { fr: "Pointage + apprêt à l'ambiante", en: "Bulk + proof at room temp" },
  },
  bulkhold: {
    it: "Freddo", preferred: true,
    name: { fr: "Freddo (bulk, puis frigo-frein)", en: "Freddo (bulk, then cold hold)" },
    whyPreferred: { fr: "Le profil du benchmark primé : pousse complète à T° ambiante, le frigo ne fait que freiner. Le plus fiable.", en: "The award-winning benchmark profile: full rise at room temp, the fridge only brakes. The most reliable." },
    desc: { fr: "Pointage chaud jusqu'au double, frigo en frein, détente avant cuisson.", en: "Warm bulk until doubled, fridge as a brake, temper before baking." },
    flavor: { fr: "Le meilleur des deux mondes : maturité + fiabilité. Léger goût de fermentation.", en: "Best of both worlds: maturity + reliability. Mild fermented note." },
    timing: { fr: "Pointage chaud → frigo → détente", en: "Warm bulk → fridge → temper" },
  },
  coldmat: {
    it: "Lento",
    name: { fr: "Lento (maturation au froid)", en: "Lento (cold maturation)" },
    desc: { fr: "Pointage court, le frigo fait le travail de maturation sur la durée.", en: "Short bulk, the fridge does the slow maturation work." },
    flavor: { fr: "Maturation lente et profonde, arômes complexes, grande digestibilité.", en: "Slow deep maturation, complex aromas, very digestible." },
    timing: { fr: "Pointage court → longue maturation au froid", en: "Short bulk → long cold maturation" },
  },
};
const STRATEGY_ORDER = ["ambient", "bulkhold", "coldmat"];

const TROUBLES = [
  { cat: "dough",
    q: { fr: "La pâte colle énormément", en: "The dough is super sticky" },
    quick: { fr: "Mains mouillées + rabats supplémentaires, pas de farine en excès.", en: "Wet hands + extra folds, no excess flour." },
    forever: { fr: "Baissez l'hydratation de 2–3 % ou choisissez une farine plus forte la prochaine fois.", en: "Drop hydration 2–3% or pick a stronger flour next time." } },
  { cat: "dough",
    q: { fr: "La pâte n'a pas levé", en: "The dough didn't rise" },
    quick: { fr: "Testez la levure dans l'eau sucrée tiède : elle doit mousser en 10 min. Sinon, recommencez avec de la levure fraîche.", en: "Test the yeast in warm sugared water: it should foam in 10 min. Otherwise restart with fresh yeast." },
    forever: { fr: "Vérifiez la date de la levure et la température d'eau (jamais > 40 °C). Stockez la levure au frigo.", en: "Check the yeast date and water temp (never > 40 °C). Store yeast refrigerated." } },
  { cat: "dough",
    q: { fr: "La pâte a trop poussé (sur-fermentée)", en: "The dough over-proofed" },
    quick: { fr: "Refaites des boules, 30 min de détente, cuisez vite.", en: "Re-ball, 30 min rest, bake quickly." },
    forever: { fr: "La prochaine fois : moins de levure, ou plus de froid, ou raccourcissez le temps total.", en: "Next time: less yeast, more fridge, or a shorter total time." } },
  { cat: "stretch",
    q: { fr: "La pâte se rétracte quand je l'étale", en: "The dough springs back when I stretch it" },
    quick: { fr: "Laissez reposer 15–20 min de plus à température ambiante, puis réétalez.", en: "Let it rest 15–20 min more at room temp, then re-stretch." },
    forever: { fr: "Allongez la détente après boulage : le gluten doit se relâcher avant l'étalage.", en: "Lengthen the rest after balling: gluten must relax before stretching." } },
  { cat: "stretch",
    q: { fr: "La pâte se déchire", en: "The dough tears" },
    quick: { fr: "Manipulez du centre vers le bord, jamais la corniche.", en: "Work from center to edge, never the rim." },
    forever: { fr: "Farine trop faible pour le temps choisi : montez en gamme, ou réduisez la durée.", en: "Flour too weak for the chosen time: go stronger, or shorten the duration." } },
  { cat: "bake",
    q: { fr: "Dessous brûlé, dessus pâle", en: "Burnt bottom, pale top" },
    quick: { fr: "Laissez la flamme retomber 1–2 min entre deux pizzas avant d'enfourner.", en: "Let the flame drop 1–2 min between pizzas before launching." },
    forever: { fr: "Sole trop chaude : réduisez la puissance avant d'enfourner, ou préchauffez moins fort.", en: "Stone too hot: lower the power before launching, or preheat less aggressively." } },
  { cat: "bake",
    q: { fr: "Corniche pâle, sans léopard", en: "Pale rim, no leoparding" },
    quick: { fr: "Préchauffez plus longtemps et sortez les pâtons du frigo plus tôt.", en: "Preheat longer and pull the balls from the fridge earlier." },
    forever: { fr: "Four pas assez chaud ou pâton trop froid : visez la pleine puissance et une pâte à l'ambiante.", en: "Oven not hot enough or ball too cold: aim for full power and a room-temp ball." } },
  { cat: "bake",
    q: { fr: "Centre détrempé", en: "Soggy center" },
    quick: { fr: "Sauce en couche fine, égouttez la mozzarella.", en: "Thin layer of sauce, drain the mozzarella." },
    forever: { fr: "Égouttez la fior di latte 1 h à l'avance ; trop d'eau au centre = détrempe.", en: "Drain the fior di latte 1 h ahead; too much water in the middle = sogginess." } },
];
const TROUBLE_CATS = [
  { id: "all", name: { fr: "Tout", en: "All" } },
  { id: "dough", name: { fr: "Pâte", en: "Dough" } },
  { id: "stretch", name: { fr: "Étalage", en: "Stretch" } },
  { id: "bake", name: { fr: "Cuisson", en: "Bake" } },
];

/* ───────────────────── R8 : VISUELS DE TECHNIQUE ──────────────────
   Registre autonome (pas de réseau). Chaque entrée fournit une
   animation SVG/CSS qui est TOUJOURS le fallback rendu — donc valable
   à l'identique dans l'artifact et en prod. `media` est un slot
   optionnel : si une URL est fournie (jamais en artifact), la prod
   rend une <video> par-dessus le SVG. Zéro diff de logique.            */
const SVG = { width: 132, height: 112, viewBox: "0 0 132 112" };
const TECHNIQUES = [
  {
    id: "autolyse",
    name: { fr: "Autolyse + pétrissage", en: "Autolyse + knead" },
    blurb: { fr: "Farine + eau seules, 20 min de repos avant le sel : le gluten se forme tout seul, le pétrissage final est plus court.", en: "Flour + water alone, 20 min rest before salt: gluten forms on its own, the final knead is shorter." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Autolyse">
        <path d="M28 60 a38 24 0 0 0 76 0" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
        <circle className="t-drop" cx="66" cy="26" r="6" fill="var(--gold)" />
        <ellipse className="t-pulse" cx="66" cy="60" rx="30" ry="15" fill="var(--ember)" opacity="0.85" />
        <line className="t-swirl" x1="66" y1="60" x2="66" y2="30" stroke="var(--flour)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "coilfold",
    name: { fr: "Coil fold (rabat)", en: "Coil fold" },
    blurb: { fr: "Soulevez la pâte par le centre, laissez les bords s'enrouler dessous. 1–2 fois la première heure pour tendre le réseau, sans dégazer.", en: "Lift the dough from the center, let the edges coil underneath. 1–2 times in the first hour to build tension, without degassing." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Coil fold">
        <line x1="20" y1="84" x2="112" y2="84" stroke="var(--line)" strokeWidth="3" />
        <g className="t-lift">
          <path d="M40 80 q26 -34 52 0 q-26 14 -52 0 Z" fill="var(--ember)" opacity="0.9" />
          <path d="M52 74 q14 -10 28 0" fill="none" stroke="var(--flour)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    ),
  },
  {
    id: "pirlatura",
    name: { fr: "Staglio + pirlatura", en: "Staglio + pirlatura" },
    blurb: { fr: "Détaillez les pâtons, puis serrez chacun en boule par un mouvement circulaire sur le plan : surface tendue et lisse, soudure dessous.", en: "Divide the balls, then tighten each into a ball with a circular motion on the bench: taut smooth surface, seam underneath." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Pirlatura">
        <line x1="20" y1="86" x2="112" y2="86" stroke="var(--line)" strokeWidth="3" />
        <g className="t-round">
          <circle className="t-tighten" cx="66" cy="62" r="22" fill="var(--ember)" opacity="0.9" />
          <path d="M48 62 a18 18 0 1 1 4 11" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
          <path d="M52 73 l-4 4 6 1" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    ),
  },
  {
    id: "poke",
    name: { fr: "Poke test (point de pousse)", en: "Poke test (proof check)" },
    blurb: { fr: "Pressez doucement le pâton : l'empreinte revient lentement et à moitié ⇒ prêt. Trop vite ⇒ pas assez ; pas du tout ⇒ sur-fermenté.", en: "Gently press the ball: the dent springs back slowly and halfway ⇒ ready. Too fast ⇒ underproofed; not at all ⇒ overproofed." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Poke test">
        <path d="M30 78 a36 30 0 0 1 72 0 Z" fill="var(--ember)" opacity="0.85" />
        <circle className="t-poke" cx="66" cy="40" r="7" fill="var(--flour)" />
      </svg>
    ),
  },
  {
    id: "stretch",
    name: { fr: "Étalage", en: "Stretching" },
    blurb: { fr: "Du centre vers le bord, jamais la corniche. Repoussez le gaz vers le pourtour pour garder un cornicione gonflé. Rouleau interdit.", en: "From center to edge, never the rim. Push the gas toward the border to keep a puffy cornicione. No rolling pin." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Stretching">
        <circle className="t-grow" cx="66" cy="56" r="20" fill="none" stroke="var(--ember)" strokeWidth="6" />
        <circle cx="66" cy="56" r="10" fill="var(--warn)" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: "launch",
    name: { fr: "Enfournement & tour", en: "Launch & turn" },
    blurb: { fr: "Pelle farinée, geste sec pour lancer la pizza sur la sole. Puis quart de tour régulier dès que la corniche colore, pour un léopard homogène.", en: "Floured peel, a sharp motion to launch the pizza onto the stone. Then a regular quarter-turn as soon as the rim colors, for even leoparding." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Launch">
        <rect x="20" y="36" width="92" height="50" rx="6" fill="none" stroke="var(--line)" strokeWidth="4" />
        <g className="t-launch">
          <circle className="t-turn" cx="60" cy="64" r="14" fill="var(--ember)" opacity="0.9" />
          <rect x="2" y="60" width="58" height="8" rx="4" fill="var(--gold)" />
        </g>
      </svg>
    ),
  },
  {
    id: "twostage",
    name: { fr: "Cuisson maison en deux temps", en: "Two-stage home bake" },
    blurb: { fr: "Acier/pierre au max : base saucée sans fromage 4–5 min. Puis mozzarella + basilic et passage sous le grill à fond 2–3 min pour le léopard.", en: "Steel/stone at max: sauced base without cheese 4–5 min. Then mozzarella + basil and a full-broil pass 2–3 min for leoparding." },
    Svg: () => (
      <svg {...SVG} className="techsvg" role="img" aria-label="Two-stage bake">
        <rect x="14" y="40" width="44" height="44" rx="6" fill="none" stroke="var(--line)" strokeWidth="3" />
        <rect x="74" y="40" width="44" height="44" rx="6" fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle cx="36" cy="62" r="12" fill="var(--ember)" opacity="0.8" />
        <circle cx="96" cy="62" r="12" fill="var(--gold)" opacity="0.9" />
        <path className="t-heat" d="M90 50 h12 M90 74 h12" stroke="var(--warn)" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 62 h12 m-5 -4 l5 4 -5 4" fill="none" stroke="var(--flour)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];
const TECH_BY_ID = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t]));

/* ───────────────────────── HELPERS ────────────────────────────── */
const CODE_CHARS = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const makeCode = () =>
  Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

const fmtClock = (d, lang) =>
  d.toLocaleString(lang === "en" ? "en-US" : "fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
const fmtDur = (h) => {
  if (h <= 0) return "";
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh} h${mm ? ` ${mm}` : ""}` : `${mm} min`;
};
const p2 = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const toDateInput = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const toTimeInput = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

const STAR = ({ why }) => <span className="star" title={why || "★"}>★</span>;
const TIME_PRESETS = [12, 13, 18, 19, 20];
/* Marge de préparation (mélange + boulage + préchauffage) en plus de la pousse.
   Sprint 3 : informative (jamais un gate silencieux) — voir §13 R3. */
const PREP_BUFFER = 0.5;

/* ════════════════════════════════════════════════════════════════ */
export default function DoughControl() {
  /* ── méta ── */
  const [started, setStarted] = useState(false);
  const [lang, setLang] = useState("en");
  const [region, setRegion] = useState("eu");
  const [tier, setTier] = useState("enthusiast");
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState(null);

  /* ── planning ── */
  const defaultBake = () => {
    const d = new Date(Date.now() + 26 * 3600e3);
    d.setMinutes(0, 0, 0);
    return d;
  };
  const [bakeAt, setBakeAt] = useState(defaultBake);
  const [method, setMethod] = useState("h24");

  /* ── four ── */
  const [oven, setOven] = useState("koda12");
  const [targetDia, setTargetDia] = useState(30);
  const [crust, setCrust] = useState("classic");
  const [pizzas, setPizzas] = useState(4);
  const [ballManual, setBallManual] = useState(null); // expert only

  /* ── cuisine ── */
  const [season, setSeason] = useState("spring");
  const [ambient, setAmbient] = useState(21);
  const [humidity, setHumidity] = useState("normal");
  const [storagePreset, setStoragePreset] = useState("cupboard");
  const [flourTempManual, setFlourTempManual] = useState(null);
  const [mixer, setMixer] = useState("hand");
  const [fridgeTemp, setFridgeTemp] = useState(5);

  /* ── ingrédients ── */
  const [yeastType, setYeastType] = useState("fresh");
  const [flour, setFlour] = useState("pizzeria00");
  const [hyd, setHyd] = useState(62);
  const [saltP, setSaltP] = useState(2.33);
  const [fdt, setFdt] = useState(23);

  /* ── fermentation ── */
  const [strategy, setStrategy] = useState("bulkhold");
  const [roomHours, setRoomHours] = useState(14);
  const [coldHours, setColdHours] = useState(10);
  const [proofTotal, setProofTotal] = useState(24); // total de pousse éditable (room+cold), défaut = méthode
  const [bigaPct, setBigaPct] = useState(30);
  const [bigaTemp, setBigaTemp] = useState(18);

  /* ── R9 save/load ── */
  const [saveCode, setSaveCode] = useState(null);
  const [loadInput, setLoadInput] = useState("");
  const [storageMsg, setStorageMsg] = useState(null);

  /* ── troubleshooter / techniques ── */
  const [troubleCat, setTroubleCat] = useState("all");
  const [openTech, setOpenTech] = useState(null);

  /* ── i18n ── */
  const tr = (fr, en) => (lang === "en" ? en : fr);
  const L = (o) =>
    o != null && typeof o === "object" && !Array.isArray(o) && ("fr" in o || "en" in o)
      ? (o[lang] ?? o.fr)
      : o;

  const isExpert = tier === "expert";
  const isAmateur = tier === "amateur";
  const isEnthusiast = tier === "enthusiast";
  const M = METHODS[method];
  const O = OVENS.find((o) => o.id === oven);
  const R = REGIONS[region];

  /* ── préférences dynamiques ── */
  const autoMixer = pizzas > 6 ? "stand" : "hand";    // ★ dynamique (≤6 main / >6 robot)
  const isBiga = method === "h48";
  /* Classico (6 h) est trop court pour un vrai travail au froid → Diretto uniquement */
  const allowedStrategies = method === "h6" ? ["ambient"] : STRATEGY_ORDER;
  const effStrategy = method === "h6" ? "ambient" : (isAmateur ? "bulkhold" : strategy);
  const usesFridge = effStrategy !== "ambient";

  /* ── R3 : temps disponible + gating méthode ── */
  const hoursUntil = (bakeAt.getTime() - Date.now()) / 3600e3;
  const methodFits = (m) => hoursUntil >= METHODS[m].hours;                                 // gate dur = durée de fermentation exacte
  const methodTight = (m) => methodFits(m) && hoursUntil < METHODS[m].hours + PREP_BUFFER;  // tient mais marge prép. < 30 min

  /* ── valeurs effectives selon le niveau (§15 révisé Sprint 3) ── */
  const effCrust = isAmateur ? "classic" : crust;
  const effDia = isAmateur ? Math.min(30, O.maxDia) : Math.min(targetDia, O.maxDia);
  const seasonData = SEASONS.find((s) => s.id === season);
  const effAmbient = isAmateur ? seasonData.amb : ambient;
  const effHumidity = isAmateur ? seasonData.hum : humidity;
  const effMixer = mixer; // Sprint 3 : choix du pétrissage ouvert à tous les niveaux (★ reste dynamique via autoMixer)
  const effFridge = isExpert ? fridgeTemp : 5;
  const effYeast = isAmateur ? "instant" : yeastType;
  const flourAuto = method === "h48" ? "strong00" : "pizzeria00";
  const effFlour = isAmateur ? flourAuto : flour;
  const effHyd = isExpert ? hyd : M.bench.hyd;
  const effSalt = isExpert ? saltP : M.bench.saltP;
  const effFdt = isExpert ? fdt : M.bench.fdt;
  /* temps de pousse : total éditable (page Schedule) ; room + cold somment TOUJOURS au total */
  const proofMax = Math.max(4, Math.floor(Math.min(72, hoursUntil)));
  const effProof = isAmateur ? (M.bench.roomHours + M.bench.coldHours)
    : isBiga ? (roomHours + coldHours)
    : clamp(proofTotal, 2, proofMax);
  const effRoom = isAmateur ? M.bench.roomHours
    : isBiga ? roomHours
    : (effStrategy === "ambient" ? effProof : clamp(roomHours, 0, effProof));
  const effCold = isAmateur ? M.bench.coldHours
    : isBiga ? coldHours
    : (effStrategy === "ambient" ? 0 : Math.max(0, effProof - effRoom));
  const effBigaPct = isExpert ? bigaPct : (M.bench.bigaPct || 30);
  const effBigaTemp = isExpert ? bigaTemp : (M.bench.bigaTemp || 18);
  const storage = STORAGE_PRESETS.find((s) => s.id === storagePreset);
  const effFlourTemp = isExpert && flourTempManual != null ? flourTempManual : storage.t;

  /* poids de pâton : benchmark géométrique, surchargé au niveau Pizzaiolo */
  const baseBall = ballWeight(effDia, CRUSTS.find((c) => c.id === effCrust).den);
  const effBall = isExpert && ballManual != null ? clamp(ballManual, 150, 420) : baseBall;

  /* ── R3 : bascule automatique si la méthode ne tient plus ── */
  useEffect(() => {
    if (methodFits(method)) { setNotice(null); return; }   // assez de temps → on efface l'alerte
    const fallback = ["h48", "h24", "h6"].find((m) => methodFits(m));
    if (fallback && fallback !== method) {
      pickMethod(fallback);
      setNotice(tr(
        `⏱ ${METHODS[method].name} ne tient plus dans le délai — bascule automatique sur ${METHODS[fallback].name}.`,
        `⏱ ${METHODS[method].name} no longer fits — auto-switching to ${METHODS[fallback].name}.`
      ));
    } else if (!fallback) {
      setNotice(tr(
        "⏱ Moins de 6 h avant la cuisson : aucune méthode ne tient. Repoussez l'heure.",
        "⏱ Less than 6 h before baking: no method fits. Push the time back."
      ));
    }
  }, [bakeAt]);

  /* ── sélection méthode : charge le benchmark ── */
  function pickMethod(id) {
    const b = METHODS[id].bench;
    setMethod(id);
    setHyd(b.hyd); setSaltP(b.saltP); setFdt(b.fdt);
    setRoomHours(b.roomHours); setColdHours(b.coldHours); setProofTotal(b.roomHours + b.coldHours);
    if (b.bigaPct) { setBigaPct(b.bigaPct); setBigaTemp(b.bigaTemp); }
    if (id !== "h48" && flour === "strong00") setFlour("pizzeria00");
    if (id === "h48") setFlour("strong00");
  }

  /* ── page Schedule : total de pousse éditable, split room/cold toujours couplé ── */
  const setProofTotalClamped = (v) => {
    const t = clamp(v, 2, proofMax);
    setProofTotal(t);
    if (roomHours > t) setRoomHours(t);
  };
  const setRoomSplit = (v) => setRoomHours(clamp(v, 0, effProof));
  const setColdSplit = (v) => setRoomHours(clamp(effProof - v, 0, effProof));

  /* ── bake date / time helpers ── */
  const setBakeDate = (val) => {
    if (!val) return;
    const [y, mo, da] = val.split("-").map(Number);
    const d = new Date(bakeAt); d.setFullYear(y, mo - 1, da); setBakeAt(d);
  };
  const setBakeClock = (h, m = 0) => {
    const d = new Date(bakeAt); d.setHours(h, m, 0, 0); setBakeAt(d);
  };
  const setBakeTimeStr = (val) => {
    if (!val) return;
    const [h, m] = val.split(":").map(Number); setBakeClock(h, m);
  };

  /* ── CALC (engine §5 — inchangé) ── */
  const calc = useMemo(() => {
    const ball = effBall;
    const totalDough = ball * pizzas;
    const h = effHyd / 100, s = effSalt / 100;
    const flourG = totalDough / (1 + h + s);
    const waterG = flourG * h;
    const saltG = flourG * s;

    let idy;
    if (method === "h48") {
      idy = bigaIdyPct(effBigaTemp) * (effBigaPct / 100);
    } else if (effStrategy === "ambient" || effCold === 0) {
      idy = effStrategy === "bulkhold"
        ? bulkHoldIdyPct(effRoom, effAmbient, 0, effFridge, effHumidity)
        : idyPct(effRoom + effCold || M.hours, effAmbient, effHumidity);
    } else if (effStrategy === "coldmat") {
      idy = coldIdyPct(effRoom, effAmbient, effCold, effFridge, effHumidity);
    } else {
      idy = bulkHoldIdyPct(effRoom, effAmbient, effCold, effFridge, effHumidity);
    }
    const yeastG = (flourG * idy) / 100 * YCONV[effYeast];

    const fr = FRICTION[effMixer];
    const waterTemp =
      method === "h48"
        ? clamp(4 * effFdt - effAmbient - effFlourTemp - effBigaTemp - fr, 2, 45)
        : clamp(3 * effFdt - effAmbient - effFlourTemp - fr, 2, 45);

    let biga = null;
    if (method === "h48") {
      const bf = flourG * (effBigaPct / 100);
      biga = { flour: bf, water: bf * 0.45, yeast: yeastG, restFlour: flourG - bf, restWater: waterG - bf * 0.45 };
    }
    return { ball, totalDough, flourG, waterG, saltG, yeastG, idy, waterTemp, biga };
  }, [effBall, pizzas, effHyd, effSalt, method, effBigaTemp, effBigaPct, effStrategy, effRoom, effCold, effAmbient, effHumidity, effFridge, effYeast, effMixer, effFdt, effFlourTemp, M.hours]);

  /* ── TIMELINE (à rebours depuis bakeAt) ── */
  const schedule = useMemo(() => {
    const steps = [];
    const Hms = 3600e3;
    const temper = effCold > 0 ? Math.min(2, effRoom / 2) : 0;
    const isBiga = method === "h48";
    const bigaH = isBiga ? Math.max(12, M.hours - effRoom - effCold) : 0;

    let lead = effRoom + effCold + bigaH;
    let t = new Date(bakeAt.getTime() - lead * Hms);
    const push = (title, desc, durH, tech) => {
      steps.push({ time: new Date(t), title, desc, dur: durH ? fmtDur(durH) : null, tech });
      if (durH) t = new Date(t.getTime() + durH * Hms);
    };

    if (isBiga) {
      push(tr("Biga — mélange", "Biga — mix"), tr(`${Math.round(calc.biga.flour)} g farine + ${Math.round(calc.biga.water)} g eau + levure. Mélange grossier, sans pétrir.`, `${Math.round(calc.biga.flour)} g flour + ${Math.round(calc.biga.water)} g water + yeast. Rough mix, no kneading.`), 0);
      push(tr("Biga — fermentation", "Biga — fermentation"), tr(`${fmtDur(bigaH)} à ${fmtTemp(effBigaTemp, region)}, couverte.`, `${fmtDur(bigaH)} at ${fmtTemp(effBigaTemp, region)}, covered.`), bigaH);
      push(tr("Pétrissage final", "Final knead"), tr(`Biga + ${Math.round(calc.biga.restFlour)} g farine + ${Math.round(calc.biga.restWater)} g eau à ${fmtTemp(Math.round(calc.waterTemp), region)} + sel.`, `Biga + ${Math.round(calc.biga.restFlour)} g flour + ${Math.round(calc.biga.restWater)} g water at ${fmtTemp(Math.round(calc.waterTemp), region)} + salt.`), 0);
    } else {
      push(tr("Pétrissage", "Knead"), tr(`Eau à ${fmtTemp(Math.round(calc.waterTemp), region)}. Autolyse 20 min possible avant le sel.`, `Water at ${fmtTemp(Math.round(calc.waterTemp), region)}. Optional 20 min autolyse before salt.`), 0, ["autolyse"]);
    }

    if (effStrategy === "ambient" || effCold === 0) {
      const bulk = (effRoom + effCold) * 0.55, proof = (effRoom + effCold) - bulk;
      push(tr("Pointage (bulk)", "Bulk rise"), tr(`${fmtDur(bulk)} à ${fmtTemp(effAmbient, region)}, couvert. 1–2 rabats la première heure.`, `${fmtDur(bulk)} at ${fmtTemp(effAmbient, region)}, covered. 1–2 folds in the first hour.`), bulk, ["coilfold"]);
      push(tr("Boulage (staglio)", "Balling (staglio)"), tr(`${pizzas} pâtons de ${calc.ball} g. Pirlatura serrée.`, `${pizzas} balls of ${calc.ball} g. Tight pirlatura.`), 0, ["pirlatura"]);
      push(tr("Apprêt", "Proof"), tr(`${fmtDur(proof)} à température ambiante, en bac fermé.`, `${fmtDur(proof)} at room temperature, in a closed tray.`), proof, ["poke"]);
    } else if (effStrategy === "coldmat") {
      const bulk = effRoom - temper;
      push(tr("Pointage court", "Short bulk"), tr(`${fmtDur(bulk)} à ${fmtTemp(effAmbient, region)}.`, `${fmtDur(bulk)} at ${fmtTemp(effAmbient, region)}.`), bulk, ["coilfold"]);
      push(tr("Maturation au froid", "Cold maturation"), tr(`${fmtDur(effCold)} au frigo à ${fmtTemp(effFridge, region)} — c'est lui qui travaille.`, `${fmtDur(effCold)} in the fridge at ${fmtTemp(effFridge, region)} — this does the work.`), effCold);
      push(tr("Boulage + détente", "Balling + rest"), tr(`${pizzas} pâtons de ${calc.ball} g, puis ${fmtDur(temper)} à température ambiante.`, `${pizzas} balls of ${calc.ball} g, then ${fmtDur(temper)} at room temperature.`), temper, ["pirlatura", "poke"]);
    } else {
      const bulk = effRoom - temper;
      push(tr("Pointage chaud (bulk)", "Warm bulk"), tr(`${fmtDur(bulk)} à ${fmtTemp(effAmbient, region)} jusqu'au double de volume.`, `${fmtDur(bulk)} at ${fmtTemp(effAmbient, region)} until doubled.`), bulk, ["coilfold"]);
      push(tr("Boulage (staglio)", "Balling (staglio)"), tr(`${pizzas} pâtons de ${calc.ball} g. Pirlatura serrée.`, `${pizzas} balls of ${calc.ball} g. Tight pirlatura.`), 0, ["pirlatura"]);
      push(tr("Frigo-frein", "Fridge brake"), tr(`${fmtDur(effCold)} à ${fmtTemp(effFridge, region)} : le froid freine, il ne fait que tenir.`, `${fmtDur(effCold)} at ${fmtTemp(effFridge, region)}: the cold just holds it back.`), effCold);
      push(tr("Détente (temper)", "Temper"), tr(`${fmtDur(temper)} à température ambiante avant d'étaler.`, `${fmtDur(temper)} at room temperature before stretching.`), temper, ["poke"]);
    }

    steps.push({
      time: new Date(bakeAt.getTime() - O.preheat * 60e3),
      title: tr("Préchauffage du four", "Oven preheat"),
      desc: tr(`${L(O.name)} : ${O.preheat} min. ${locTemps(L(O.tip), region)}`, `${L(O.name)}: ${O.preheat} min. ${locTemps(L(O.tip), region)}`),
    });
    steps.push({
      time: new Date(bakeAt),
      title: tr("🔥 Cuisson", "🔥 Bake"),
      desc: tr(`${L(O.bake)} par pizza.`, `${L(O.bake)} per pizza.`),
      bake: true,
      tech: O.hot ? ["stretch", "launch"] : ["stretch", "twostage"],
    });
    return steps;
  }, [bakeAt, method, effRoom, effCold, effStrategy, effAmbient, effFridge, effBigaTemp, calc, pizzas, O, region, M.hours, lang]);

  /* ── helpers de rendu (avant save/load qui les utilise) ── */
  const gramsOut = (g, dec = 0) =>
    region === "us" ? `${g.toFixed(dec)} g  (${ozOf(g)} oz)` : `${g.toFixed(dec)} g`;
  const yeastIsLow = calc.yeastG < 0.5;
  const doughTier = DOUGH_TIERS.find((d) => d.id === method);

  /* ── R9 : save / load via window.storage ── */
  const collectState = () => ({
    v: 3, lang, region, tier, method, bakeAt: bakeAt.getTime(), oven, targetDia, crust, pizzas, ballManual,
    season, ambient, humidity, storagePreset, flourTempManual, mixer, fridgeTemp,
    yeastType, flour, hyd, saltP, fdt, strategy, roomHours, coldHours, proofTotal, bigaPct, bigaTemp,
  });
  async function saveRecipe() {
    try {
      const code = makeCode();
      const res = await window.storage.set(`recipe:${code}`, JSON.stringify(collectState()), true);
      if (res) { setSaveCode(code); setStorageMsg(null); }
      else setStorageMsg(tr("Échec de l'enregistrement — réessayez.", "Save failed — try again."));
    } catch {
      setStorageMsg(tr("Échec de l'enregistrement — réessayez.", "Save failed — try again."));
    }
  }
  async function loadRecipe() {
    const code = loadInput.trim().toUpperCase();
    if (code.length !== 6) { setStorageMsg(tr("Le code fait 6 caractères.", "The code is 6 characters.")); return; }
    try {
      const r = await window.storage.get(`recipe:${code}`, true);
      const st = JSON.parse(r.value);
      if (!st || (st.v !== 2 && st.v !== 3)) throw new Error("bad shape");
      if (st.lang) setLang(st.lang);
      setRegion(st.region); setTier(st.tier); setMethod(st.method);
      setBakeAt(new Date(st.bakeAt)); setOven(st.oven); setTargetDia(st.targetDia);
      setCrust(st.crust); setPizzas(st.pizzas); setBallManual(st.ballManual ?? null); setSeason(st.season);
      setAmbient(st.ambient); setHumidity(st.humidity); setStoragePreset(st.storagePreset);
      setFlourTempManual(st.flourTempManual); setMixer(st.mixer); setFridgeTemp(st.fridgeTemp);
      setYeastType(st.yeastType); setFlour(st.flour); setHyd(st.hyd); setSaltP(st.saltP);
      setFdt(st.fdt); setStrategy(st.strategy); setRoomHours(st.roomHours);
      setColdHours(st.coldHours);
      setProofTotal(st.proofTotal ?? (METHODS[st.method].bench.roomHours + METHODS[st.method].bench.coldHours));
      setBigaPct(st.bigaPct); setBigaTemp(st.bigaTemp);
      setStarted(true); setStep(LAST_STEP); setStorageMsg(tr(`Recette ${code} chargée ✓`, `Recipe ${code} loaded ✓`)); setLoadInput("");
    } catch {
      setStorageMsg(tr(`Code ${code} introuvable.`, `Code ${code} not found.`));
    }
  }
  const mailtoHref = saveCode
    ? `mailto:?subject=${encodeURIComponent(tr("Ma pâte à pizza — Dough Control", "My pizza dough — Dough Control"))}&body=${encodeURIComponent(
        `${tr("Code de recette", "Recipe code")}: ${saveCode}\n\n${pizzas} × ${calc.ball} g · ${L(doughTier.name)} · ${L(O.name)}\n${tr("Farine", "Flour")} ${Math.round(calc.flourG)} g · ${tr("Eau", "Water")} ${Math.round(calc.waterG)} g · ${tr("Sel", "Salt")} ${calc.saltG.toFixed(1)} g · ${tr("Levure", "Yeast")} ${calc.yeastG.toFixed(2)} g\n${tr("Cuisson", "Bake")}: ${fmtClock(bakeAt, lang)}\n\n${tr("Charge ce code dans Dough Control pour retrouver la recette complète.", "Load this code in Dough Control to recover the full recipe.")}`
      )}`
    : null;

  /* ════════════════════════════ STYLES ═══════════════════════════ */
  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  /* Napoli token system (light only; token-based so a dark map could be added later) */
  :root{--bg:#F7EEDD;--surface:#FFFFFF;--surface2:#F3EAD8;--line:#E7D9C2;--flour:#2B1A12;--dim:#6B5848;--faint:#9A8772;--ember:#CC2A1E;--ember-deep:#A81F16;--gold:#CC2A1E;--basil:#1F7A3D;--green:#1E8A4C;--warn:#A56A12;--danger:#8E1B12}
  .dc{background:var(--bg);min-height:100vh;color:var(--flour);font-family:'Inter',sans-serif;padding:20px 16px 60px}
  .dc *{box-sizing:border-box}
  .wrap{max-width:760px;margin:0 auto}
  .display{font-family:'Anton',sans-serif;font-weight:400;letter-spacing:.5px}
  .mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px;margin-bottom:14px;box-shadow:0 2px 8px rgba(60,30,10,.05)}
  .lbl{font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--faint);font-weight:600;margin-bottom:8px}
  .chip{background:var(--surface);border:1px solid var(--line);color:var(--dim);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s,color .15s}
  .chip:hover{border-color:var(--ember);color:var(--flour)}
  .chip.on{background:var(--ember);border-color:var(--ember);color:#fff}
  .chip.off{opacity:.45;cursor:not-allowed;text-decoration:line-through}
  .chip.off:hover{border-color:var(--line);color:var(--dim)}
  .chip.sm{padding:5px 10px;font-size:12px}
  .star{color:var(--basil);margin-left:5px;cursor:help}
  .chip.on .star{color:#fff}
  .opt{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px 14px;cursor:pointer;transition:border-color .15s,background .15s;text-align:left;width:100%}
  .opt:hover{border-color:var(--ember)}
  .opt.on{border-color:var(--ember);box-shadow:0 0 0 1px var(--ember);background:#FCEFEC}
  .opt.off{opacity:.45;cursor:not-allowed}
  .opt.off:hover{border-color:var(--line)}
  .optName{font-weight:600;font-size:14px}
  .optSub{font-size:12px;color:var(--dim);margin-top:2px}
  .tip{font-size:12px;color:var(--faint);margin-top:6px;line-height:1.5}
  .why{font-size:12px;color:var(--ember);margin-top:6px;line-height:1.4}
  input[type=range].dcr{-webkit-appearance:none;width:100%;height:6px;background:var(--surface2);border-radius:4px;outline:none;box-shadow:inset 0 1px 2px rgba(60,30,10,.14)}
  input[type=range].dcr::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--ember);cursor:pointer;border:3px solid var(--surface);box-shadow:0 2px 5px rgba(60,30,10,.3)}
  input[type=range].dcr::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--ember);cursor:pointer;border:3px solid var(--surface);box-shadow:0 2px 5px rgba(60,30,10,.3)}
  .val{color:var(--gold);font-weight:600}
  .btn{background:var(--ember);color:#fff;border:none;border-radius:8px;padding:12px 22px;font-weight:600;font-size:14px;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s}
  .btn:hover{background:var(--ember-deep)}
  .btn.ghost{background:transparent;border:1px solid var(--line);color:var(--dim)}
  .btn.ghost:hover{border-color:var(--ember);color:var(--ember)}
  .btn:disabled{opacity:.4;cursor:not-allowed}
  .btn:focus-visible,.chip:focus-visible,.opt:focus-visible,.sel:focus-visible,.stepbtn:focus-visible,.techbtn:focus-visible,input.txt:focus-visible,.sdot:focus-visible{outline:2px solid var(--ember);outline-offset:2px}
  .stepper{display:flex;align-items:center;gap:0;margin:18px 0 22px}
  .sdot{width:30px;height:30px;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--faint);cursor:pointer;flex-shrink:0;background:var(--surface)}
  .sdot.on{border-color:var(--ember);color:var(--ember)}
  .sdot.done{border-color:var(--basil);color:var(--basil)}
  .sdot.off{opacity:.4;cursor:not-allowed}
  .sline{flex:1;height:2px;background:var(--line);min-width:6px}
  .ticket{background:var(--surface);color:var(--flour);border:1px solid var(--line);border-radius:12px;padding:24px 22px 22px;font-family:'JetBrains Mono',monospace;box-shadow:0 2px 8px rgba(60,30,10,.06);position:relative;overflow:hidden}
  .ticket::before{content:'';position:absolute;top:0;left:0;right:0;height:12px;background-image:linear-gradient(45deg,var(--ember) 25%,transparent 25%,transparent 75%,var(--ember) 75%),linear-gradient(45deg,var(--ember) 25%,transparent 25%,transparent 75%,var(--ember) 75%);background-size:12px 12px;background-position:0 0,6px 6px}
  .trow{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line);font-size:14px}
  .trow.big{font-size:16px;font-weight:600}
  .tl{position:relative;padding-left:26px}
  .tl::before{content:'';position:absolute;left:7px;top:8px;bottom:8px;width:2px;background:var(--line)}
  .tli{position:relative;padding:10px 0}
  .tli::before{content:'';position:absolute;left:-24px;top:15px;width:12px;height:12px;border-radius:50%;background:var(--ember);border:3px solid var(--surface)}
  .tli.bake::before{background:var(--basil)}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--ember);color:var(--flour);padding:12px 20px;border-radius:10px;font-size:13px;z-index:50;max-width:90%;box-shadow:0 6px 24px rgba(60,30,10,.18)}
  .pillrow{display:flex;flex-wrap:wrap;gap:8px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  @media(max-width:560px){.grid3{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}}
  .codebox{background:var(--surface2);border:1px dashed var(--ember);border-radius:10px;padding:14px;text-align:center}
  .codebig{font-size:28px;letter-spacing:6px;color:var(--ember);font-weight:600}
  input.txt{background:var(--surface);border:1px solid var(--line);border-radius:8px;color:var(--flour);padding:10px 12px;font-size:14px;font-family:'JetBrains Mono',monospace;width:100%}
  input.txt:focus{outline:none;border-color:var(--ember)}
  .sel{background:var(--surface);border:1px solid var(--line);border-radius:8px;color:var(--flour);padding:11px 12px;font-size:14px;font-family:'Inter',sans-serif;width:100%;cursor:pointer}
  .sel:focus{outline:none;border-color:var(--ember)}
  .stepbox{display:inline-flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface)}
  .stepbtn{background:var(--surface);border:none;color:var(--ember);font-size:20px;font-weight:700;width:42px;height:42px;cursor:pointer;line-height:1}
  .stepbtn:hover{background:var(--surface2);color:var(--ember-deep)}
  .stepbtn:disabled{opacity:.3;cursor:not-allowed}
  .stepval{min-width:62px;text-align:center;font-size:17px;font-weight:700;color:var(--flour);font-family:'JetBrains Mono',monospace}
  .htop{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .hgrp{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .trackwrap{position:relative;padding-top:4px}
  .trackstar{position:absolute;top:-2px;transform:translateX(-50%);color:var(--basil);font-size:13px;pointer-events:none}
  .checkerstrip{height:14px;border-radius:0 0 7px 7px;margin:10px -14px -12px;background-image:linear-gradient(45deg,var(--ember) 25%,transparent 25%,transparent 75%,var(--ember) 75%),linear-gradient(45deg,var(--ember) 25%,transparent 25%,transparent 75%,var(--ember) 75%);background-size:14px 14px;background-position:0 0,7px 7px}
  /* brand devices (scoped decoration) */
  .checker{height:14px;background-image:linear-gradient(45deg,var(--ember) 25%,transparent 25%,transparent 75%,var(--ember) 75%),linear-gradient(45deg,var(--ember) 25%,transparent 25%,transparent 75%,var(--ember) 75%);background-size:16px 16px;background-position:0 0,8px 8px;background-color:var(--bg)}
  .emblem{display:inline-block;color:var(--ember);line-height:1;text-align:center}
  .eline{display:flex;align-items:center;justify-content:center;gap:13px;margin-bottom:1px}
  .estd{font-family:'Anton',sans-serif;font-size:15px;letter-spacing:1px;text-transform:uppercase}
  .esmall{font-family:'Anton',sans-serif;font-size:24px;letter-spacing:.5px;text-transform:uppercase}
  .ebig{font-family:'Anton',sans-serif;font-size:48px;letter-spacing:.5px;text-transform:uppercase;line-height:.82}
  .etag{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--ember);margin-top:9px}
  .wordmark{font-family:'Anton',sans-serif;font-size:23px;letter-spacing:.5px;text-transform:uppercase;color:var(--ember);line-height:1}
  .tricolore{display:flex;align-items:center;gap:10px;color:var(--faint);font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;justify-content:center;margin-top:10px}
  .tricolore::before,.tricolore::after{content:'';height:4px;flex:1;border-radius:2px;background:linear-gradient(to right,var(--green) 0 33%,#fff 33% 66%,var(--ember) 66% 100%)}
  .qbox{background:var(--surface2);border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:8px;padding:10px 12px;margin-bottom:10px}
  .qfix{font-size:12px;color:var(--basil);margin-top:4px}.qfix b{color:var(--basil)}
  .ffix{font-size:12px;color:var(--gold);margin-top:3px}.ffix b{color:var(--gold)}
  .techbtn{background:none;border:none;color:var(--ember);font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;padding:2px 0}
  .techbtn:hover{color:var(--ember-deep)}
  .techfig{display:flex;gap:12px;align-items:center;background:var(--surface2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px}
  .techmedia{flex:0 0 auto;width:132px;height:112px;display:flex;align-items:center;justify-content:center}
  .techvid{width:132px;height:112px;border-radius:8px;object-fit:cover}
  @media(max-width:560px){.techfig{flex-direction:column;align-items:flex-start}}
  .t-pulse{transform-box:fill-box;transform-origin:center;animation:t-pulse 2.4s ease-in-out infinite}
  @keyframes t-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  .t-drop{animation:t-drop 2.4s ease-in infinite}
  @keyframes t-drop{0%{transform:translateY(0);opacity:0}25%{opacity:1}55%,100%{transform:translateY(30px);opacity:0}}
  .t-swirl{transform-box:fill-box;transform-origin:bottom;animation:t-swirl 2.4s ease-in-out infinite}
  @keyframes t-swirl{0%,100%{transform:rotate(-22deg)}50%{transform:rotate(22deg)}}
  .t-lift{transform-box:fill-box;transform-origin:bottom;animation:t-lift 2.6s ease-in-out infinite}
  @keyframes t-lift{0%,100%{transform:translateY(0) scaleY(1)}45%{transform:translateY(-18px) scaleY(1.15)}}
  .t-round{transform-box:fill-box;transform-origin:66px 62px;animation:t-round 3s linear infinite}
  @keyframes t-round{to{transform:rotate(360deg)}}
  .t-tighten{transform-box:fill-box;transform-origin:center;animation:t-tighten 3s ease-in-out infinite}
  @keyframes t-tighten{0%{transform:scale(1.12)}100%{transform:scale(.92)}}
  .t-poke{animation:t-poke 2.8s ease-in-out infinite}
  @keyframes t-poke{0%,100%{transform:translateY(0)}30%{transform:translateY(26px)}45%{transform:translateY(26px)}80%{transform:translateY(4px)}}
  .t-grow{transform-box:fill-box;transform-origin:center;animation:t-grow 2.6s ease-out infinite}
  @keyframes t-grow{0%{transform:scale(.45)}70%,100%{transform:scale(1)}}
  .t-launch{animation:t-launch 2.8s ease-in-out infinite}
  @keyframes t-launch{0%{transform:translateX(38px)}40%,100%{transform:translateX(0)}}
  .t-turn{transform-box:fill-box;transform-origin:center;animation:t-turn 2.8s steps(4) infinite}
  @keyframes t-turn{to{transform:rotate(360deg)}}
  .t-heat{animation:t-heat 1.6s ease-in-out infinite}
  @keyframes t-heat{0%,100%{opacity:.25}50%{opacity:1}}
  @media(prefers-reduced-motion:reduce){.dc *{transition:none!important}.techsvg *{animation:none!important}}
  @media print{
    body{background:#fff!important}
    .no-print{display:none!important}
    .dc{background:#fff;color:#241A12;padding:0}
    .print-area .card{background:#fff;border-color:#ccc;color:#241A12;break-inside:avoid}
    .print-area .lbl{color:#666}.print-area .tip,.print-area .optSub{color:#555}
    .print-area .tl::before{background:#ccc}.print-area .tli::before{border-color:#fff}
    .ticket{box-shadow:none;border:1px solid #ccc}
  }`;

  /* ── petits composants UI ── */
  const Slider = ({ label, value, set, min, max, step: st = 1, unit = "", display, star }) => {
    const starPct = star != null ? clamp(((star - min) / (max - min)) * 100, 0, 100) : null;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: "var(--dim)" }}>{label}</span>
          <span className="mono val">{display ?? `${value}${unit}`}</span>
        </div>
        <div className="trackwrap">
          {starPct != null && <span className="trackstar" style={{ left: `${starPct}%` }} title={tr("Recommandé", "Recommended")}>★</span>}
          <input type="range" className="dcr" min={min} max={max} step={st} value={value}
            onChange={(e) => set(parseFloat(e.target.value))} />
        </div>
      </div>
    );
  };

  const Stepper = ({ value, set, min, max, fmt }) => (
    <div className="stepbox">
      <button className="stepbtn" onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} aria-label="−">−</button>
      <span className="stepval">{fmt ? fmt(value) : value}</span>
      <button className="stepbtn" onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} aria-label="+">+</button>
    </div>
  );

  /* ── header global du wizard (back · units · lang · ball · niveau) ── */
  const WizHeader = () => (
    <>
      <div className="no-print htop" style={{ marginBottom: 10 }}>
        <div className="wordmark">Dough Control</div>
        <div style={{ flex: 1 }} />
        <div className="hgrp">
          <button className="chip sm" onClick={() => setLang(lang === "fr" ? "en" : "fr")} title={tr("Langue", "Language")}>
            🌐 {lang === "fr" ? "EN" : "FR"}
          </button>
          <button className="chip sm" onClick={() => setRegion(region === "eu" ? "us" : "eu")} title={tr("Unités / région", "Units / region")}>
            {R.flag} {region === "us" ? "°F/oz" : "°C/g"}
          </button>
        </div>
      </div>
      <div className="no-print htop" style={{ marginBottom: 6 }}>
        <div className="hgrp" title={tr("Nombre de pizzas", "Number of pizzas")}>
          <span className="lbl" style={{ margin: 0 }}>🍕</span>
          <Stepper value={pizzas} set={setPizzas} min={1} max={12} />
        </div>
        <div style={{ flex: 1 }} />
        <div className="pillrow">
          {Object.entries(TIERS).map(([id, t]) => (
            <button key={id} className={`chip sm ${tier === id ? "on" : ""}`}
              onClick={() => setTier(id)} title={L(t.desc)}>
              {t.icon} {L(t.name)}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const BackBtn = () => (
    <button className="btn ghost no-print"
      onClick={() => (step === 0 ? setStarted(false) : setStep(step - 1))}>
      ← {step === 0 ? tr("Accueil", "Main menu") : tr("Retour", "Back")}
    </button>
  );
  const NavRow = ({ next, nextLabel }) => (
    <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
      <BackBtn />
      <div style={{ flex: 1 }} />
      {next && <button className="btn" onClick={next}>{nextLabel} →</button>}
    </div>
  );

  /* steps : Schedule (4) seulement pour Passionné/Pizzaiolo */
  const showSchedule = !isAmateur;
  const STEP_DEFS = [
    { key: "profile", name: { fr: "Profil", en: "Profile" } },
    { key: "dough", name: { fr: "Pâte", en: "Dough" } },
    { key: "tools", name: { fr: "Outils", en: "Tools" } },
    { key: "ingredients", name: { fr: "Ingrédients", en: "Ingredients" } },
    ...(showSchedule ? [{ key: "schedule", name: { fr: "Planning", en: "Schedule" } }] : []),
    { key: "recipe", name: { fr: "Recette", en: "Recipe" } },
  ];
  const LAST_STEP = STEP_DEFS.length - 1;
  const cstep = Math.min(step, LAST_STEP);
  const stepKey = STEP_DEFS[cstep].key;

  /* ════════════════════════ ÉCRAN DE DÉPART ══════════════════════ */
  if (!started) {
    return (
      <div className="dc">
        <style>{css}</style>
        <div className="wrap" style={{ maxWidth: 640, paddingTop: 40 }}>
          <div className="htop" style={{ marginBottom: 14 }}>
            <div style={{ flex: 1 }} />
            <div className="emblem">
              <div className="eline"><span className="estd">Estd.</span><span className="esmall">Dough</span><span className="estd">2026</span></div>
              <div className="ebig">Control</div>
              <div className="etag">{tr("Pâte napolitaine au gramme près", "Gram-precise Neapolitan dough")}</div>
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <button className="chip sm" onClick={() => setLang(lang === "fr" ? "en" : "fr")}>🌐 {lang === "fr" ? "EN" : "FR"}</button>
            </div>
          </div>
          <div className="checker" style={{ margin: "0 -16px 18px" }} />
          <div style={{ color: "var(--dim)", marginTop: 8, marginBottom: 18, lineHeight: 1.5 }}>
            {tr(
              "Dough Control transforme une heure de cuisson en une recette napolitaine au gramme près. Dites-lui quand vous voulez manger, votre matériel et votre cuisine — il dimensionne la pâte, calcule la dose de levure et construit votre planning, étape par étape.",
              "Dough Control turns a target bake time into a gram-precise Neapolitan dough recipe. Tell it when you want to eat, your gear and your kitchen — it sizes the dough, works out the yeast dose, and builds your timeline, step by step."
            )}
          </div>
          <div className="pillrow" style={{ marginBottom: 26 }}>
            {[
              tr("⏱ Planifié à rebours depuis l'heure de cuisson", "⏱ Planned backwards from your bake time"),
              tr("⚖ Pesé au gramme près", "⚖ Weighed to the gram"),
              tr("🔥 Optimisé fours Ooni / Gozney", "🔥 Tuned for Ooni / Gozney ovens"),
            ].map((b) => (
              <span key={b} className="chip sm" style={{ cursor: "default" }}>{b}</span>
            ))}
          </div>

          <div className="card">
            <div className="lbl">{tr("Votre région", "Your region")}</div>
            <div className="pillrow">
              {Object.entries(REGIONS).map(([id, r]) => (
                <button key={id} className={`chip ${region === id ? "on" : ""}`} onClick={() => setRegion(id)}>
                  {r.flag} {r.label}
                </button>
              ))}
            </div>
            <div className="tip">
              {tr("Détermine les produits recommandés et les unités :", "Sets the recommended products and the units:")}
              {region === "us" ? tr(" °F + onces en complément des grammes.", " °F + ounces alongside grams.") : tr(" °C et grammes.", " °C and grams.")}
            </div>
          </div>

          <div className="card">
            <div className="lbl">{tr("Reprendre une recette", "Resume a recipe")}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="txt" style={{ width: 140, textTransform: "uppercase" }}
                placeholder={tr("CODE…", "CODE…")} maxLength={6} value={loadInput}
                onChange={(e) => setLoadInput(e.target.value)} />
              <button className="btn ghost" onClick={loadRecipe}>{tr("Charger", "Load")}</button>
            </div>
            <div className="tip">
              {tr(
                "Chaque recette sauvegardée reçoit un code à 6 caractères (sur le dernier écran). Saisissez-le ici pour recharger la recette à l'identique, sur n'importe quel appareil. Sinon, démarrez une nouvelle recette ci-dessous.",
                "Every saved recipe gets a 6-character code (on the final screen). Enter it here to reload that exact recipe on any device. Otherwise, start a new recipe below."
              )}
            </div>
            {storageMsg && <div className="tip" style={{ marginTop: 8, color: "var(--gold)" }}>{storageMsg}</div>}
          </div>

          <button className="btn" onClick={() => { setStep(0); setStarted(true); }}>{tr("Commencer une recette", "Start a recipe")} →</button>
        </div>
      </div>
    );
  }

  /* ════════════════════════ WIZARD ═══════════════════════════════ */
  return (
    <div className="dc">
      <style>{css}</style>
      <div className="wrap">
        <WizHeader />

        {/* Stepper */}
        <div className="stepper no-print">
          {STEP_DEFS.map((d, i) => (
            <span key={d.key} style={{ display: "contents" }}>
              {i > 0 && <span className="sline" />}
              <button className={`sdot ${i === cstep ? "on" : i < cstep ? "done" : ""}`}
                onClick={() => setStep(i)} aria-label={L(d.name)} title={L(d.name)}>
                {i < cstep ? "✓" : i + 1}
              </button>
            </span>
          ))}
        </div>
        <div className="lbl no-print" style={{ fontSize: 13, color: "var(--ember)", marginBottom: 12 }}>
          {tr("Étape", "Step")} {cstep + 1} — {L(STEP_DEFS[cstep].name)}
        </div>

        {/* ════ PAGE 1 — PROFIL ════ */}
        {stepKey === "profile" && (
          <>
            <div className="card">
              <div className="lbl">{tr("Région & unités", "Region & units")}</div>
              <div className="pillrow">
                {Object.entries(REGIONS).map(([id, r]) => (
                  <button key={id} className={`chip ${region === id ? "on" : ""}`} onClick={() => setRegion(id)}>
                    {r.flag} {r.label} · {id === "us" ? "°F/oz" : "°C/g"}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="lbl">{tr("Date de cuisson", "Bake date")}</div>
              <input className="txt" type="date" value={toDateInput(bakeAt)}
                onChange={(e) => setBakeDate(e.target.value)} style={{ maxWidth: 220 }} />

              <div className="lbl" style={{ marginTop: 16 }}>{tr("Première pizza au four", "First pizza in the oven")}</div>
              <div className="pillrow">
                {TIME_PRESETS.map((h) => (
                  <button key={h} className={`chip ${bakeAt.getHours() === h && bakeAt.getMinutes() === 0 ? "on" : ""}`}
                    onClick={() => setBakeClock(h, 0)}>{p2(h)}:00</button>
                ))}
                <input className="txt" type="time" value={toTimeInput(bakeAt)}
                  onChange={(e) => setBakeTimeStr(e.target.value)} style={{ width: 120 }} />
              </div>
              <div className="tip">
                {tr("Soit dans", "That's in")} <span className="mono val">{hoursUntil > 0 ? fmtDur(hoursUntil) : "—"}</span>.
                {tr(" Tout le planning sera calculé à rebours depuis ce moment.", " The whole plan is computed backwards from this moment.")}
              </div>
              <div className="tip">
                ⏲ {tr(
                  "Prévoyez ~30 min en plus du temps de pousse pour le mélange, le boulage et le préchauffage. Une pâte marquée « serré » tient dans le délai mais laisse peu de marge.",
                  "Allow ~30 min on top of the proof time for mixing, balling and preheat. A dough tier flagged “tight” still fits your window but leaves little slack."
                )}
              </div>
            </div>

            <div className="card">
              <div className="lbl">{tr("Nombre de pizzas", "Number of pizzas")}</div>
              <Stepper value={pizzas} set={setPizzas} min={1} max={12} />
              <div className="tip">
                → {tr("Pâton", "Ball")} <span className="mono val">{calc.ball} g</span> {tr("par pizza", "per pizza")}
                {region === "us" ? ` (${ozOf(calc.ball)} oz)` : ""}.
              </div>
            </div>

            <div className="card">
              <div className="lbl">{tr("Votre niveau", "Your level")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(TIERS).map(([id, t]) => (
                  <button key={id} className={`opt ${tier === id ? "on" : ""}`} onClick={() => setTier(id)}>
                    <div className="optName">
                      {t.icon} {L(t.name)} <span style={{ color: "var(--faint)", fontWeight: 400 }}>— "{t.flavor}"</span>
                      {t.preferred && <STAR why={tr("Le meilleur compromis pour la plupart des gens.", "The best fit for most people.")} />}
                    </div>
                    <div className="optSub">{L(t.desc)}</div>
                  </button>
                ))}
              </div>
            </div>

            <NavRow next={() => setStep(1)} nextLabel={tr("Suivant : la pâte", "Next: the dough")} />
          </>
        )}

        {/* ════ PAGE 2 — PÂTE ════ */}
        {stepKey === "dough" && (
          <>
            <div className="card">
              <div className="lbl">{tr("Profil de pâte", "Dough profile")}</div>
              <div className="grid3">
                {DOUGH_TIERS.map((d) => {
                  const fits = methodFits(d.id);
                  const tight = methodTight(d.id);
                  const bench = METHODS[d.id].bench;
                  return (
                    <button key={d.id} className={`opt ${method === d.id ? "on" : ""} ${!fits ? "off" : ""}`}
                      onClick={() => fits && pickMethod(d.id)}
                      title={!fits ? tr(`Nécessite ≥ ${METHODS[d.id].hours} h (+ ~30 min de prép.)`, `Needs ≥ ${METHODS[d.id].hours} h (+ ~30 min prep)`) : L(d.hint)}>
                      <div className="optName display" style={{ fontSize: 19 }}>
                        {d.name}{d.preferred && fits && <STAR why={L(d.whyPreferred)} />}
                      </div>
                      <div className="optSub">{L(d.tag)} · {bench.hyd}% {tr("hyd", "hyd")}</div>
                      {!fits && <div className="tip" style={{ color: "var(--warn)" }}>
                        {tr(`≥ ${METHODS[d.id].hours} h requis`, `needs ≥ ${METHODS[d.id].hours} h`)} · {fmtDur(Math.max(0, hoursUntil))} {tr("dispo", "avail")}
                      </div>}
                      {fits && tight && <div className="tip" style={{ color: "var(--gold)" }}>
                        ⏲ {tr("serré côté prép.", "tight on prep")}
                      </div>}
                    </button>
                  );
                })}
              </div>
              <div className="tip">{L(doughTier.hint)}</div>

              {isExpert ? (
                <div style={{ marginTop: 14 }}>
                  <Slider label={tr("Hydratation", "Hydration")} value={hyd} set={setHyd} min={55} max={75} unit=" %" star={M.bench.hyd} />
                  <Slider label={tr("Poids de pâton", "Ball weight")} value={effBall}
                    set={(v) => setBallManual(v)} min={150} max={420} step={5} unit=" g" star={baseBall} />
                  {ballManual != null && (
                    <button className="techbtn" onClick={() => setBallManual(null)}>↺ {tr("revenir au poids recommandé", "back to recommended weight")}</button>
                  )}
                </div>
              ) : (
                <div className="tip">
                  {tr("Hydratation", "Hydration")} <span className="mono val">{effHyd} %</span> ·
                  {tr(" pâton", " ball")} <span className="mono val">{calc.ball} g</span> —
                  {tr(" réglés sur le benchmark. Passez en Pizzaiolo pour ajuster.", " set from the benchmark. Switch to Pizzaiolo to fine-tune.")}
                </div>
              )}
            </div>

            <div className="card">
              <div className="lbl">{tr("Méthode de fermentation", "Fermentation method")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {STRATEGY_ORDER.map((id) => {
                  const s = STRATEGIES[id];
                  const allowed = allowedStrategies.includes(id);
                  const on = effStrategy === id;
                  const locked = isAmateur || !allowed;
                  return (
                    <button key={id} className={`opt ${on ? "on" : ""} ${locked && !on ? "off" : ""}`}
                      onClick={() => !locked && setStrategy(id)}
                      title={!allowed
                        ? tr("Classico (6 h) est trop court pour le froid — Diretto uniquement.", "Classico (6 h) is too short for the fridge — Diretto only.")
                        : isAmateur ? tr("L'outil choisit pour vous au niveau Amateur.", "The tool picks for you at Amateur level.") : ""}>
                      <div className="optName">
                        {s.it} <span style={{ color: "var(--faint)", fontWeight: 400, fontSize: 12 }}>— {L(s.name)}</span>
                        {s.preferred && <STAR why={L(s.whyPreferred)} />}
                      </div>
                      <div className="optSub">⏱ {L(s.timing)}</div>
                      <div className="tip" style={{ color: on ? "var(--gold)" : "var(--faint)" }}>{L(s.flavor)}</div>
                      {on && <div className="checkerstrip" />}
                    </button>
                  );
                })}
              </div>
              {method === "h6" && !isAmateur && <div className="tip">{tr("Classico (6 h) n'autorise que le Diretto — choisissez Napoletano ou Maestro pour fermenter au froid.", "Classico (6 h) only allows Diretto — pick Napoletano or Maestro for cold fermentation.")}</div>}
              {isAmateur && <div className="tip">{tr("Méthode recommandée verrouillée. Passez en Passionné pour la changer.", "Recommended method locked. Switch to Passionate to change it.")}</div>}
            </div>

            <NavRow next={() => setStep(2)} nextLabel={tr("Suivant : les outils", "Next: your tools")} />
          </>
        )}

        {/* ════ PAGE 3 — OUTILS ════ */}
        {stepKey === "tools" && (
          <>
            <div className="card">
              <div className="lbl">{tr("Votre four", "Your oven")}</div>
              <select className="sel" value={oven}
                onChange={(e) => { setOven(e.target.value); const o = OVENS.find((x) => x.id === e.target.value); setTargetDia((d) => Math.min(d, o.maxDia)); }}>
                {OVENS.map((o) => (
                  <option key={o.id} value={o.id}>{L(o.name)} — Ø max {o.maxDia} cm</option>
                ))}
              </select>
              <div className="tip">{locTemps(L(O.tip), region)}</div>

              <div className="lbl" style={{ marginTop: 16 }}>{tr("Diamètre des pizzas", "Pizza diameter")}</div>
              {isAmateur ? (
                <div className="tip">
                  <span className="mono val">{effDia} cm</span> — {tr("sweet spot de votre four", "your oven's sweet spot")} <STAR why={tr("Ooni et Gozney recommandent de débuter à 30 cm.", "Ooni and Gozney recommend starting at 30 cm.")} />
                </div>
              ) : (
                <Slider label={tr("Diamètre cible", "Target diameter")} value={effDia} set={setTargetDia}
                  min={isExpert ? 16 : 20} max={isExpert ? 42 : O.maxDia} unit=" cm" />
              )}

              {!isAmateur && (
                <>
                  <div className="lbl" style={{ marginTop: 8 }}>{tr("Style de croûte", "Crust style")}</div>
                  <div className="pillrow">
                    {CRUSTS.map((c) => (
                      <button key={c.id} className={`chip ${effCrust === c.id ? "on" : ""}`} onClick={() => setCrust(c.id)}>
                        {L(c.name)}{c.preferred && <STAR why={L(c.whyPreferred)} />}
                      </button>
                    ))}
                  </div>
                  <div className="tip">{L(CRUSTS.find((c) => c.id === effCrust).tip)}</div>
                </>
              )}
              <div className="tip">→ {tr("Pâton", "Ball")} <span className="mono val">{calc.ball} g</span> (Ø {effDia} cm).</div>
            </div>

            <div className="card">
              <div className="lbl">{tr("Votre cuisine", "Your kitchen")}</div>
              <div className="pillrow">
                {SEASONS.map((s) => (
                  <button key={s.id} className={`chip ${season === s.id ? "on" : ""}`}
                    onClick={() => { setSeason(s.id); setAmbient(s.amb); setHumidity(s.hum); }}>
                    {L(s.name)}
                  </button>
                ))}
              </div>
              {isAmateur ? (
                <div className="tip">
                  {tr("Température ambiante estimée :", "Estimated room temperature:")} <span className="mono val">{fmtTemp(effAmbient, region)}</span> — {tr("réglée pour vous.", "set for you.")}
                </div>
              ) : (
                <>
                  <div className="lbl" style={{ marginTop: 14 }}>{tr("Température ambiante", "Room temperature")}</div>
                  <Stepper value={ambient} set={setAmbient} min={14} max={38} fmt={(v) => fmtTemp(v, region)} />
                  <div className="lbl" style={{ marginTop: 14 }}>{tr("Humidité", "Humidity")}</div>
                  <div className="pillrow">
                    {[["dry", tr("Sec", "Dry")], ["normal", tr("Normal", "Normal")], ["humid", tr("Humide", "Humid")]].map(([id, n]) => (
                      <button key={id} className={`chip ${humidity === id ? "on" : ""}`} onClick={() => setHumidity(id)}>{n}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="lbl">{tr("Où vit votre farine ?", "Where does your flour live?")}</div>
              <div className="grid3">
                {STORAGE_PRESETS.map((s) => (
                  <button key={s.id} className={`opt ${storagePreset === s.id ? "on" : ""}`}
                    onClick={() => { setStoragePreset(s.id); setFlourTempManual(null); }}>
                    <div className="optName">{s.icon} {L(s.name)}{s.preferred && <STAR why={L(s.whyPreferred)} />}</div>
                    <div className="optSub mono">≈ {fmtTemp(s.t, region)}</div>
                  </button>
                ))}
              </div>
              {isExpert && (
                <>
                  <div style={{ height: 12 }} />
                  <Slider label={tr("Température exacte de la farine", "Exact flour temperature")} value={flourTempManual ?? storage.t}
                    set={setFlourTempManual} min={5} max={30} display={fmtTemp(flourTempManual ?? storage.t, region)} />
                </>
              )}
              <div className="tip">{tr("Sert au calcul de la température d'eau pour atteindre la FDT visée.", "Used to compute the water temperature that hits the target dough temp.")}</div>
            </div>

            <div className="card">
              <div className="lbl">{tr("Comment pétrissez-vous ?", "How do you knead?")}</div>
              <div className="pillrow">
                {MIXERS.map((m) => (
                  <button key={m.id} className={`chip ${effMixer === m.id ? "on" : ""}`} onClick={() => setMixer(m.id)}>
                    {L(m.name)}{m.id === autoMixer && <STAR why={L(m.why) || tr("Recommandé pour votre quantité de pâtons.", "Recommended for your batch size.")} />}
                  </button>
                ))}
              </div>
              <div className="tip">
                {L(MIXERS.find((m) => m.id === effMixer).tip)}
                {effMixer === "spiral" && ` ${L(MIXERS[2].best)}`}
              </div>
              <div className="why">
                ★ {L(MIXERS.find((m) => m.id === autoMixer).name)} — {pizzas > 6
                  ? tr("recommandé au-delà de 6 pâtons.", "recommended past 6 balls.")
                  : tr("recommandé jusqu'à 6 pâtons.", "recommended up to 6 balls.")}
                {" "}→ {tr("Eau à", "Water at")} <span className="mono">{fmtTemp(Math.round(calc.waterTemp), region)}</span>.
              </div>
            </div>

            {usesFridge && (
              <div className="card">
                <div className="lbl">{tr("Température du frigo", "Fridge temperature")}</div>
                {isExpert ? (
                  <Slider label={tr("Frigo", "Fridge")} value={fridgeTemp} set={setFridgeTemp} min={2} max={8}
                    display={fmtTemp(fridgeTemp, region)} />
                ) : (
                  <div className="tip">{tr("Réglé à", "Set to")} <span className="mono val">{fmtTemp(effFridge, region)}</span> — {tr("le standard d'un frigo domestique.", "the standard home-fridge value.")}</div>
                )}
              </div>
            )}

            <NavRow next={() => setStep(3)} nextLabel={tr("Suivant : les ingrédients", "Next: ingredients")} />
          </>
        )}

        {/* ════ PAGE 4 — INGRÉDIENTS ════ */}
        {stepKey === "ingredients" && (
          <>
            <div className="card">
              <div className="lbl">{tr("Levure", "Yeast")}</div>
              {isAmateur ? (
                <div className="tip">
                  <span className="val">{L(YEASTS.instant.name)}</span> <STAR why={L(YEASTS.instant.whyPreferred)} /> — {R.instant}. {L(YEASTS.instant.tip)}
                </div>
              ) : (
                <>
                  <div className="pillrow">
                    {Object.entries(YEASTS).map(([id, y]) => (
                      <button key={id} className={`chip ${effYeast === id ? "on" : ""}`} onClick={() => setYeastType(id)}>
                        {L(y.name)}{y.preferred && <STAR why={L(y.whyPreferred)} />}
                      </button>
                    ))}
                  </div>
                  <div className="tip">{L(YEASTS[effYeast].tip)}</div>
                  <div className="why">{tr("À acheter", "To buy")} ({R.label}) : {R[YEASTS[effYeast].exKey]}</div>
                </>
              )}
            </div>

            <div className="card">
              <div className="lbl">{tr("Farine", "Flour")}</div>
              {isAmateur ? (
                <div className="tip">
                  <span className="val">{L(FLOURS[effFlour].name)}</span> <STAR why={L(FLOURS[effFlour].whyPreferred)} /> — {R[FLOURS[effFlour].exKey]}
                </div>
              ) : (
                <>
                  <div className="grid2">
                    {Object.entries(FLOURS).map(([id, f]) => {
                      const star = (f.preferredFor === "direct" && method !== "h48") || (f.preferredFor === "biga" && method === "h48");
                      return (
                        <button key={id} className={`opt ${effFlour === id ? "on" : ""}`} onClick={() => setFlour(id)}>
                          <div className="optName">{L(f.name)}{star && <STAR why={L(f.whyPreferred)} />}</div>
                          <div className="optSub">{L(f.sub)} · {tr("idéal", "ideal")} {f.window}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="tip">{L(FLOURS[effFlour].tip)}</div>
                  <div className="why">{tr("À acheter", "To buy")} ({R.label}) : {R[FLOURS[effFlour].exKey]}</div>
                  {FLOURS[effFlour].warn && M.hours > 6 && (
                    <div className="tip" style={{ color: "var(--warn)" }}>
                      ⚠ {tr(`Trop faible pour ${doughTier.name} — préférez une 00 pizzeria.`, `Too weak for ${doughTier.name} — prefer a 00 pizzeria.`)}
                    </div>
                  )}
                  {effHyd > FLOURS[effFlour].maxHyd && (
                    <div className="tip" style={{ color: "var(--warn)" }}>
                      ⚠ {tr(`${effHyd} % d'hydratation dépasse le plafond de cette farine (${FLOURS[effFlour].maxHyd} %).`, `${effHyd}% hydration exceeds this flour's ceiling (${FLOURS[effFlour].maxHyd}%).`)}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card">
              <div className="lbl">{tr("Tomates & sel", "Tomatoes & salt")} <STAR why={tr("La base de la napolitaine — pas de cuisson de sauce, juste écrasées avec du sel.", "The Neapolitan base — no cooked sauce, just crushed with salt.")} /></div>
              <div className="tip">{tr("À acheter", "To buy")} ({R.label}) : <span className="val">{R.tomato}</span> · {tr("Sel", "Salt")} : {R.salt}</div>
            </div>

            {isExpert && (
              <div className="card">
                <div className="lbl">{tr("Chimie de la pâte (Pizzaiolo)", "Dough chemistry (Pizzaiolo)")}</div>
                <Slider label={tr("Sel", "Salt")} value={saltP} set={setSaltP} min={1.8} max={3.2} step={0.01} unit=" %" star={M.bench.saltP} />
                <Slider label={tr("FDT (température de pâte visée)", "Target dough temp")} value={fdt} set={setFdt} min={20} max={27}
                  display={fmtTemp(fdt, region)} star={M.bench.fdt} />
                {method === "h48" && (
                  <>
                    <Slider label={tr("Part de farine en biga", "Biga flour share")} value={bigaPct} set={setBigaPct} min={20} max={100} unit=" %" />
                    <Slider label={tr("Température de la biga", "Biga temperature")} value={bigaTemp} set={setBigaTemp} min={14} max={22}
                      display={fmtTemp(bigaTemp, region)} />
                  </>
                )}
              </div>
            )}

            <NavRow next={() => setStep(4)} nextLabel={showSchedule ? tr("Suivant : le planning", "Next: schedule") : tr("Voir ma recette", "See my recipe")} />
          </>
        )}

        {/* ════ PAGE 5 — SCHEDULE (Passionné + Pizzaiolo) ════ */}
        {stepKey === "schedule" && (
          <>
            <div className="card">
              <div className="lbl">{tr("Jouez avec votre planning", "Play with your schedule")}</div>

              <div className="lbl" style={{ marginTop: 6 }}>{tr("Température ambiante", "Room temperature")}</div>
              <Stepper value={ambient} set={setAmbient} min={14} max={38} fmt={(v) => fmtTemp(v, region)} />

              {isBiga ? (
                <div className="tip" style={{ marginTop: 14 }}>
                  {tr("En mode biga (Maestro), la fenêtre ambiante/frigo est gérée automatiquement autour de la biga.", "In biga mode (Maestro), the room/fridge window is handled automatically around the biga.")}
                </div>
              ) : (
                <>
                  <div className="lbl" style={{ marginTop: 16 }}>{tr("Temps de pousse total", "Total proof time")}</div>
                  <Stepper value={effProof} set={setProofTotalClamped} min={2} max={proofMax} fmt={(v) => `${v} h`} />
                  <div className="tip">
                    {tr("Par défaut, le temps de la pâte choisie", "Defaults to your chosen dough time")} ({doughTier.name}).
                    {effProof < (M.bench.roomHours + M.bench.coldHours) && tr(" Réduit pour tenir dans le délai disponible.", " Reduced to fit your available window.")}
                  </div>

                  {usesFridge ? (
                    <div style={{ marginTop: 14 }}>
                      <div className="tip" style={{ marginTop: 0 }}>{tr("Répartissez ce total entre ambiante et frigo — les deux curseurs somment toujours au total.", "Split that total between room and fridge — the two sliders always sum to the total.")}</div>
                      <Slider label={tr("Heures à température ambiante", "Hours at room temperature")} value={effRoom} set={setRoomSplit}
                        min={0} max={effProof} step={0.5} unit=" h" />
                      <Slider label={tr("Heures au froid", "Hours in the fridge")} value={effCold} set={setColdSplit}
                        min={0} max={effProof} step={0.5} unit=" h" />
                      <div className="tip">
                        {tr("Ambiante", "Room")} <span className="mono val">{effRoom.toFixed(1)} h</span> + {tr("froid", "fridge")} <span className="mono val">{effCold.toFixed(1)} h</span> = <span className="mono val">{effProof} h</span> ✓
                      </div>
                    </div>
                  ) : (
                    <div className="tip" style={{ marginTop: 12 }}>
                      {tr("Méthode Diretto : tout se passe à température ambiante", "Diretto method: everything at room temperature")} (<span className="mono val">{effProof} h</span>).
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card">
              <div className="lbl">{tr("Total des ingrédients (s'adapte au planning)", "Ingredient quick-total (adapts to the schedule)")}</div>
              <div className="trow"><span>{tr("Farine", "Flour")} ({L(FLOURS[effFlour].name)})</span><span className="mono">{gramsOut(calc.flourG)}</span></div>
              <div className="trow"><span>{tr("Eau", "Water")} ({fmtTemp(Math.round(calc.waterTemp), region)})</span><span className="mono">{gramsOut(calc.waterG)}</span></div>
              <div className="trow"><span>{tr("Sel", "Salt")} ({effSalt} %)</span><span className="mono">{gramsOut(calc.saltG, 1)}</span></div>
              <div className="trow"><span>{tr("Levure", "Yeast")} {L(YEASTS[effYeast].name).toLowerCase()}</span><span className="mono">{gramsOut(calc.yeastG, 2)}</span></div>
              <div className="tip">{tr("Plus de froid ⇒ moins de levure : le total se recalcule en direct.", "More fridge ⇒ less yeast: the total recomputes live.")}</div>
            </div>

            <NavRow next={() => setStep(LAST_STEP)} nextLabel={tr("Voir ma recette", "See my recipe")} />
          </>
        )}

        {/* ════ PAGE 6 — RECETTE ════ */}
        {stepKey === "recipe" && (
          <div className="print-area">
            <div className="ticket" style={{ marginBottom: 20 }}>
              <div style={{ textAlign: "center", borderBottom: "1px dashed var(--line)", paddingBottom: 12, marginBottom: 12 }}>
                <div className="display" style={{ fontSize: 30, lineHeight: .95, color: "var(--ember)", textTransform: "uppercase", letterSpacing: ".5px" }}>Pizza Napoletana</div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 6 }}>{pizzas} × {calc.ball} g · Ø {effDia} cm · {doughTier.name} · {L(O.name)}</div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>{tr("Cuisson", "Bake")} : {fmtClock(bakeAt, lang)}</div>
              </div>
              <div className="trow big"><span>{tr("Farine", "Flour")} ({L(FLOURS[effFlour].name)})</span><span>{gramsOut(calc.flourG)}</span></div>
              <div className="trow big"><span>{tr("Eau", "Water")} ({fmtTemp(Math.round(calc.waterTemp), region)})</span><span>{gramsOut(calc.waterG)}</span></div>
              <div className="trow"><span>{tr("Sel", "Salt")} ({effSalt} %)</span><span>{gramsOut(calc.saltG, 1)}</span></div>
              <div className="trow"><span>{tr("Levure", "Yeast")} {L(YEASTS[effYeast].name).toLowerCase()} ({(calc.idy * YCONV[effYeast]).toFixed(2)} %)</span><span>{gramsOut(calc.yeastG, 2)}</span></div>
              <div className="trow"><span>{tr("Hydratation", "Hydration")}</span><span>{effHyd} %</span></div>
              {calc.biga && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, margin: "10px 0 4px" }}>— BIGA (45 % hyd) —</div>
                  <div className="trow"><span>{tr("Farine biga", "Biga flour")}</span><span>{gramsOut(calc.biga.flour)}</span></div>
                  <div className="trow"><span>{tr("Eau biga", "Biga water")}</span><span>{gramsOut(calc.biga.water)}</span></div>
                  <div className="trow"><span>{tr("Toute la levure dans la biga", "All the yeast in the biga")}</span><span>{gramsOut(calc.yeastG, 2)}</span></div>
                  <div style={{ fontSize: 12, fontWeight: 600, margin: "10px 0 4px" }}>— {tr("RAFRAÎCHI", "REFRESH")} —</div>
                  <div className="trow"><span>{tr("Farine", "Flour")}</span><span>{gramsOut(calc.biga.restFlour)}</span></div>
                  <div className="trow"><span>{tr("Eau + sel", "Water + salt")}</span><span>{gramsOut(calc.biga.restWater)}</span></div>
                </>
              )}
              {yeastIsLow && (
                <div style={{ fontSize: 11, marginTop: 10, color: "var(--warn)" }}>
                  ⚖ {tr("Dose très faible : utilisez une balance 0,01 g, ou diluez 1 g dans 100 g d'eau et pesez l'eau de levure ×100.", "Very low dose: use a 0.01 g scale, or dissolve 1 g in 100 g water and weigh the yeast-water ×100.")}
                </div>
              )}
              <div className="tricolore">{tr("Impasto napoletano", "Impasto napoletano")}</div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="lbl">{tr("Votre planning — à rebours depuis", "Your plan — backwards from")} {fmtClock(bakeAt, lang)}</div>
              <div className="tl">
                {schedule.map((s, i) => (
                  <div key={i} className={`tli ${s.bake ? "bake" : ""}`}>
                    <div className="mono" style={{ color: "var(--gold)", fontSize: 13 }}>
                      {fmtClock(s.time, lang)}{s.dur ? ` · ${s.dur}` : ""}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, margin: "2px 0" }}>{s.title}</div>
                    <div className="tip" style={{ marginTop: 0 }}>{s.desc}</div>
                    {s.tech && s.tech.length > 0 && (
                      <div className="no-print" style={{ marginTop: 6 }}>
                        <button className="techbtn" onClick={() => setOpenTech(openTech === i ? null : i)} aria-expanded={openTech === i}>
                          {openTech === i ? "▾" : "▸"} {openTech === i ? tr("Masquer la technique", "Hide technique") : tr("Voir la technique", "Show technique")}
                        </button>
                        {openTech === i && s.tech.map((tid) => {
                          const T = TECH_BY_ID[tid];
                          if (!T) return null;
                          return (
                            <div key={tid} className="techfig">
                              <div className="techmedia">
                                {T.media ? <video className="techvid" src={T.media} autoPlay loop muted playsInline /> : <T.Svg />}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--flour)" }}>{L(T.name)}</div>
                                <div className="tip" style={{ marginTop: 2 }}>{L(T.blurb)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Carte four */}
            <div className="card">
              <div className="lbl">{tr("Cuisson", "Bake")} — {L(O.name)}</div>
              {O.hot ? (
                <div className="tip" style={{ fontSize: 13, color: "var(--dim)" }}>
                  {tr("Préchauffage", "Preheat")} <span className="mono val">{O.preheat} min</span> {tr("à pleine puissance, sole saturée.", "at full power, stone saturated.")}
                  {tr(" Enfournez,", " Launch,")} <span className="val">{L(O.bake)}</span>, {tr("quart de tour régulier.", "regular quarter-turns.")} {locTemps(L(O.tip), region)}
                </div>
              ) : (
                <div className="tip" style={{ fontSize: 13, color: "var(--dim)" }}>
                  <b style={{ color: "var(--flour)" }}>{tr("Cuisson en deux temps :", "Two-stage bake:")}</b><br />
                  {tr("1 — Four au max", "1 — Oven at max")} ({fmtTemp(275, region)}) {tr("avec acier/pierre préchauffé", "with steel/stone preheated")} {O.preheat} min.
                  {tr(" Base saucée", " Sauced base")} <i>{tr("sans fromage", "without cheese")}</i>, {tr("4–5 min sur l'acier.", "4–5 min on the steel.")}<br />
                  {tr("2 — Sortez, ajoutez mozzarella et basilic, repassez 2–3 min sous le", "2 — Pull it out, add mozzarella and basil, broil 2–3 min under the")} <b>{tr("grill à fond", "full broiler")}</b> {tr("pour le léopard.", "for the leoparding.")}
                </div>
              )}
            </div>

            {/* Troubleshooter — quick fix / forever fix */}
            <div className="card no-print">
              <div className="lbl">{tr("Au secours !", "Help!")}</div>
              <div className="pillrow" style={{ marginBottom: 12 }}>
                {TROUBLE_CATS.map((c) => (
                  <button key={c.id} className={`chip sm ${troubleCat === c.id ? "on" : ""}`} onClick={() => setTroubleCat(c.id)}>
                    {L(c.name)}
                  </button>
                ))}
              </div>
              {TROUBLES.filter((t) => troubleCat === "all" || t.cat === troubleCat).map((t, i) => (
                <div key={i} className="qbox">
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--warn)" }}>{L(t.q)}</div>
                  <div className="qfix"><b>{tr("Réparation express", "Quick fix")} :</b> {L(t.quick)}</div>
                  <div className="ffix"><b>{tr("Réparation durable", "Forever fix")} :</b> {L(t.forever)}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="card no-print">
              <div className="lbl">{tr("Garder cette recette", "Keep this recipe")}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <button className="btn" onClick={() => window.print()}>🖨 {tr("Télécharger en PDF", "Download as PDF")}</button>
                <button className="btn ghost" onClick={saveRecipe}>💾 {tr("Sauvegarder pour plus tard", "Save for later")}</button>
                {saveCode && mailtoHref && (
                  <a className="btn ghost" style={{ textDecoration: "none", display: "inline-block" }} href={mailtoHref}>
                    ✉️ {tr("M'envoyer le code par email", "Email me the code")}
                  </a>
                )}
              </div>
              {saveCode && (
                <div className="codebox">
                  <div className="lbl" style={{ marginBottom: 4 }}>{tr("Votre code de recette", "Your recipe code")}</div>
                  <div className="codebig mono">{saveCode}</div>
                  <div className="tip">{tr("Saisissez-le sur l'écran d'accueil pour recharger la recette à l'identique.", "Enter it on the start screen to reload the exact recipe.")}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12, maxWidth: 320 }}>
                <input className="txt" placeholder={tr("Charger un code…", "Load a code…")} maxLength={6}
                  style={{ textTransform: "uppercase" }} value={loadInput} onChange={(e) => setLoadInput(e.target.value)} />
                <button className="btn ghost" onClick={loadRecipe}>{tr("Charger", "Load")}</button>
              </div>
              {storageMsg && <div className="tip" style={{ color: "var(--gold)", marginTop: 8 }}>{storageMsg}</div>}
            </div>

            <NavRow />
          </div>
        )}

        {/* Toast R3 */}
        {notice && <div className="toast no-print">{notice}</div>}
      </div>
    </div>
  );
}
