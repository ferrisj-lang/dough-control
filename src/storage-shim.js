/* ════════════════════════════════════════════════════════════════
   STORAGE SHIM — production
   ────────────────────────────────────────────────────────────────
   Le composant a été développé dans le sandbox d'artifacts Claude,
   où une API `window.storage` (get/set/delete/list) est fournie.
   En production cette API n'existe pas : ce shim la recrée par-dessus
   localStorage, SANS modifier le composant (contrat : zéro diff sur
   src/dough-control.jsx entre artifact et prod).

   Signatures reproduites à l'identique :
     await window.storage.get(key, shared?)    → { key, value, shared } | throw si absent
     await window.storage.set(key, value, shared?) → { key, value, shared }
     await window.storage.delete(key, shared?) → { key, deleted, shared }
     await window.storage.list(prefix?, shared?) → { keys, prefix?, shared }

   ⚠ Limite assumée : localStorage est PAR NAVIGATEUR. Un code de
   recette sauvegardé sur le téléphone n'est pas lisible depuis le PC.
   Pour un partage réel inter-appareils, brancher ici un vrai backend
   (KV Vercel, Supabase, Cloudflare KV…) en remplaçant les 4 méthodes —
   le composant n'aura toujours pas à changer.
   ════════════════════════════════════════════════════════════════ */

const NS = "dough-control:"; // namespace pour ne pas polluer localStorage

function k(key, shared) {
  return `${NS}${shared ? "shared" : "personal"}:${key}`;
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key, shared = false) {
      const v = localStorage.getItem(k(key, shared));
      if (v === null) throw new Error(`Key not found: ${key}`);
      return { key, value: v, shared };
    },
    async set(key, value, shared = false) {
      try {
        localStorage.setItem(k(key, shared), value);
        return { key, value, shared };
      } catch {
        return null; // quota plein → le composant gère déjà le cas null
      }
    },
    async delete(key, shared = false) {
      localStorage.removeItem(k(key, shared));
      return { key, deleted: true, shared };
    },
    async list(prefix = "", shared = false) {
      const base = k(prefix, shared);
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const full = localStorage.key(i);
        if (full && full.startsWith(base)) {
          keys.push(full.slice(k("", shared).length));
        }
      }
      return { keys, prefix, shared };
    },
  };
}
