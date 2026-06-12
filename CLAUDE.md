# CLAUDE.md — instructions pour Claude Code

## Ce qu'est ce projet
**Dough Control** : calculateur de pâte à pizza napolitaine. Wizard 5 étapes, recette au gramme près planifiée **à rebours** depuis l'heure de cuisson, optimisé fours Ooni/Gozney. Voir `docs/PROJECT-BIBLE.md` — **c'est la source de vérité absolue** (vision, moteur de calcul, historique, décisions). La lire avant toute modification non triviale.

## Règles non négociables
1. **Le moteur de calcul (formules en haut de `src/dough-control.jsx`) est calibré contre des recettes réelles.** Toute modification des constantes (2.4, 3.8, 0.4, 0.33, YCONV, densités…) doit passer `npm run validate` ET être justifiée contre la bible §5/§11. Ne jamais ajuster les attendus du script de validation pour faire passer un test.
2. **Zéro diff de logique entre l'artifact Claude et la prod.** `src/dough-control.jsx` doit rester un composant autonome fonctionnant dans les deux environnements. Toute API spécifique prod passe par un shim (cf. `src/storage-shim.js`), jamais par une modification du composant.
3. **Pas de `<form>` HTML** dans le composant (héritage des contraintes artifact, on garde la convention) : `onClick`/`onChange` uniquement.
4. **Design system verrouillé** (bible §4) : tokens CSS (`--ember`, `--gold`, `--basil`…), Big Shoulders Display / Albert Sans / JetBrains Mono, ticket crème, stepper, chips, timeline. Ne pas introduire de framework CSS.
5. **Matrice de difficulté (bible §15)** : Amateur/Passionné n'ont JAMAIS accès à hydratation, sel, FDT, ni à la stratégie de fermentation. Bulk-then-hold est la stratégie par défaut partout.
6. **R1 unités** : région US ⇒ °F partout + onces en complément des grammes ; les grammes restent la référence. Les températures absolues dans des chaînes passent par `locTemps()` ; les **deltas** (friction +1 °C) ne se convertissent JAMAIS avec cette fonction.

## Workflow
- `npm run dev` — dev local
- `npm run validate` — benchmarks moteur (gate CI, bloque le déploiement)
- `npm run build` — build prod
- Push sur `main` ⇒ déploiement auto GitHub Pages (`.github/workflows/deploy.yml`)

## État du projet
- **Sprint 1** : terminé (wizard 5 étapes, moteur validé).
- **Sprint 2** : R1–R7 + R9 livrés. **R8 restant** : visuels/animations de technique sur la timeline (coil fold, pirlatura, étalage…). En prod, `<video>` et embeds fonctionnent — mais la version artifact doit garder un fallback SVG/CSS animé. Décisions actées : D1 = on garde les conversions physiquement exactes (fresh 3×, ADY 1.25× IDY) ; D3 = abandonné par le client.
- **Sprint 3 (à venir)** : refonte design. Un brief design sera préparé dans `docs/`.

## Sauvegarde de recettes (R9)
Le composant appelle `window.storage` (API du sandbox artifact). En prod, `src/storage-shim.js` la recrée sur localStorage. Limite : par navigateur. Pour du partage inter-appareils, remplacer les 4 méthodes du shim par un backend KV — sans toucher au composant.
