# 🍕 Dough Control

De **« je veux manger ma pizza samedi à 20 h »** à une recette napolitaine au gramme près, planifiée **à rebours**, avec les bons produits à acheter et les bons gestes — optimisé pour les fours Ooni & Gozney.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run validate   # vérifie que le moteur reproduit les benchmarks (obligatoire avant merge)
npm run build      # build de production dans dist/
```

## Déploiement

Push sur `main` ⇒ build + déploiement automatique sur **GitHub Pages** via `.github/workflows/deploy.yml`.
Activer une fois dans le repo : *Settings → Pages → Source : GitHub Actions*.

Le workflow exécute `npm run validate` avant le build : **un moteur qui ne reproduit plus les benchmarks bloque le déploiement.**

La base Vite est relative (`base: "./"`), donc le même build fonctionne sur GitHub Pages, Vercel ou Netlify sans configuration.

## Fonctionnalités activées par la prod

| Fonction | Artifact Claude | Production |
|---|---|---|
| 🖨 Export PDF | dialogue d'impression du sandbox | **dialogue d'impression natif du navigateur** (stylesheet `@media print` dédiée → « Enregistrer en PDF ») |
| 💾 Code de sauvegarde | `window.storage` (KV Anthropic) | **localStorage** via `src/storage-shim.js` (par navigateur — voir ci-dessous) |
| ✉️ Envoi par email | lien `mailto:` | lien `mailto:` (ouvre le client mail de l'utilisateur, rien n'est envoyé côté serveur) |

> **Partage de codes inter-appareils** : le shim localStorage est volontairement minimal. Pour qu'un code créé sur mobile soit lisible sur desktop, remplacer les 4 méthodes de `src/storage-shim.js` par un backend KV (Vercel KV, Supabase, Cloudflare KV…). **Le composant n'a pas à changer.**

## Architecture

```
├── index.html                      # point d'entrée
├── src/
│   ├── main.jsx                    # bootstrap React (importe le shim AVANT le composant)
│   ├── storage-shim.js             # recrée window.storage (API artifact) sur localStorage
│   └── dough-control.jsx           # ★ TOUTE l'app : moteur + données + UI (mono-fichier voulu)
├── scripts/validate-engine.mjs     # benchmarks moteur — gate CI
├── docs/PROJECT-BIBLE.md           # ★ source de vérité : vision, formules, historique, roadmap
├── CLAUDE.md                       # instructions pour Claude Code
└── .github/workflows/deploy.yml    # CI : validate → build → GitHub Pages
```

Le mono-fichier `dough-control.jsx` est **un choix délibéré** : le même fichier tourne tel quel comme artifact Claude et en prod. La frontière prod/artifact vit dans le shim, jamais dans le composant.

## Le moteur (résumé)

Toutes les doses sont calculées en **% de levure sèche instantanée (IDY)** de la farine puis converties (fraîche ×3, sèche active ×1.25). Trois stratégies de fermentation : directe/ambiante, maturation froide, **bulk-then-hold** (★ défaut — le profil du benchmark pizzaiolo primé, reproduit au gramme). Formules complètes : `docs/PROJECT-BIBLE.md` §5.

## Licence

Projet privé.
