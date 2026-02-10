# Export / Import — Convex

Ce document récapitule comment exporter les données d'une instance Convex vers un fichier ZIP, vérifier l'archive, puis importer ces données dans une autre instance Convex ou dans une base MongoDB.

## 1) Exporter depuis Convex
- Depuis le répertoire du projet, exécuter :

```powershell
npx convex export --path dev-backup.zip
```

- Pour inclure les fichiers stockés (dépôt de fichiers Convex) :

```powershell
npx convex export --path dev-backup.zip --include-file-storage
```

- Choisir la source (par défaut : `dev`) :
  - `--prod` pour la production
  - `--preview-name <name>` pour un déploiement preview
  - `--deployment-name <name>` ou `--env-file .env.target` pour une cible spécifique

> Toujours garder une copie avant d'importer (exporter d'abord). L'export crée un ZIP qui contient les données et, si demandé, un dossier `_storage` pour les fichiers.

## 2) Vérifier l'archive
- Lister ou extraire le ZIP :

```powershell
# lister
Expand-Archive -Path .\dev-backup.zip -DestinationPath .\dev-backup -Force
# ou avec unzip sur WSL / Git Bash
unzip dev-backup.zip -d dev-backup
```

- Vérifier la présence des fichiers de données et du dossier `_storage` si vous avez utilisé `--include-file-storage`.

## 3) Importer dans une autre instance Convex
> Attention : l'import peut remplacer ou fusionner des données selon l'implémentation. Faire une sauvegarde de la cible avant d'importer.

- Exemple (import vers la deployment cible indiquée) :

```powershell
npx convex import --path dev-backup.zip --deployment-name <targetDeploymentName>
```

- Autres options : utiliser `--prod` pour importer en production, ou `--env-file <file>` pour définir la target via variables d'environnement.
- Si le ZIP contient `_storage` et que vous aviez utilisé `--include-file-storage` lors de l'export, l'import tentera de restaurer ces fichiers dans la cible (vérifier quota et bucket cible).
- Après import, vérifier via le dashboard ou des requêtes que les collections et les enregistrements sont présents.

## 4) Importer les données dans MongoDB (optionnel)
Si vous souhaitez transférer les données vers une base MongoDB, procédez ainsi :

1. Extraire le ZIP :

```powershell
Expand-Archive -Path .\dev-backup.zip -DestinationPath .\dev-backup -Force
```

2. Inspecter le contenu extrait pour trouver les fichiers JSON (par ex. `data.json` ou fichiers par collection).

3. Utiliser `mongoimport` pour chaque collection trouvée (exemple) :

```powershell
mongoimport --uri "mongodb+srv://<user>:<pw>@cluster.example.mongodb.net/<db>" --collection <collectionName> --file .\dev-backup\<file>.json --jsonArray --drop
```

- `--drop` supprime la collection cible avant import (attention).
- Si les fichiers ne sont pas directement compatibles, un script de conversion peut être nécessaire. Ce dépôt contient un script `convert_to_mongo.py` : inspectez-le et adaptez-le si besoin.

## 5) Restauration des fichiers stockés
- Si vous avez exporté le stockage (`_storage`), il sera présent dans l'archive. Pour l'utiliser dans une autre infra, copiez le dossier `_storage` vers l'emplacement attendu par la cible (ou uploadez les fichiers dans le bucket de fichiers de la cible en respectant sa structure).

## 6) Vérifications finales
- Vérifier le nombre d'enregistrements et quelques échantillons :
  - Pour Convex : exécuter des queries ou vérifier le dashboard
  - Pour MongoDB : `mongo` shell ou `mongosh` et `db.<collection>.countDocuments()`

## 7) Exemples rapides
- Export avec stockage :

```powershell
npx convex export --path dev-backup.zip --include-file-storage
```

- Import vers une deployment nommée `staging` :

```powershell
npx convex import --path dev-backup.zip --deployment-name staging
```

- Import dans MongoDB (exemple) :

```powershell
Expand-Archive -Path .\dev-backup.zip -DestinationPath .\dev-backup -Force
mongoimport --uri "mongodb://localhost:27017/mydb" --collection lac_collection --file .\dev-backup\lacs.json --jsonArray --drop
```

---

Si vous voulez, je peux :
- adapter ce guide pour une importation spécifique (Convex vs MongoDB) ; ou
- exécuter l'import `npx convex import` ici si vous voulez que je le lance (en indiquant la target).