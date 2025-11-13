# Mode Read-Only en Production

## Vue d'ensemble

Lorsque l'application s'exécute avec `npm run start` (mode production avec build), le système passe automatiquement en **mode read-only**. Dans ce mode :

- ✅ Toutes les interfaces de lecture (affichage des lacs, statistiques, etc.) fonctionnent normalement
- ❌ **Aucune modification de données en base de données n'est autorisée**
- ❌ Les boutons de modification, ajout et suppression sont désactivés
- ❌ Un badge "Mode Read-Only (Production)" s'affiche sur les pages de gestion

## Fonctionnement technique

### Comment ça marche ?

1. **Détection du mode** : En Node.js, `npm run start` définit `process.env.NODE_ENV = "production"`
2. **Protection côté backend** : Les mutations Convex vérifient `NODE_ENV` et rejettent les modifications
3. **Protection côté frontend** : Les composants UI utilisent le hook `useReadOnlyMode()` pour masquer les boutons

### Fichiers clés

#### Backend (Convex)

- **`convex/readOnlyMode.ts`** : Helper pour vérifier le mode read-only
  ```typescript
  export function checkReadOnlyModeConvex(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mode read-only activé...');
    }
  }
  ```

- **`convex/lacs.ts`** : Toutes les mutations ajoutent la vérification :
  ```typescript
  export const updateLac = mutation({
    // ...
    handler: async (ctx, args) => {
      checkReadOnlyModeConvex(); // ← Bloque en production
      // ... code de modification
    },
  });
  ```

#### Frontend

- **`app/hooks/useReadOnlyMode.ts`** : Hook React pour déterminer le mode
  ```typescript
  const isReadOnly = useReadOnlyMode();
  ```

- **`app/api/readOnlyMode/route.ts`** : Endpoint pour vérifier le mode depuis le client
  ```
  GET /api/readOnlyMode
  → { isReadOnly: boolean }
  ```

#### Pages de gestion protégées

- `app/gestion/page.tsx` (Lacs)
- `app/gestion/campings/page.tsx` (Campings)
- `app/gestion/especes/page.tsx` (Espèces)

## Utilisation

### Mode développement (npm run dev)
```bash
npm run dev
# NODE_ENV = "development"
# Mode read-only = DÉSACTIVÉ
# ✅ Toutes les modifications sont autorisées
```

### Mode production (npm run start)
```bash
npm run build  # Génère le build optimisé
npm run start  # Lance le serveur en production
# NODE_ENV = "production"
# Mode read-only = ACTIVÉ ✅
# ❌ Aucune modification autorisée
```

## Pour ajouter la protection à de nouveaux composants

1. **Importer le hook** dans votre composant :
   ```typescript
   import { useReadOnlyMode } from '@/app/hooks/useReadOnlyMode';
   ```

2. **Utiliser le hook** :
   ```typescript
   const isReadOnly = useReadOnlyMode();
   ```

3. **Désactiver les boutons** :
   ```typescript
   <Button disabled={isReadOnly}>Ajouter</Button>
   <IconButton disabled={isReadOnly}><EditIcon /></IconButton>
   ```

4. **Afficher le badge** (optionnel) :
   ```typescript
   {isReadOnly && (
     <Chip
       icon={<LockIcon />}
       label="Mode Read-Only (Production)"
       color="error"
       variant="outlined"
     />
   )}
   ```

## Messages d'erreur

Si quelqu'un essaie de modifier une donnée en production :

```
Mode read-only activé. Les modifications de données ne sont pas autorisées en production.
```

Les mutations Convex rejetteront silencieusement les appels avec cette erreur.

## Sécurité

- ✅ Protection **double couche** : backend (Convex) + frontend (UI)
- ✅ Impossible de contourner via les outils de développement (mutations Convex sont bloquées)
- ✅ Pas de configuration manuelle nécessaire (détection automatique via `NODE_ENV`)
- ✅ Les données sont bien protégées en production

## Dépannage

### Le mode read-only ne s'active pas en production

Vérifiez que vous lancez l'application avec `npm run start` et non `npm run dev`.

### Les boutons restent activés

Assurez-vous que le hook `useReadOnlyMode()` est utilisé dans le composant.

### Une mutation modifie les données en production

Vérifiez que `checkReadOnlyModeConvex()` est appelée au début du handler.
