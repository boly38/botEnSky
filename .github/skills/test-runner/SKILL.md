---
name: test-runner
description: Lancer et analyser les tests Mocha du projet
---

## But

Permettre à l'agent de lancer les tests Mocha du projet botEnSky de manière fiable, capturer les résultats dans un fichier temporaire et les analyser sans limitation de sortie.


**Important**: Tests cover **backend code only** (bot plugins, services, APIs).  
**UI/CSS testing requires manual testing in browser** - ask the human to validate.

---

## Scope du Test Automation

✅ **Covered by `pnpm test` (Mocha)**:
- BlueskyService authentication, search, post operations
- API services (GrBird, Plantnet, etc.)
- Plugin business logic
- Utility functions & helpers
- Data transformations

❌ **NOT covered** (require human testing):
- UI/CSS rendering & responsive behavior
- Navigation flows & interactions
- Browser DevTools functionality
- Mobile viewport testing
- Visual styling validation

### When to use pnpm test

```bash
# ✅ Use automated tests for backend changes
pnpm test  # Run all Mocha tests

# ❌ Do NOT rely on pnpm test for UI issues
# Instead, ask human to test in browser
```

### When to ask human for manual testing

If the issue affects `src/www/` (Web UI):
```
⚠️ This is a UI issue - automated tests cannot validate visual rendering.
Please test the fix manually in your browser:
1. pnpm start (opens http://localhost:3000)
2. Test at mobile breakpoint (<768px) using DevTools (Ctrl+Shift+M)
3. Verify the fix works as expected
4. Let me know if it's resolved
```

---

## Prérequis

- `pnpm` installé et à jour
- Node.js version compatible (cf. `.nvmrc` ou `package.json`)
- Les dépendances du projet installées (`pnpm install`)

---

## Runbook

### Lancer les tests avec capture de sortie

```bash
export NODE_ENV=development
pnpm test > /tmp/tests_output.log 2>&1
```

Cela redirige :
- `stdout` (résultats, logs) → `/tmp/tests_output.log`
- `stderr` (erreurs) → le même fichier

### Analyser les résultats

Après l'exécution, analyser le fichier résultat complet :

```bash
/tmp/tests_output.log
```

**Extraire le résumé de passage/échec** :

```bash
# Compter les tests réussis (✔ ou ✓)
grep -E "✔|✓" /tmp/tests_output.log | wc -l

# Chercher les échecs (❌ ou ✗)
grep -E "❌|✗|failing|Error" /tmp/tests_output.log | head -10

# Voir la couverture finale (% Stmts, % Branch, % Funcs, % Lines)
tail -40 /tmp/tests_output.log | grep "File\|%"

# Alternative : chercher pattern "X passing"
grep -oE "[0-9]+ passing" /tmp/tests_output.log
```

**⚠️ Attention au pager** : Si vous utilisez `less` ou des outils interactifs, parsez plutôt le fichier avec `grep/sed/awk` pour éviter les blocages.

### Exemple : Tests avec logs détaillés

```bash
export NODE_ENV=development
export LOG_LEVEL=debug
pnpm test > /tmp/tests_output.log 2>&1
```

---

## Sécurité

- Ne jamais mettre de variables sensibles (clés API, tokens) directement en arguments CLI
- Les tests utilisent des données de simulation (fixtures) pour éviter d'appeler les APIs réelles
- Les fichiers temporaires dans `/tmp` ne doivent pas contenir de secrets

SKILL:test-runner

