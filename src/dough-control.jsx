import { useState, useMemo, useEffect } from "react";

/* ════════════════════════════════════════════════════════════════
   DOUGH CONTROL — v2 (Sprint 2)
   R1 région US/EU + unités · R2 niveaux de difficulté · R3 gating
   temps · R4 presets farine · R5 ★ recommandés · R6/R7 gating
   expert + bulk-then-hold par défaut · R9 save code + PDF print
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
    fresh: "Red Star / Fleischmann's cake yeast (rare en rayon)",
    instant: "SAF Instant (rouge) ★, Fleischmann's RapidRise",
    ady: "Red Star Active Dry",
    tomato: "San Marzano importées ★, Bianco DiNapoli, Cento DOP",
    salt: "Sel fin de mer (Diamond Crystal en alternative)",
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

/* ───────────────────────── R2 — NIVEAUX ───────────────────────── */
const TIERS = {
  amateur: {
    name: "Amateur", flavor: "Piece of Cake", icon: "🍕",
    desc: "Je réponds à 4 questions, l'outil choisit tout le reste. Résultat garanti.",
  },
  enthusiast: {
    name: "Passionné", flavor: "Let's Rock", icon: "🔥",
    desc: "Je règle mon environnement et mes ingrédients, l'outil verrouille la chimie.",
  },
  expert: {
    name: "Pizzaiolo", flavor: "Damn I'm Good", icon: "👨‍🍳",
    desc: "Tous les curseurs : hydratation, sel, FDT, stratégies de fermentation, biga.",
  },
};

/* ───────────────────────── DONNÉES ────────────────────────────── */
const METHODS = {
  h6: {
    id: "h6", name: "6 H", sub: "Direct express", hours: 6,
    why: "Décision du jour. Bonne pâte, arômes simples.",
    bench: { hyd: 60, saltP: 2.5, fdt: 25, roomHours: 6, coldHours: 0 },
  },
  h24: {
    id: "h24", name: "24 H", sub: "Le standard pizzaiolo", hours: 24, preferred: true,
    whyPreferred: "Meilleur équilibre goût / effort — la recette de référence primée.",
    why: "Maturation complète, digestibilité, le profil du benchmark primé.",
    bench: { hyd: 62, saltP: 2.33, fdt: 23, roomHours: 14, coldHours: 10 },
  },
  h48: {
    id: "h48", name: "48 H Biga", sub: "Préferment, croûte canotto", hours: 48,
    why: "Complexité aromatique maximale, alvéolage spectaculaire.",
    bench: { hyd: 65, saltP: 2.5, fdt: 22, roomHours: 8, coldHours: 22, bigaPct: 30, bigaTemp: 18 },
  },
};

const OVENS = [
  { id: "koda12", name: "Ooni Koda 12", maxDia: 30, hot: true, preheat: 20, bake: "60–90 s", tip: "Sole ~430–450 °C. Quart de tour toutes les 20 s." },
  { id: "koda16", name: "Ooni Koda 16", maxDia: 40, hot: true, preheat: 25, bake: "60–90 s", tip: "Brûleur en L : moins de rotations nécessaires." },
  { id: "karu12", name: "Ooni Karu 12", maxDia: 30, hot: true, preheat: 20, bake: "60–90 s", tip: "Bois ou gaz. Au bois, gérer la flamme avant chaque enfournement." },
  { id: "karu16", name: "Ooni Karu 16", maxDia: 40, hot: true, preheat: 25, bake: "60–90 s", tip: "Multi-combustible, recommandé AVPN." },
  { id: "volt12", name: "Ooni Volt 12", maxDia: 30, hot: true, preheat: 25, bake: "90–120 s", tip: "Électrique, plafonne ~400 °C : cuisson un peu plus longue." },
  { id: "roccbox", name: "Gozney Roccbox", maxDia: 30, hot: true, preheat: 25, bake: "60–90 s", tip: "Pierre dense, excellente rétention entre deux pizzas." },
  { id: "arc", name: "Gozney Arc", maxDia: 35, hot: true, preheat: 25, bake: "60–90 s", tip: "Flamme latérale roulante : moins de rotations." },
  { id: "arcxl", name: "Gozney Arc XL", maxDia: 40, hot: true, preheat: 25, bake: "60–90 s", tip: "Flamme latérale, chaleur douce et homogène." },
  { id: "dome", name: "Gozney Dome", maxDia: 40, hot: true, preheat: 30, bake: "60–90 s", tip: "Bois/gaz, énorme inertie thermique." },
  { id: "wood", name: "Four à bois (autre)", maxDia: 42, hot: true, preheat: 60, bake: "60–90 s", tip: "Viser 450–485 °C de voûte." },
  { id: "home", name: "Four domestique + acier/pierre", maxDia: 33, hot: false, preheat: 60, bake: "6–8 min en 2 temps", tip: "250–300 °C max : cuisson en deux temps obligatoire." },
];

const CRUSTS = [
  { id: "thin", name: "Fine", den: 0.32, tip: "Croûte basse, croustillante." },
  { id: "classic", name: "Classique napolitaine", den: 0.36, preferred: true, whyPreferred: "Le standard napolitain : corniche aérée, centre souple.", tip: "Le bon équilibre corniche / centre." },
  { id: "canotto", name: "Canotto", den: 0.42, tip: "Corniche XXL très gonflée — idéal avec biga." },
];

const FLOURS = {
  pizzeria00: {
    name: "Tipo 00 pizzeria", sub: "W260–300 · ~12,5 % prot.",
    maxHyd: 65, window: "6–24 h", preferredFor: "direct",
    whyPreferred: "La farine de référence pour le direct 6–24 h.",
    exKey: "flour00",
    tip: "La référence napolitaine pour fermentation directe.",
  },
  strong00: {
    name: "Tipo 00 forte", sub: "W300–340 · 13–14 % prot.",
    maxHyd: 72, window: "24–72 h", preferredFor: "biga",
    whyPreferred: "Assez de force pour la biga et les longues maturations.",
    exKey: "flourStrong",
    tip: "Pour longues maturations et préferments.",
  },
  bread: {
    name: "Farine de force", sub: "~12,5 % prot.",
    maxHyd: 68, window: "6–48 h", exKey: "flourBread",
    tip: "Substitut accessible, croûte un peu plus croustillante.",
  },
  ap: {
    name: "Farine classique", sub: "~10,5 % prot.",
    maxHyd: 58, window: "≤ 6 h", exKey: "flourAP",
    tip: "Faible : éviter au-delà de 6 h ou de 58 % d'hydratation.",
    warn: true,
  },
};

const SEASONS = [
  { id: "winter", name: "Hiver", amb: 19, hum: "dry" },
  { id: "spring", name: "Printemps", amb: 21, hum: "normal" },
  { id: "summer", name: "Été", amb: 26, hum: "humid" },
  { id: "autumn", name: "Automne", amb: 21, hum: "normal" },
];

/* R4 — presets de stockage farine */
const STORAGE_PRESETS = [
  { id: "cupboard", name: "Placard de cuisine", icon: "🏠", t: 21, preferred: true, whyPreferred: "Le cas le plus courant à la maison." },
  { id: "cool", name: "Endroit frais et sec", icon: "🌬️", t: 18 },
  { id: "cellar", name: "Cave / cellier", icon: "🧱", t: 15 },
];

const MIXERS = [
  { id: "hand", name: "À la main", preferred: true, whyPreferred: "Accessible à tous, et largement suffisant pour 1–6 pâtons.", tip: "Slap & fold 8–10 min. Friction +1 °C." },
  { id: "stand", name: "Robot pâtissier", tip: "Crochet, vitesse 1–2, ~10 min. Friction +5 °C." },
  { id: "spiral", name: "Pétrin spirale", best: "Le meilleur si vous en possédez un.", tip: "8 min vitesse lente. Friction +3 °C." },
];

const YEASTS = {
  fresh: { name: "Fraîche", exKey: "fresh", preferred: true, whyPreferred: "La tradition napolitaine — et notre benchmark la reproduit au gramme.", tip: "Conserver au frigo, utiliser sous 2 semaines." },
  instant: { name: "Sèche instantanée", exKey: "instant", beginner: true, tip: "Directement dans la farine, jamais dans l'eau salée. Se conserve très bien." },
  ady: { name: "Sèche active", exKey: "ady", tip: "Réhydrater 10 min dans un peu d'eau tiède avant usage." },
};

const STRATEGIES = {
  bulkhold: {
    name: "Bulk, puis frigo-frein", preferred: true,
    whyPreferred: "Le profil du benchmark primé : pousse complète à T° ambiante, le frigo ne fait que freiner. Le plus fiable.",
    desc: "Pointage chaud jusqu'au double, frigo en frein, détente avant cuisson.",
  },
  coldmat: {
    name: "Maturation froide",
    desc: "Pointage court, le frigo fait le travail de maturation sur la durée.",
  },
  ambient: {
    name: "Température ambiante",
    desc: "Aucun passage au froid : tout se joue à température ambiante.",
  },
};

const TROUBLES = [
  { cat: "dough", q: "La pâte colle énormément", a: "Hydratation trop haute pour la farine, ou pétrissage insuffisant. Rabats supplémentaires + mains mouillées, pas de farine en excès." },
  { cat: "dough", q: "La pâte n'a pas levé", a: "Levure morte (vieille / eau trop chaude) ou pièce trop froide. Testez votre levure dans l'eau sucrée tiède : elle doit mousser en 10 min." },
  { cat: "dough", q: "La pâte a trop poussé (sur-fermentée)", a: "Odeur d'alcool, pâte qui s'affaisse. Refaites des boules, 30 min de détente, cuisez vite. La prochaine fois : moins de levure ou plus de froid." },
  { cat: "stretch", q: "La pâte se rétracte quand je l'étale", a: "Réseau de gluten trop tendu : pas assez de détente. Laissez reposer 15–20 min de plus à température ambiante." },
  { cat: "stretch", q: "La pâte se déchire", a: "Sur-fermentation ou farine trop faible pour le temps choisi. Manipulez du centre vers le bord, jamais la corniche." },
  { cat: "bake", q: "Dessous brûlé, dessus pâle", a: "Sole trop chaude. Laissez la flamme retomber 1–2 min entre deux pizzas, ou réduisez la puissance avant d'enfourner." },
  { cat: "bake", q: "Corniche pâle, sans léopard", a: "Four pas assez chaud ou pâton trop froid. Préchauffez plus longtemps, sortez les pâtons plus tôt du frigo." },
  { cat: "bake", q: "Centre détrempé", a: "Trop de sauce / mozzarella trop humide. Égouttez la fior di latte 1 h, sauce en couche fine." },
];
const TROUBLE_CATS = [
  { id: "all", name: "Tout" },
  { id: "dough", name: "Pâte" },
  { id: "stretch", name: "Étalage" },
  { id: "bake", name: "Cuisson" },
];

/* ───────────────────────── HELPERS ────────────────────────────── */
const CODE_CHARS = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const makeCode = () =>
  Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

const fmtClock = (d) =>
  d.toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
const fmtDur = (h) => {
  if (h <= 0) return "";
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh} h${mm ? ` ${mm}` : ""}` : `${mm} min`;
};
const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const STAR = ({ why }) => (
  <span className="star" title={why || "Choix recommandé"}>★</span>
);

/* ════════════════════════════════════════════════════════════════ */
export default function DoughControl() {
  /* ── méta ── */
  const [started, setStarted] = useState(false);
  const [region, setRegion] = useState("eu");           // R1
  const [tier, setTier] = useState("enthusiast");       // R2
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState(null);           // R3 fallback toast

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

  /* ── cuisine ── */
  const [season, setSeason] = useState("spring");
  const [ambient, setAmbient] = useState(21);
  const [humidity, setHumidity] = useState("normal");
  const [storagePreset, setStoragePreset] = useState("cupboard"); // R4
  const [flourTempManual, setFlourTempManual] = useState(null);   // expert only
  const [mixer, setMixer] = useState("hand");
  const [fridgeTemp, setFridgeTemp] = useState(5);

  /* ── ingrédients ── */
  const [yeastType, setYeastType] = useState("fresh");
  const [flour, setFlour] = useState("pizzeria00");
  const [hyd, setHyd] = useState(62);
  const [saltP, setSaltP] = useState(2.33);
  const [fdt, setFdt] = useState(23);

  /* ── fermentation ── */
  const [strategy, setStrategy] = useState("bulkhold"); // R7
  const [roomHours, setRoomHours] = useState(14);
  const [coldHours, setColdHours] = useState(10);
  const [bigaPct, setBigaPct] = useState(30);
  const [bigaTemp, setBigaTemp] = useState(18);

  /* ── R9 save/load ── */
  const [saveCode, setSaveCode] = useState(null);
  const [loadInput, setLoadInput] = useState("");
  const [storageMsg, setStorageMsg] = useState(null);

  /* ── troubleshooter ── */
  const [troubleCat, setTroubleCat] = useState("all");

  const isExpert = tier === "expert";
  const isAmateur = tier === "amateur";
  const M = METHODS[method];
  const O = OVENS.find((o) => o.id === oven);
  const R = REGIONS[region];

  /* ── valeurs effectives selon le niveau (R2/R4/R6/R7, §15) ── */
  const effCrust = isAmateur ? "classic" : crust;
  const effDia = isAmateur ? Math.min(30, O.maxDia) : Math.min(targetDia, O.maxDia);
  const seasonData = SEASONS.find((s) => s.id === season);
  const effAmbient = isAmateur ? seasonData.amb : ambient;
  const effHumidity = isAmateur ? seasonData.hum : humidity;
  const effMixer = isAmateur ? "hand" : mixer;
  const effFridge = isExpert ? fridgeTemp : 5;
  const effYeast = isAmateur ? "instant" : yeastType;
  const flourAuto = method === "h48" ? "strong00" : "pizzeria00";
  const effFlour = isAmateur ? flourAuto : flour;
  const effHyd = isExpert ? hyd : M.bench.hyd;
  const effSalt = isExpert ? saltP : M.bench.saltP;
  const effFdt = isExpert ? fdt : M.bench.fdt;
  const effStrategy = isExpert ? strategy : "bulkhold";
  const effRoom = isExpert ? roomHours : M.bench.roomHours;
  const effCold = isExpert ? (effStrategy === "ambient" ? 0 : coldHours) : M.bench.coldHours;
  const effBigaPct = isExpert ? bigaPct : (M.bench.bigaPct || 30);
  const effBigaTemp = isExpert ? bigaTemp : (M.bench.bigaTemp || 18);
  const storage = STORAGE_PRESETS.find((s) => s.id === storagePreset);
  const effFlourTemp = isExpert && flourTempManual != null ? flourTempManual : storage.t;

  /* ── R3 : gating des méthodes par temps disponible ── */
  const hoursUntil = (bakeAt.getTime() - Date.now()) / 3600e3;
  const methodFits = (m) => hoursUntil >= METHODS[m].hours + 0.5;
  useEffect(() => {
    if (!methodFits(method)) {
      const fallback = ["h48", "h24", "h6"].find((m) => methodFits(m));
      if (fallback && fallback !== method) {
        pickMethod(fallback);
        setNotice(`⏱ ${METHODS[method].name} ne tient plus dans le délai — bascule automatique sur ${METHODS[fallback].name}.`);
      } else if (!fallback) {
        setNotice("⏱ Moins de 6 h 30 avant la cuisson : aucune méthode ne tient. Repoussez l'heure.");
      }
    }
  }, [bakeAt]); // eslint-disable-line

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ── sélection méthode : charge le benchmark ── */
  function pickMethod(id) {
    const b = METHODS[id].bench;
    setMethod(id);
    setHyd(b.hyd); setSaltP(b.saltP); setFdt(b.fdt);
    setRoomHours(b.roomHours); setColdHours(b.coldHours);
    if (b.bigaPct) { setBigaPct(b.bigaPct); setBigaTemp(b.bigaTemp); }
    if (id !== "h48" && flour === "strong00") setFlour("pizzeria00");
    if (id === "h48") setFlour("strong00");
  }

  /* ── curseurs temps couplés (budget §5.9) ── */
  const budget = M.hours - (method === "h48" ? Math.max(12, M.hours - effRoom - effCold) : 0);
  function setRoom(v) {
    const max = M.hours - (method === "h48" ? 12 : 0);
    const r = clamp(v, 1, max);
    setRoomHours(r);
    if (r + coldHours > max) setColdHours(max - r);
  }
  function setCold(v) {
    const max = M.hours - (method === "h48" ? 12 : 0);
    const c = clamp(v, 0, max - 1);
    setColdHours(c);
    if (roomHours + c > max) setRoomHours(max - c);
  }

  /* ── CALC : le memo central ── */
  const calc = useMemo(() => {
    const den = CRUSTS.find((c) => c.id === effCrust).den;
    const ball = ballWeight(effDia, den);
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
  }, [effCrust, effDia, pizzas, effHyd, effSalt, method, effBigaTemp, effBigaPct, effStrategy, effRoom, effCold, effAmbient, effHumidity, effFridge, effYeast, effMixer, effFdt, effFlourTemp, M.hours]);

  /* ── TIMELINE (à rebours depuis bakeAt) ── */
  const schedule = useMemo(() => {
    const steps = [];
    const Hms = 3600e3;
    const temper = effCold > 0 ? Math.min(2, effRoom / 2) : 0;
    const isBiga = method === "h48";
    const bigaH = isBiga ? Math.max(12, M.hours - effRoom - effCold) : 0;

    let lead = effRoom + effCold + bigaH;
    let t = new Date(bakeAt.getTime() - lead * Hms);
    const push = (title, desc, durH) => {
      steps.push({ time: new Date(t), title, desc, dur: durH ? fmtDur(durH) : null });
      if (durH) t = new Date(t.getTime() + durH * Hms);
    };

    if (isBiga) {
      push("Biga — mélange", `${Math.round(calc.biga.flour)} g farine + ${Math.round(calc.biga.water)} g eau + levure. Mélange grossier, sans pétrir.`, 0);
      push("Biga — fermentation", `${fmtDur(bigaH)} à ${fmtTemp(effBigaTemp, region)}, couverte.`, bigaH);
      push("Pétrissage final", `Biga + ${Math.round(calc.biga.restFlour)} g farine + ${Math.round(calc.biga.restWater)} g eau à ${fmtTemp(Math.round(calc.waterTemp), region)} + sel.`, 0);
    } else {
      push("Pétrissage", `Eau à ${fmtTemp(Math.round(calc.waterTemp), region)}. Autolyse 20 min possible avant le sel.`, 0);
    }

    if (effStrategy === "ambient" || effCold === 0) {
      const bulk = (effRoom + effCold) * 0.55, proof = (effRoom + effCold) - bulk;
      push("Pointage (bulk)", `${fmtDur(bulk)} à ${fmtTemp(effAmbient, region)}, couvert. 1–2 rabats la première heure.`, bulk);
      push("Boulage (staglio)", `${pizzas} pâtons de ${calc.ball} g. Pirlatura serrée.`, 0);
      push("Apprêt", `${fmtDur(proof)} à température ambiante, en bac fermé.`, proof);
    } else if (effStrategy === "coldmat") {
      const bulk = effRoom - temper;
      push("Pointage court", `${fmtDur(bulk)} à ${fmtTemp(effAmbient, region)}.`, bulk);
      push("Maturation au froid", `${fmtDur(effCold)} au frigo à ${fmtTemp(effFridge, region)} — c'est lui qui travaille.`, effCold);
      push("Boulage + détente", `${pizzas} pâtons de ${calc.ball} g, puis ${fmtDur(temper)} à température ambiante.`, temper);
    } else {
      const bulk = effRoom - temper;
      push("Pointage chaud (bulk)", `${fmtDur(bulk)} à ${fmtTemp(effAmbient, region)} jusqu'au double de volume.`, bulk);
      push("Boulage (staglio)", `${pizzas} pâtons de ${calc.ball} g. Pirlatura serrée.`, 0);
      push("Frigo-frein", `${fmtDur(effCold)} à ${fmtTemp(effFridge, region)} : le froid freine, il ne fait que tenir.`, effCold);
      push("Détente (temper)", `${fmtDur(temper)} à température ambiante avant d'étaler.`, temper);
    }

    steps.push({
      time: new Date(bakeAt.getTime() - O.preheat * 60e3),
      title: "Préchauffage du four",
      desc: `${O.name} : ${O.preheat} min. ${locTemps(O.tip, region)}`,
    });
    steps.push({ time: new Date(bakeAt), title: "🔥 Cuisson", desc: `${O.bake} par pizza.`, bake: true });
    return steps;
  }, [bakeAt, method, effRoom, effCold, effStrategy, effAmbient, effFridge, effBigaTemp, calc, pizzas, O, region, M.hours]);

  /* ── R9 : save / load via window.storage ── */
  const collectState = () => ({
    v: 2, region, tier, method, bakeAt: bakeAt.getTime(), oven, targetDia, crust, pizzas,
    season, ambient, humidity, storagePreset, flourTempManual, mixer, fridgeTemp,
    yeastType, flour, hyd, saltP, fdt, strategy, roomHours, coldHours, bigaPct, bigaTemp,
  });
  async function saveRecipe() {
    try {
      const code = makeCode();
      const res = await window.storage.set(`recipe:${code}`, JSON.stringify(collectState()), true);
      if (res) { setSaveCode(code); setStorageMsg(null); }
      else setStorageMsg("Échec de l'enregistrement — réessayez.");
    } catch {
      setStorageMsg("Échec de l'enregistrement — réessayez.");
    }
  }
  async function loadRecipe() {
    const code = loadInput.trim().toUpperCase();
    if (code.length !== 6) { setStorageMsg("Le code fait 6 caractères."); return; }
    try {
      const r = await window.storage.get(`recipe:${code}`, true);
      const st = JSON.parse(r.value);
      if (!st || st.v !== 2) throw new Error("bad shape");
      setRegion(st.region); setTier(st.tier); setMethod(st.method);
      setBakeAt(new Date(st.bakeAt)); setOven(st.oven); setTargetDia(st.targetDia);
      setCrust(st.crust); setPizzas(st.pizzas); setSeason(st.season);
      setAmbient(st.ambient); setHumidity(st.humidity); setStoragePreset(st.storagePreset);
      setFlourTempManual(st.flourTempManual); setMixer(st.mixer); setFridgeTemp(st.fridgeTemp);
      setYeastType(st.yeastType); setFlour(st.flour); setHyd(st.hyd); setSaltP(st.saltP);
      setFdt(st.fdt); setStrategy(st.strategy); setRoomHours(st.roomHours);
      setColdHours(st.coldHours); setBigaPct(st.bigaPct); setBigaTemp(st.bigaTemp);
      setStarted(true); setStep(4); setStorageMsg(`Recette ${code} chargée ✓`); setLoadInput("");
    } catch {
      setStorageMsg(`Code ${code} introuvable.`);
    }
  }
  const mailtoHref = saveCode
    ? `mailto:?subject=${encodeURIComponent("Ma pâte à pizza — Dough Control")}&body=${encodeURIComponent(
        `Code de recette : ${saveCode}\n\n${pizzas} × ${calc.ball} g · ${M.name} · ${O.name}\nFarine ${Math.round(calc.flourG)} g · Eau ${Math.round(calc.waterG)} g · Sel ${calc.saltG.toFixed(1)} g · Levure ${calc.yeastG.toFixed(2)} g\nCuisson : ${fmtClock(bakeAt)}\n\nCharge ce code dans Dough Control pour retrouver la recette complète.`
      )}`
    : null;

  /* ── helpers de rendu ── */
  const gramsOut = (g, dec = 0) =>
    region === "us"
      ? `${g.toFixed(dec)} g  (${ozOf(g)} oz)`
      : `${g.toFixed(dec)} g`;

  const yeastIsLow = calc.yeastG < 0.5;

  /* ════════════════════════════ STYLES ═══════════════════════════ */
  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Albert+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  :root{--bg:#141110;--surface:#1E1916;--surface2:#262019;--line:#383028;--flour:#EFE7D8;--dim:#A89B89;--faint:#6E6354;--ember:#FF6B2C;--gold:#E8B44A;--basil:#8FB573;--warn:#E0563C}
  .dc{background:var(--bg);min-height:100vh;color:var(--flour);font-family:'Albert Sans',sans-serif;padding:20px 16px 60px}
  .dc *{box-sizing:border-box}
  .wrap{max-width:760px;margin:0 auto}
  .display{font-family:'Big Shoulders Display',sans-serif;font-weight:800;letter-spacing:.5px}
  .mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:14px}
  .lbl{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--faint);font-weight:700;margin-bottom:8px}
  .chip{background:var(--surface2);border:1px solid var(--line);color:var(--dim);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
  .chip:hover{border-color:var(--ember);color:var(--flour)}
  .chip.on{background:var(--ember);border-color:var(--ember);color:#1a0d05}
  .chip.off{opacity:.35;cursor:not-allowed;text-decoration:line-through}
  .chip.off:hover{border-color:var(--line);color:var(--dim)}
  .star{color:var(--gold);margin-left:5px;cursor:help}
  .chip.on .star{color:#1a0d05}
  .opt{background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer;transition:all .15s;text-align:left;width:100%}
  .opt:hover{border-color:var(--ember)}
  .opt.on{border-color:var(--ember);box-shadow:0 0 0 1px var(--ember)}
  .opt.off{opacity:.35;cursor:not-allowed}
  .opt.off:hover{border-color:var(--line)}
  .optName{font-weight:700;font-size:14px}
  .optSub{font-size:12px;color:var(--dim);margin-top:2px}
  .tip{font-size:12px;color:var(--faint);margin-top:6px;line-height:1.45}
  .why{font-size:12px;color:var(--gold);margin-top:6px;line-height:1.4}
  input[type=range].dcr{-webkit-appearance:none;width:100%;height:4px;background:var(--line);border-radius:2px;outline:none}
  input[type=range].dcr::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--ember);cursor:pointer;border:3px solid var(--bg)}
  input[type=range].dcr::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--ember);cursor:pointer;border:3px solid var(--bg)}
  .val{color:var(--gold);font-weight:600}
  .btn{background:var(--ember);color:#1a0d05;border:none;border-radius:10px;padding:12px 22px;font-weight:700;font-size:14px;cursor:pointer;font-family:'Albert Sans',sans-serif}
  .btn:hover{filter:brightness(1.08)}
  .btn.ghost{background:transparent;border:1px solid var(--line);color:var(--dim)}
  .btn.ghost:hover{border-color:var(--ember);color:var(--flour)}
  .stepper{display:flex;align-items:center;gap:0;margin:18px 0 22px}
  .sdot{width:30px;height:30px;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--faint);cursor:pointer;flex-shrink:0;background:var(--surface)}
  .sdot.on{border-color:var(--ember);color:var(--ember)}
  .sdot.done{border-color:var(--basil);color:var(--basil)}
  .sline{flex:1;height:2px;background:var(--line);min-width:8px}
  .ticket{background:#F6EFE2;color:#241A12;border-radius:8px;padding:22px;font-family:'JetBrains Mono',monospace;box-shadow:0 8px 30px rgba(0,0,0,.45);position:relative}
  .ticket::before,.ticket::after{content:'';position:absolute;left:0;right:0;height:8px;background:radial-gradient(circle at 6px -2px, transparent 6px, #F6EFE2 6px);background-size:14px 8px}
  .ticket::before{top:-7px}
  .ticket::after{bottom:-7px;transform:scaleY(-1)}
  .trow{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #C9BBA4;font-size:14px}
  .trow.big{font-size:16px;font-weight:600}
  .tl{position:relative;padding-left:26px}
  .tl::before{content:'';position:absolute;left:7px;top:8px;bottom:8px;width:2px;background:var(--line)}
  .tli{position:relative;padding:10px 0}
  .tli::before{content:'';position:absolute;left:-24px;top:15px;width:12px;height:12px;border-radius:50%;background:var(--ember);border:3px solid var(--bg)}
  .tli.bake::before{background:var(--gold)}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--surface2);border:1px solid var(--gold);color:var(--flour);padding:12px 20px;border-radius:10px;font-size:13px;z-index:50;max-width:90%;box-shadow:0 6px 24px rgba(0,0,0,.5)}
  .tierTab{flex:1;text-align:center;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--surface2);cursor:pointer;transition:all .15s}
  .tierTab.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
  .pillrow{display:flex;flex-wrap:wrap;gap:8px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  @media(max-width:560px){.grid3{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}}
  .codebox{background:var(--surface2);border:1px dashed var(--gold);border-radius:10px;padding:14px;text-align:center}
  .codebig{font-size:28px;letter-spacing:6px;color:var(--gold);font-weight:600}
  input.txt{background:var(--surface2);border:1px solid var(--line);border-radius:8px;color:var(--flour);padding:10px 12px;font-size:14px;font-family:'JetBrains Mono',monospace;width:100%}
  input.txt:focus{outline:none;border-color:var(--ember)}
  @media(prefers-reduced-motion:reduce){.dc *{transition:none!important}}
  @media print{
    body{background:#fff!important}
    .no-print{display:none!important}
    .dc{background:#fff;color:#241A12;padding:0}
    .print-area .card{background:#fff;border-color:#ccc;color:#241A12;break-inside:avoid}
    .print-area .lbl{color:#666}.print-area .tip,.print-area .optSub{color:#555}
    .print-area .tl::before{background:#ccc}.print-area .tli::before{border-color:#fff}
    .ticket{box-shadow:none;border:1px solid #ccc}
  }`;

  /* ════════════════════════ ÉCRAN DE DÉPART ══════════════════════ */
  if (!started) {
    return (
      <div className="dc">
        <style>{css}</style>
        <div className="wrap" style={{ maxWidth: 640, paddingTop: 40 }}>
          <div className="display" style={{ fontSize: 44, lineHeight: 1 }}>
            DOUGH <span style={{ color: "var(--ember)" }}>CONTROL</span>
          </div>
          <div style={{ color: "var(--dim)", marginTop: 8, marginBottom: 28 }}>
            De « pizza samedi 20 h » à une recette au gramme près, planifiée à rebours.
          </div>

          <div className="card">
            <div className="lbl">Votre région</div>
            <div className="pillrow">
              {Object.entries(REGIONS).map(([id, r]) => (
                <button key={id} className={`chip ${region === id ? "on" : ""}`} onClick={() => setRegion(id)}>
                  {r.flag} {r.label}
                </button>
              ))}
            </div>
            <div className="tip">
              Détermine les produits recommandés (farines, levures, tomates) et les unités&nbsp;:
              {region === "us" ? " °F + onces en complément des grammes." : " °C et grammes."}
            </div>
          </div>

          <div className="card">
            <div className="lbl">Votre niveau</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(TIERS).map(([id, t]) => (
                <button key={id} className={`opt ${tier === id ? "on" : ""}`} onClick={() => setTier(id)}>
                  <div className="optName">
                    {t.icon} {t.name} <span style={{ color: "var(--faint)", fontWeight: 400 }}>— “{t.flavor}”</span>
                  </div>
                  <div className="optSub">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn" onClick={() => setStarted(true)}>Commencer →</button>
            <div style={{ flex: 1 }} />
            <input
              className="txt" style={{ width: 130, textTransform: "uppercase" }}
              placeholder="CODE…" maxLength={6} value={loadInput}
              onChange={(e) => setLoadInput(e.target.value)}
            />
            <button className="btn ghost" onClick={loadRecipe}>Charger</button>
          </div>
          {storageMsg && <div className="tip" style={{ marginTop: 10, color: "var(--gold)" }}>{storageMsg}</div>}
        </div>
      </div>
    );
  }

  /* ════════════════════════ ÉTAPES DU WIZARD ═════════════════════ */
  const STEP_NAMES = ["Planning", "Four", "Cuisine", "Ingrédients", "Recette"];

  const Slider = ({ label, value, set, min, max, step: st = 1, unit = "", display }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "var(--dim)" }}>{label}</span>
        <span className="mono val">{display ?? `${value}${unit}`}</span>
      </div>
      <input type="range" className="dcr" min={min} max={max} step={st} value={value}
        onChange={(e) => set(parseFloat(e.target.value))} />
    </div>
  );

  return (
    <div className="dc">
      <style>{css}</style>
      <div className="wrap">

        {/* ── Header ── */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="display" style={{ fontSize: 26 }}>
            DOUGH <span style={{ color: "var(--ember)" }}>CONTROL</span>
          </div>
          <div style={{ flex: 1 }} />
          <div className="pillrow">
            {Object.entries(TIERS).map(([id, t]) => (
              <button key={id} className={`chip ${tier === id ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 12 }}
                onClick={() => setTier(id)} title={t.desc}>
                {t.icon} {t.name}
              </button>
            ))}
            <button className="chip" style={{ padding: "5px 10px", fontSize: 12 }}
              onClick={() => setRegion(region === "eu" ? "us" : "eu")} title="Changer de région">
              {R.flag}
            </button>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="stepper no-print">
          {STEP_NAMES.map((n, i) => (
            <span key={n} style={{ display: "contents" }}>
              {i > 0 && <span className="sline" />}
              <button className={`sdot ${i === step ? "on" : i < step ? "done" : ""}`}
                onClick={() => setStep(i)} aria-label={n} title={n}>
                {i < step ? "✓" : i + 1}
              </button>
            </span>
          ))}
        </div>
        <div className="lbl no-print" style={{ fontSize: 13, color: "var(--ember)", marginBottom: 12 }}>
          Étape {step + 1} — {STEP_NAMES[step]}
        </div>

        {/* ════ ÉTAPE 1 — PLANNING ════ */}
        {step === 0 && (
          <>
            <div className="card">
              <div className="lbl">Je veux manger ma pizza le…</div>
              <input className="txt" type="datetime-local" value={toLocalInput(bakeAt)}
                onChange={(e) => e.target.value && setBakeAt(new Date(e.target.value))}
                style={{ maxWidth: 260 }} />
              <div className="tip">
                Soit dans <span className="mono val">{hoursUntil > 0 ? fmtDur(hoursUntil) : "—"}</span>.
                Tout le planning sera calculé à rebours depuis ce moment.
              </div>
            </div>

            <div className="card">
              <div className="lbl">Méthode</div>
              <div className="grid3">
                {Object.values(METHODS).map((m) => {
                  const fits = methodFits(m.id);
                  return (
                    <button key={m.id}
                      className={`opt ${method === m.id ? "on" : ""} ${!fits ? "off" : ""}`}
                      onClick={() => fits && pickMethod(m.id)}
                      title={!fits ? `Nécessite ≥ ${m.hours} h — il vous reste ${fmtDur(Math.max(0, hoursUntil))}` : m.why}>
                      <div className="optName display" style={{ fontSize: 20 }}>
                        {m.name}{m.preferred && <STAR why={m.whyPreferred} />}
                      </div>
                      <div className="optSub">{m.sub}</div>
                      {!fits && <div className="tip" style={{ color: "var(--warn)" }}>
                        Nécessite ≥ {m.hours} h — vous avez {fmtDur(Math.max(0, hoursUntil))}
                      </div>}
                    </button>
                  );
                })}
              </div>
              <div className="why">★ 24 H : {METHODS.h24.whyPreferred}</div>
              <div className="tip">Le benchmark pizzaiolo de la méthode est chargé automatiquement.</div>
            </div>
            <button className="btn no-print" onClick={() => setStep(1)}>Suivant : le four →</button>
          </>
        )}

        {/* ════ ÉTAPE 2 — FOUR ════ */}
        {step === 1 && (
          <>
            <div className="card">
              <div className="lbl">Votre four</div>
              <div className="grid2">
                {OVENS.map((o) => (
                  <button key={o.id} className={`opt ${oven === o.id ? "on" : ""}`}
                    onClick={() => { setOven(o.id); setTargetDia((d) => Math.min(d, o.maxDia)); }}>
                    <div className="optName">{o.name}</div>
                    <div className="optSub mono">Ø max {o.maxDia} cm · {o.bake}</div>
                  </button>
                ))}
              </div>
              <div className="tip">{locTemps(O.tip, region)}</div>
            </div>

            <div className="card">
              <div className="lbl">Vos pizzas</div>
              {isAmateur ? (
                <div className="tip">
                  Diamètre <span className="mono val">{effDia} cm</span> (sweet spot de votre four <STAR why="Ooni et Gozney recommandent de débuter à 30 cm." />)
                  · croûte <span className="val">Classique napolitaine</span> <STAR why={CRUSTS[1].whyPreferred} />
                </div>
              ) : (
                <>
                  <Slider label="Diamètre cible" value={effDia} set={setTargetDia} min={20} max={O.maxDia} unit=" cm" />
                  <div className="lbl" style={{ marginTop: 4 }}>Style de croûte</div>
                  <div className="pillrow">
                    {CRUSTS.map((c) => (
                      <button key={c.id} className={`chip ${effCrust === c.id ? "on" : ""}`} onClick={() => setCrust(c.id)}>
                        {c.name}{c.preferred && <STAR why={c.whyPreferred} />}
                      </button>
                    ))}
                  </div>
                  <div className="tip">{CRUSTS.find((c) => c.id === effCrust).tip}</div>
                </>
              )}
              <Slider label="Nombre de pizzas" value={pizzas} set={setPizzas} min={1} max={12} />
              <div className="tip">
                → Pâton calculé : <span className="mono val">{calc.ball} g</span> par pizza
                ({region === "us" ? `${ozOf(calc.ball)} oz · ` : ""}Ø {effDia} cm).
              </div>
            </div>
            <button className="btn no-print" onClick={() => setStep(2)}>Suivant : la cuisine →</button>
          </>
        )}

        {/* ════ ÉTAPE 3 — CUISINE ════ */}
        {step === 2 && (
          <>
            <div className="card">
              <div className="lbl">Saison</div>
              <div className="pillrow">
                {SEASONS.map((s) => (
                  <button key={s.id} className={`chip ${season === s.id ? "on" : ""}`}
                    onClick={() => { setSeason(s.id); setAmbient(s.amb); setHumidity(s.hum); }}>
                    {s.name}
                  </button>
                ))}
              </div>
              {isAmateur ? (
                <div className="tip">
                  Température ambiante estimée : <span className="mono val">{fmtTemp(effAmbient, region)}</span> — réglée pour vous.
                </div>
              ) : (
                <>
                  <div style={{ height: 12 }} />
                  <Slider label="Température ambiante" value={ambient} set={setAmbient} min={14} max={32}
                    display={fmtTemp(ambient, region)} />
                  <div className="lbl">Humidité</div>
                  <div className="pillrow">
                    {[["dry", "Sec"], ["normal", "Normal"], ["humid", "Humide"]].map(([id, n]) => (
                      <button key={id} className={`chip ${humidity === id ? "on" : ""}`} onClick={() => setHumidity(id)}>{n}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* R4 — presets de stockage farine */}
            <div className="card">
              <div className="lbl">Où vit votre farine ?</div>
              <div className="grid3">
                {STORAGE_PRESETS.map((s) => (
                  <button key={s.id} className={`opt ${storagePreset === s.id ? "on" : ""}`}
                    onClick={() => { setStoragePreset(s.id); setFlourTempManual(null); }}>
                    <div className="optName">{s.icon} {s.name}{s.preferred && <STAR why={s.whyPreferred} />}</div>
                    <div className="optSub mono">≈ {fmtTemp(s.t, region)}</div>
                  </button>
                ))}
              </div>
              {isExpert && (
                <>
                  <div style={{ height: 12 }} />
                  <Slider label="Température exacte de la farine (expert)" value={flourTempManual ?? storage.t}
                    set={setFlourTempManual} min={5} max={30} display={fmtTemp(flourTempManual ?? storage.t, region)} />
                </>
              )}
              <div className="tip">Sert au calcul de la température d'eau pour atteindre la FDT visée.</div>
            </div>

            <div className="card">
              <div className="lbl">Pétrissage</div>
              {isAmateur ? (
                <div className="tip">
                  <span className="val">À la main</span> <STAR why={MIXERS[0].whyPreferred} /> — {MIXERS[0].tip}
                </div>
              ) : (
                <>
                  <div className="pillrow">
                    {MIXERS.map((m) => (
                      <button key={m.id} className={`chip ${effMixer === m.id ? "on" : ""}`} onClick={() => setMixer(m.id)}>
                        {m.name}{m.preferred && <STAR why={m.whyPreferred} />}
                      </button>
                    ))}
                  </div>
                  <div className="tip">
                    {MIXERS.find((m) => m.id === effMixer).tip}
                    {effMixer === "spiral" && ` ${MIXERS[2].best}`}
                  </div>
                </>
              )}
              {isExpert && (
                <>
                  <div style={{ height: 12 }} />
                  <Slider label="Température du frigo" value={fridgeTemp} set={setFridgeTemp} min={2} max={8}
                    display={fmtTemp(fridgeTemp, region)} />
                </>
              )}
            </div>
            <button className="btn no-print" onClick={() => setStep(3)}>Suivant : les ingrédients →</button>
          </>
        )}

        {/* ════ ÉTAPE 4 — INGRÉDIENTS ════ */}
        {step === 3 && (
          <>
            <div className="card">
              <div className="lbl">Levure</div>
              {isAmateur ? (
                <div className="tip">
                  <span className="val">Sèche instantanée</span> <STAR why="Le choix le plus fiable pour débuter : se conserve longtemps, dosage stable." />
                  — {R.instant}. {YEASTS.instant.tip}
                </div>
              ) : (
                <>
                  <div className="pillrow">
                    {Object.entries(YEASTS).map(([id, y]) => (
                      <button key={id} className={`chip ${effYeast === id ? "on" : ""}`} onClick={() => setYeastType(id)}>
                        {y.name}{y.preferred && <STAR why={y.whyPreferred} />}
                      </button>
                    ))}
                  </div>
                  <div className="tip">{YEASTS[effYeast].tip}</div>
                  <div className="why">À acheter ({R.label}) : {R[YEASTS[effYeast].exKey]}</div>
                </>
              )}
            </div>

            <div className="card">
              <div className="lbl">Farine</div>
              {isAmateur ? (
                <div className="tip">
                  <span className="val">{FLOURS[effFlour].name}</span> <STAR why={FLOURS[effFlour].whyPreferred} />
                  — {R[FLOURS[effFlour].exKey]}
                </div>
              ) : (
                <>
                  <div className="grid2">
                    {Object.entries(FLOURS).map(([id, f]) => {
                      const star = (f.preferredFor === "direct" && method !== "h48") || (f.preferredFor === "biga" && method === "h48");
                      return (
                        <button key={id} className={`opt ${effFlour === id ? "on" : ""}`} onClick={() => setFlour(id)}>
                          <div className="optName">{f.name}{star && <STAR why={f.whyPreferred} />}</div>
                          <div className="optSub">{f.sub} · idéal {f.window}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="tip">{FLOURS[effFlour].tip}</div>
                  <div className="why">À acheter ({R.label}) : {R[FLOURS[effFlour].exKey]}</div>
                  {FLOURS[effFlour].warn && M.hours > 6 && (
                    <div className="tip" style={{ color: "var(--warn)" }}>
                      ⚠ Trop faible pour {M.name} — préférez une 00 pizzeria.
                    </div>
                  )}
                  {effHyd > FLOURS[effFlour].maxHyd && (
                    <div className="tip" style={{ color: "var(--warn)" }}>
                      ⚠ {effHyd} % d'hydratation dépasse le plafond confortable de cette farine ({FLOURS[effFlour].maxHyd} %).
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="card">
              <div className="lbl">Tomates <STAR why="La base de la napolitaine — pas de cuisson de sauce, juste écrasées avec du sel." /></div>
              <div className="tip">À acheter ({R.label}) : <span className="val">{R.tomato}</span> · Sel : {R.salt}</div>
            </div>

            {/* R6/R7 — tout ce qui suit est réservé à l'expert */}
            {isExpert ? (
              <>
                <div className="card">
                  <div className="lbl">Chimie de la pâte (expert)</div>
                  <Slider label="Hydratation" value={hyd} set={setHyd} min={55} max={75} unit=" %" />
                  <Slider label="Sel" value={saltP} set={setSaltP} min={1.8} max={3.2} step={0.01} unit=" %" />
                  <Slider label="FDT (température de pâte visée)" value={fdt} set={setFdt} min={20} max={27}
                    display={fmtTemp(fdt, region)} />
                </div>

                <div className="card">
                  <div className="lbl">Stratégie de fermentation (expert)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(STRATEGIES).map(([id, s]) => (
                      <button key={id} className={`opt ${effStrategy === id ? "on" : ""}`}
                        onClick={() => setStrategy(id)} disabled={method === "h48" && id === "ambient" ? false : false}>
                        <div className="optName">{s.name}{s.preferred && <STAR why={s.whyPreferred} />}</div>
                        <div className="optSub">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                  {effStrategy !== "ambient" && (
                    <>
                      <div style={{ height: 14 }} />
                      <Slider label="Heures à température ambiante" value={effRoom} set={setRoom} min={1}
                        max={M.hours - (method === "h48" ? 12 : 0)} step={0.5} unit=" h" />
                      <Slider label="Heures au froid" value={effCold} set={setCold} min={0}
                        max={M.hours - 1 - (method === "h48" ? 12 : 0)} step={0.5} unit=" h" />
                      <div className="tip">
                        Budget : <span className="mono val">{(effRoom + effCold).toFixed(1)} h</span> / {M.hours - (method === "h48" ? 12 : 0)} h
                        {method === "h48" && " (le reste va à la biga)"}
                      </div>
                    </>
                  )}
                </div>

                {method === "h48" && (
                  <div className="card">
                    <div className="lbl">Biga (expert)</div>
                    <Slider label="Part de farine en biga" value={bigaPct} set={setBigaPct} min={20} max={100} unit=" %" />
                    <Slider label="Température de la biga" value={bigaTemp} set={setBigaTemp} min={14} max={22}
                      display={fmtTemp(bigaTemp, region)} />
                  </div>
                )}
              </>
            ) : (
              <div className="card">
                <div className="lbl">Réglé pour vous</div>
                <div className="tip">
                  Hydratation <span className="mono val">{effHyd} %</span> · sel <span className="mono val">{effSalt} %</span> ·
                  FDT <span className="mono val">{fmtTemp(effFdt, region)}</span> ·
                  stratégie <span className="val">Bulk, puis frigo-frein</span> <STAR why={STRATEGIES.bulkhold.whyPreferred} />
                  <br />Ce sont les valeurs du benchmark pizzaiolo {M.name}. Passez en mode Pizzaiolo pour les modifier.
                </div>
              </div>
            )}
            <button className="btn no-print" onClick={() => setStep(4)}>Voir ma recette →</button>
          </>
        )}

        {/* ════ ÉTAPE 5 — RECETTE ════ */}
        {step === 4 && (
          <div className="print-area">
            {/* Ticket */}
            <div className="ticket" style={{ marginBottom: 20 }}>
              <div style={{ textAlign: "center", borderBottom: "2px solid #241A12", paddingBottom: 10, marginBottom: 12 }}>
                <div className="display" style={{ fontSize: 22, fontFamily: "'Big Shoulders Display',sans-serif" }}>DOUGH CONTROL</div>
                <div style={{ fontSize: 12 }}>{pizzas} × {calc.ball} g · Ø {effDia} cm · {M.name} · {O.name}</div>
                <div style={{ fontSize: 12 }}>Cuisson : {fmtClock(bakeAt)}</div>
              </div>
              <div className="trow big"><span>Farine ({FLOURS[effFlour].name})</span><span>{gramsOut(calc.flourG)}</span></div>
              <div className="trow big"><span>Eau ({fmtTemp(Math.round(calc.waterTemp), region)})</span><span>{gramsOut(calc.waterG)}</span></div>
              <div className="trow"><span>Sel ({effSalt} %)</span><span>{gramsOut(calc.saltG, 1)}</span></div>
              <div className="trow"><span>Levure {YEASTS[effYeast].name.toLowerCase()} ({(calc.idy * YCONV[effYeast]).toFixed(2)} %)</span><span>{gramsOut(calc.yeastG, 2)}</span></div>
              <div className="trow"><span>Hydratation</span><span>{effHyd} %</span></div>
              {calc.biga && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, margin: "10px 0 4px" }}>— BIGA (45 % hyd) —</div>
                  <div className="trow"><span>Farine biga</span><span>{gramsOut(calc.biga.flour)}</span></div>
                  <div className="trow"><span>Eau biga</span><span>{gramsOut(calc.biga.water)}</span></div>
                  <div className="trow"><span>Toute la levure dans la biga</span><span>{gramsOut(calc.yeastG, 2)}</span></div>
                  <div style={{ fontSize: 12, fontWeight: 600, margin: "10px 0 4px" }}>— RAFRAÎCHI —</div>
                  <div className="trow"><span>Farine</span><span>{gramsOut(calc.biga.restFlour)}</span></div>
                  <div className="trow"><span>Eau + sel</span><span>{gramsOut(calc.biga.restWater)}</span></div>
                </>
              )}
              {yeastIsLow && (
                <div style={{ fontSize: 11, marginTop: 10, color: "#7a5a2a" }}>
                  ⚖ Dose très faible : utilisez une balance 0,01 g, ou diluez 1 g dans 100 g d'eau et pesez l'eau de levure ×100.
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="lbl">Votre planning — à rebours depuis {fmtClock(bakeAt)}</div>
              <div className="tl">
                {schedule.map((s, i) => (
                  <div key={i} className={`tli ${s.bake ? "bake" : ""}`}>
                    <div className="mono" style={{ color: "var(--gold)", fontSize: 13 }}>
                      {fmtClock(s.time)}{s.dur ? ` · ${s.dur}` : ""}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, margin: "2px 0" }}>{s.title}</div>
                    <div className="tip" style={{ marginTop: 0 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carte four */}
            <div className="card">
              <div className="lbl">Cuisson — {O.name}</div>
              {O.hot ? (
                <div className="tip" style={{ fontSize: 13, color: "var(--dim)" }}>
                  Préchauffage <span className="mono val">{O.preheat} min</span> à pleine puissance, sole saturée.
                  Enfournez, <span className="val">{O.bake}</span>, quart de tour régulier. {locTemps(O.tip, region)}
                </div>
              ) : (
                <div className="tip" style={{ fontSize: 13, color: "var(--dim)" }}>
                  <b style={{ color: "var(--flour)" }}>Cuisson en deux temps :</b><br />
                  1 — Four au max ({fmtTemp(275, region)}) avec acier/pierre préchauffé {O.preheat} min.
                  Base saucée <i>sans fromage</i>, 4–5 min sur l'acier.<br />
                  2 — Sortez, ajoutez mozzarella et basilic, repassez 2–3 min sous le <b>grill à fond</b> pour le léopard.
                </div>
              )}
            </div>

            {/* Troubleshooter */}
            <div className="card no-print">
              <div className="lbl">Au secours !</div>
              <div className="pillrow" style={{ marginBottom: 12 }}>
                {TROUBLE_CATS.map((c) => (
                  <button key={c.id} className={`chip ${troubleCat === c.id ? "on" : ""}`}
                    style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setTroubleCat(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              {TROUBLES.filter((t) => troubleCat === "all" || t.cat === troubleCat).map((t, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--warn)" }}>{t.q}</div>
                  <div className="tip" style={{ marginTop: 2 }}>{t.a}</div>
                </div>
              ))}
            </div>

            {/* R9 — Actions */}
            <div className="card no-print">
              <div className="lbl">Garder cette recette</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <button className="btn" onClick={() => window.print()}>🖨 Télécharger en PDF</button>
                <button className="btn ghost" onClick={saveRecipe}>💾 Sauvegarder pour plus tard</button>
                {saveCode && mailtoHref && (
                  <a className="btn ghost" style={{ textDecoration: "none", display: "inline-block" }} href={mailtoHref}>
                    ✉️ M'envoyer le code par email
                  </a>
                )}
              </div>
              {saveCode && (
                <div className="codebox">
                  <div className="lbl" style={{ marginBottom: 4 }}>Votre code de recette</div>
                  <div className="codebig mono">{saveCode}</div>
                  <div className="tip">Saisissez-le sur l'écran d'accueil pour recharger la recette à l'identique.</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12, maxWidth: 320 }}>
                <input className="txt" placeholder="Charger un code…" maxLength={6}
                  style={{ textTransform: "uppercase" }} value={loadInput}
                  onChange={(e) => setLoadInput(e.target.value)} />
                <button className="btn ghost" onClick={loadRecipe}>Charger</button>
              </div>
              {storageMsg && <div className="tip" style={{ color: "var(--gold)", marginTop: 8 }}>{storageMsg}</div>}
              <div className="tip" style={{ marginTop: 10 }}>
                Le PDF s'imprime via la boîte de dialogue de votre navigateur (choisir « Enregistrer en PDF »).
                L'email ouvre votre messagerie avec le code pré-rempli — rien n'est envoyé automatiquement.
              </div>
            </div>
          </div>
        )}

        {/* Toast R3 */}
        {notice && <div className="toast no-print">{notice}</div>}
      </div>
    </div>
  );
}
