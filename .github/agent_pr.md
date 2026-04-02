# Workflow Pull Request

## Objectif
Standardiser creation et mise a jour des PR pour eviter erreurs de shell, body incomplet ou mauvaise base.

## Quand l'utiliser
- Toute demande de `push + PR`
- Toute demande d'edition du titre/body d'une PR existante

## Checklist rapide
1. Verifier branche active (`feature/*`) et remote `origin`.
2. Verifier l'etat git et le scope des fichiers (`git status`, `git diff`).
3. Push avec upstream (`git push -u origin <branch>`).
4. Creer PR avec `gh pr create --base main --head <branch>`.
5. Utiliser `--body-file` (pas `--body` inline) pour eviter les problemes d'echappement.
6. Verifier resultat via `gh pr view --json url,title,body,baseRefName,headRefName,state`.
7. Si body incorrect, corriger avec `gh pr edit --body-file <file>`.

## Templates conseilles
### Titre
`type(scope): short description (Fix #<id>)`

### Body
```markdown
## What
- changement 1
- changement 2

## Why
- raison principale

Fix #<id>
```

## Guardrails
- Ne jamais exposer de token dans les retours utilisateur.
- Toujours confirmer base/head avant creation PR.
- Ne jamais lancer commit/push sans validation explicite humaine.

