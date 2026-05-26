---
name: pull-request-workflow
description: >
  Workflow standardisé pour créer, mettre à jour et valider les pull requests.
  Couvre la préparation du code, la création de la PR, et les vérifications essentielles.
---

# Compétence : Workflow des Pull Requests

## Quand utiliser cette compétence

- ✅ Toute demande de `push + création PR`
- ✅ Toute demande de modification du titre/body d'une PR existante
- ✅ Validation avant merge/squash

NB: si un workflow sur l'issue en cours a donné lieu à un fichier dans `.github/work/` (voir skill "issue-workflow"), s'en servir pour aider à créer la PR 

## Workflow standard (5 étapes)

### 1️⃣ Vérifier l'état du repo

```bash
# Afficher branche active
git branch --show-current

# Vérifier statut et diff
git status
git --no-pager diff
```

**⚠️ Checklist** :
- [ ] Branche active = `feature/*` (ou correcte)
- [ ] Remote = `origin`
- [ ] Scope des fichiers OK (pas de fichiers accidentels)

### 2️⃣ Pousser les modifications

```bash
# Push avec upstream (lier la branche distante)
git push -u origin <branch>
```

**Guardrails** :
- ✅ Toujours utiliser `-u` pour lier upstream
- ✅ Confirmer la branche avant le push
- ❌ Ne JAMAIS push sans validation explicite humaine

### 3️⃣ Créer la Pull Request

```bash
# Créer PR (base = main par défaut)
gh pr create --base main --head <branch> --title "..." --body-file pr-body.md
```

**Important** :
- ✅ Utiliser `--body-file` (évite les pb d'échappement)
- ❌ Pas de `--body` inline
- ✅ Vérifier base/head avant confirmation

### 4️⃣ Vérifier et corriger la PR

```bash
# Afficher détails PR
gh pr view --json url,title,body,baseRefName,headRefName,state

# Si body incorrect : corriger
gh pr edit --body-file pr-body.md
```

## Template de PR

### Titre

Format recommandé :
```
type(scope): short description (Fix #<id>)
```

**Exemples** :
- `feat(plugins): Add weather webhook integration (Fix #123)`
- `fix(web-ui): Correct dark mode toggle button (Fix #456)`
- `refactor(services): Simplify Bluesky auth flow (Fix #789)`

### Body

Structure standard Markdown :

```markdown
## What
- changement 1
- changement 2
- changement 3

## Why
- raison principale pour cette PR

## Testing
- [ ] Manual testing done
- [ ] Tests added/updated
- [ ] No regressions observed

Fix #<issue-number>
```

**Conseils** :
- Lister les points clés du changement
- Justifier brièvement pourquoi
- Inclure la clôture d'issue (`Fix #id`)

## Checklist avant validation

| Point | Vérifier | Corriger si besoin |
|-------|----------|-------------------|
| **Titre** | Court, descriptif, format type(scope) | `gh pr edit --title "..."` |
| **Base/Head** | Base=main, Head=feature/* | Créer une nouvelle PR |
| **Body** | Sections quoi/pourquoi, issue closure | `gh pr edit --body-file` |
| **Fichiers** | Pas de fichiers accidentels | Rectifier et repush |
| **Branche** | À jour avec main (si nécessaire) | `git merge origin/main` |

## Guardrails (strictes)

### À FAIRE ✅
- ✅ Confirmer base/head avant création
- ✅ Utiliser `--body-file` (robuste)
- ✅ Vérifier PR via `gh pr view`
- ✅ Corriger les erreurs avec `gh pr edit`
- ✅ Attendre confirmation humaine avant commit/push

### À NE PAS FAIRE ❌
- ❌ Exposer tokens/secrets dans la PR
- ❌ Push sans validation humaine
- ❌ Créer PR avec `--body` inline
- ❌ Commiter automatiquement
- ❌ Merger sans approbation

## Cas spéciaux

| Situation | Action |
|-----------|--------|
| **PR title incorrect** | `gh pr edit --title "new title"` |
| **PR body vide/mal formé** | `gh pr edit --body-file pr-body.md` |
| **Besoin de rebaser** | `git fetch origin && git rebase origin/main` |
| **Conflit à résoudre** | Résoudre localement, puis repush |

## Ressources

- **Issue workflow** : lire `.github/skills/issue-workflow/SKILL.md`
- **Commit messages** : lire `.github/skills/commit-message/SKILL.md` (si existe)
- **GitHub CLI docs** : `gh pr --help`

---

SKILL:pull-request-workflow

