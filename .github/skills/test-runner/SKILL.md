---
name: test-runner
description: Lancer et analyser les tests Mocha du projet
---

## But

Permettre à l'agent de lancer les tests Mocha du projet botEnSky de manière fiable, capturer les résultats dans un fichier temporaire et les analyser sans limitation de sortie.

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

Travailler ou revenir au dernier fichier résultat complet :

```bash
/tmp/tests_output.log
```

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

