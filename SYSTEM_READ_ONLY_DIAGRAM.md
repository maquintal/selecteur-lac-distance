# 🔒 Système Mode Read-Only - Diagramme

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    L'application                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├─────────────────────────┐
                       │                         │
           ┌───────────▼──────────┐    ┌────────▼────────┐
           │   npm run dev        │    │  npm run start   │
           │   (Développement)    │    │  (Production)    │
           │                      │    │                  │
           │ NODE_ENV =           │    │ NODE_ENV =       │
           │ "development"        │    │ "production"     │
           │                      │    │                  │
           │ ✅ Modifications     │    │ 🔒 Read-Only     │
           │    AUTORISÉES        │    │    ACTIVÉ        │
           └──────────┬───────────┘    └────────┬─────────┘
                      │                         │
        ┌─────────────┴────────┬────────────────┴─────────────┐
        │                      │                              │
        │                      │                              │
    ┌───▼─────┐            ┌──▼────────┐              ┌──────▼─────┐
    │ Frontend │            │  Backend  │              │  Backend   │
    │          │            │  Convex   │              │  Convex    │
    │ ✅ Tous  │            │           │              │            │
    │  les     │            │ ✅ Muta- │              │ ❌ Muta-   │
    │ boutons  │            │    tions  │              │    tions   │
    │ actifs   │            │    OK     │              │    BLOQUÉES│
    │          │            │           │              │            │
    └──────────┘            └───────────┘              └────────────┘
        │                           │                        │
        │                           │                        │
    ┌───▼──────────┐            ┌──▼─────────┐        ┌─────▼────────┐
    │ Hook:        │            │ Fonction:  │        │ Fonction:    │
    │ useReadOnly  │            │ checkRead  │        │ checkReadOnly│
    │ Mode()       │            │ OnlyMode() │        │ Mode()       │
    │              │            │            │        │              │
    │ isReadOnly=  │            │ Vérification        │ Bloque la    │
    │   false      │            │ dans le   │        │ mutation ❌  │
    └──────────────┘            │ handler   │        └──────────────┘
                                 └────────────┘
                                      │
                                      ▼
                                   📊 Base de données
                                   ✅ Données protégées
```

## Flux d'une mutation en mode Production (Read-Only)

```
Client (Frontend)
    │
    ├─ Les boutons de modification sont DÉSACTIVÉS
    ├─ Message "Mode Read-Only" affiché
    │
    └─ (Si l'utilisateur contourne l'UI...)
          │
          ▼
    Appel à la mutation Convex
          │
          ▼
    Handler de la mutation
          │
          ├─ checkReadOnlyModeConvex() ◄── 🔒 CHECK DU MODE
          │     │
          │     └─► process.env.NODE_ENV === 'production' ?
          │           ├─ OUI → Jeter une erreur ❌
          │           └─ NON → Continuer ✅
          │
          ▼
    Modification rejetée ❌
          │
          ▼
    Erreur envoyée au client:
    "Mode read-only activé. Les modifications ne sont pas autorisées"
          │
          ▼
    Base de données : INCHANGÉE ✅
```

## États possibles

### 1️⃣ Mode Développement (npm run dev)

```
┌──────────────────────────────────────┐
│ État: DÉVELOPPEMENT                  │
│ NODE_ENV: "development"              │
│                                      │
│ Frontend:                            │
│   ✅ Tous les boutons visibles       │
│   ✅ Toutes les actions possibles    │
│                                      │
│ Backend (Convex):                    │
│   ✅ Mutations autorisées            │
│   ✅ Données modifiables             │
│                                      │
│ Résumé: 🎨 MODE COMPLET              │
└──────────────────────────────────────┘
```

### 2️⃣ Mode Production (npm run start)

```
┌──────────────────────────────────────┐
│ État: PRODUCTION (READ-ONLY)         │
│ NODE_ENV: "production"               │
│                                      │
│ Frontend:                            │
│   🔒 Boutons désactivés              │
│   🔒 Badge "Read-Only" visible       │
│   ✅ Lectures fonctionnent           │
│                                      │
│ Backend (Convex):                    │
│   ❌ Mutations rejetées              │
│   🔒 Données protégées               │
│                                      │
│ Résumé: 🔒 PROTECTION MAXIMALE       │
└──────────────────────────────────────┘
```

## Chemins de protection

```
                    UTILISATEUR TENTE UNE MODIFICATION
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Interface activée ? │
                    └────┬────────────┬───┘
                         │            │
                         NON          OUI (read-only)
                         │            │
                    ┌────▼───┐   ┌───▼────────────┐
                    │ Clique │   │ Bouton         │
                    │ OK ✅  │   │ DÉSACTIVÉ ❌  │
                    └────┬───┘   └────────────────┘
                         │
                         ▼
                    Appel mutation
                    Convex
                         │
                    ┌────▼──────────────┐
                    │ Check NODE_ENV    │
                    └────┬───────┬──────┘
                         │       │
                       dev       production
                         │       │
                         ✅      ❌
                         │       │
                    Modifie  Rejette
                    Données   l'appel
                         │       │
                         ▼       ▼
                    BD ✅    BD ❌ (inchangée)
```

## Checklist de sécurité

- ✅ NODE_ENV vérifiée en backend (Convex)
- ✅ NODE_ENV vérifiée en frontend (React hooks)
- ✅ Boutons UI désactivés en production
- ✅ Mutations Convex rejetées en production
- ✅ Messages d'erreur clairs
- ✅ Badge "Read-Only" visible
- ✅ Aucune configuration manuelle requise
- ✅ Double protection (UI + Backend)

---

**En résumé:** En production (`npm run start`), même si quelqu'un désactive les boutons via les DevTools du navigateur, les mutations Convex refuseront d'exécuter les modifications. Les données sont complètement protégées. 🔒
