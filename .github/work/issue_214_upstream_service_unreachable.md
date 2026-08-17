# ✅ [#214] Unexpected error 500 - Aug16 2026

## Introduction
Plusieurs erreurs 500 en production (17h-21h) dues à des services upstream indisponibles (Plantnet, BioClip et Bluesky API). Le bot génère des codes d'erreur ERR_* alors qu'il faudrait logguer en INFO que les providers sont temporairement unavailable sans générer de codes d'erreur.

## Tâches
- [x] Code : Créer gestionnaire générique d'erreur réseau dans Common.js
- [x] Code : Ajouter "unreachable" à la détection d'erreurs
- [x] Code : Supprimer try/catch inutile dans GrBirdApiService.birdIdentify()
- [x] Code : Refactoriser GrBirdApiService pour utiliser gestionnaire générique
- [x] Code : Refactoriser PlantnetApiService pour utiliser gestionnaire générique (non seulement 408/503)
- [x] Code : Ajouter gestion erreur réseau dans PluginsCommonService.searchNextCandidate() pour Bluesky API
- [x] Code : S'assurer que logging INFO pour services unavailable
- [x] Code : Valider que mustBeReported=false pour les erreurs 503

## Fichiers modifiés
- src/lib/Common.js : Ajout handleNetworkError() et logNetworkError()
- src/servicesExternal/GrBirdApiService.js : Utilise gestionnaire générique
- src/servicesExternal/PlantnetApiService.js : Utilise gestionnaire générique
- src/services/PluginsCommonService.js : Gestion erreur Bluesky API dans searchNextCandidate()

## Liste de contrôle
- [x] Tous les fichiers compilent sans erreur
- [x] Gestionnaire générique d'erreur réseau réutilisable
- [x] Détection "unreachable" incluse
- [x] Gestion erreurs pour Plantnet, BioClip, et Bluesky API
- [x] Logs INFO pour indisponibilité service
- [x] Aucun code ERR_* pour cas normaux d'indisponibilité

## Notes Dev (section vivante)

- 2026-08-17: Analyse du ticket : services upstream Plantnet/BioClip/Bluesky indisponibles, log ERR_* inutile
- 2026-08-17: Correction GrBirdApiService pour détecter erreurs réseau
- 2026-08-17: Commit d3af33 + PR #215 créée
- 2026-08-17: Relecture + refactorisation complète:
  - Gestionnaire générique d'erreur réseau dans Common.js
  - Détection "unreachable" ajoutée
  - Supression try/catch inutile dans birdIdentify
  - Gestion erreur Bluesky API dans searchNextCandidate
  - Commit a1d5ef7 forcé avec modifications complètes

## Résumé final

La correction implémente une gestion d'erreur cohérente et générique pour tous les appels aux services upstream:

**Gestionnaire générique** (Common.js):
- `handleNetworkError()`: Détecte erreurs réseau (connection refused, timeouts, "unreachable", 503, etc.)
- `logNetworkError()`: Log INFO pour indisponibilité service, ERROR pour autres erreurs

**Intégrations**:
1. **GrBirdApiService**: Utilise gestionnaire + try/catch dans api_classification()
2. **PlantnetApiService**: Utilise gestionnaire pour tous les appels (pas seulement 408/503)
3. **PluginsCommonService**: Gestion erreur Bluesky dans searchNextCandidate()

**Bénéfices**:
- Pas de ERR_* généré pour indisponibilité de service
- Logs cohérents (INFO pour upstream unavailable, ERROR pour autres)
- Réutilisable pour futures intégrations d'API externes
- Couvre Plantnet, BioClip, et Bluesky API

## Références
- https://github.com/boly38/botEnSky/issues/214
- https://github.com/boly38/botEnSky/pull/215
