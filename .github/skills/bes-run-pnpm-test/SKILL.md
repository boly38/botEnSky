---
name: bes-run-pnpm-test
description: botEnSky lancer et analyser les tests Mocha du backend projet
---

## Couverture
✅ Backend: BlueskyService, plugins, APIs (GrBird, Plantnet), utils  
❌ UI/CSS: minimaliste : la QA de l'UI requiert test manuel humain

## Commandes
```bash
# Lancer les tests avec couverture
pnpm ci-test > tmp/tests_output.log 2>&1
# ou sans couverture c8
# pnpm test > tmp/tests_output.log 2>&1
# ou logs détaillés
# export LOG_LEVEL=debug && pnpm test > tmp/tests_output.log 2>&1
```
Résultat: → `tmp/tests_output.log`

## Exemples d'analyse rapide des résultats
```bash
grep -oE "[0-9]+ passing" tmp/tests_output.log   # Résumé
grep -E "❌|✗|failing|Error" tmp/tests_output.log # Erreurs
tail -40 tmp/tests_output.log | grep "File\|%"   # Couverture
cat tmp/tests_output.log |grep "ms)"             # tests huge durations
```

## Voir aussi
- `src/config/` - Injection dépendances (ApplicationConfig.js)
- `tests/*.test.js` - Fichiers tests Mocha
- `.github/copilot-instructions.md` - Conventions globales

