---
name: llm-good-practice
description: >
  Bonnes pratiques LLM et directives de customization pour Copilot.
  Couvre les pièges techniques, les patterns de terminal, et l'accusé-réception de contexte.
---

# Skill : Bonnes pratiques LLM Copilot

## Directives de base

- pensées, raisonnements, étapes de réflexion internes, et réponses à l'humain doivent être effectuées en français.
- par défaut : réponses concises (max ~100 mots).
- Interdit sans validation humaine: execution de tests, commande git en écriture (commit, push).
- Des améliorations possibles dans les instructions ? proposer à l'humain pour validation.

## 🚀 Startup Checklist - On Every New Issue

**Before you start analyzing**, systematically explore the project structure:

```bash
# 1. Explore .github directory (skills/prompts/work)
ls -la .github/skills/
ls -la .github/prompts/
ls -la .github/work/

# 2. Read copilot-instructions.md for context
cat .github/copilot-instructions.md | head -50

# 3. If issue mentions src/www/ (UI/CSS), load the ui-css-debugging skill
# ... and run the UI Startup Checklist

# 4. Check for existing related issues
ls -la .github/work/ | grep -i "issue_" || echo "No tracking files"
```

**Why**: This prevents the "I don't know where to look" problem and ensures you're aware of all relevant context before diving into analysis.

## Pièges techniques ⚠️

- si le MCP IntelliJ ou MCP Playwrights de recherche web est désactivé, le signaler à l'humain
- **Les outils IntelliJ** (`file_search`, `find_files_by_glob`) **ne listent pas les dossiers cachés** par défaut.
  Toujours utiliser `list_dir` explicitement sur `.gitlab/`, `.github/` pour détecter ces fichiers.
- éditions simples : privilégier les outils natifs de copilot (plus efficaces que MCP).

## Bonnes pratiques - Terminal & Interaction

- Terminal command: **toujours éviter le mode interactif** (ex. `git --no-pager diff`, `ls | cat`). Les pagers et confirmations bloquent l'exécution.
- **GitHub CLI** : utiliser `GH_PAGER=cat` pour désactiver la pagination interactive :
   ```bash
   GH_PAGER=cat gh issue view 198 --json title,body,labels,state
   ```
   ⚠️ Sans `GH_PAGER=cat`, les commandes `gh view` bloquent l'agent via pagination interactive.
- **Git diff/log/show** : utiliser `GIT_PAGER=cat` AVANT la commande pour éviter tout pager :
   ```bash
   GIT_PAGER=cat git diff --staged src/file.js
   GIT_PAGER=cat git diff HEAD~1 src/file.js
   GIT_PAGER=cat git log --oneline -5
   GIT_PAGER=cat git show commit-hash
   ```
   ⚠️ **CRUCIAL** : `git diff --staged` est particulièrement problématique sans `GIT_PAGER=cat` car il lance less/more en interactif et bloque l'agent.
   **Alternative** : `git --no-pager diff --staged ...` (utiliser le flag directement sur git)
- Questions à l'humain : utiliser MCP `ask_questions`.
- Éviter les confirmations interactives, préférer les flags explicites.

## 📢 Pattern: Capture Warnings & Propose Actions

When running commands like `pnpm install`, `npm check`, etc:

1. **Capture the output**:
   ```bash
   OUTPUT=$(pnpm install 2>&1)
   echo "$OUTPUT"
   ```

2. **Extract warnings/updates**:
   - `pnpm install` may output: "Update available! X.X.X → Y.Y.Y"
   - `npm outdated` lists upgradeable packages
   - `pnpm audit` shows security vulnerabilities

3. **If warnings/updates exist, propose to human**:
   ```
   ⚠️ pnpm upgrade disponible: X.X.X → Y.Y.Y
   Approuves-tu que j'exécute "corepack use pnpm@Y.Y.Y" ?
   ```

4. **Only proceed if human confirms**. Don't auto-upgrade.

**Why**: Upgrades can introduce breaking changes. Always ask first.

## Accusé-réception de contexte à l'arrivée sur le projet

1. **Lire les documents clés** :
   - `.github/copilot-instructions.md` → Contexte projet & stack
   - `.github/skills/` → Skills/compétences disponibles
   - `README.md` → Installation & usage

2. **Reporter à l'humain** (format standard) :
   - `AI OK: copilot-instructions` (FLAGS reconnus)
   - `AI SKILL: issue-workflow,pull-request-workflow` (Skills chargées)

3. **Exemple complet**:
   ```
   AI OK:
   - FLAG: backend, copilot-instructions
   - SKILL: issue-workflow, pull-request-workflow
   ```

## Customization de prompts - recommandations

✅ **À FAIRE** :
- Fichier `.github/copilot-instructions.md` pour contexte projet global
- `.github/skills/` pour compétences métier/techniques réutilisables
- Frontmatter YAML (`---name:`, `description:`) pour métadonnées
- Références croisées claires (DRY principle)
- FLAGS et SKILL declarations dans les fichiers

❌ **À ÉVITER** :
- Dupliquer le contexte projet en plusieurs endroits
- Instructions LLM sans métadonnées explicites
- Mélanger divers sujets dans un seul fichier → préférer une skill par domaine
- Oublier l'accusé-réception de FLAGS/SKILLS au démarrage

## Structure recommandée pour un projet

```
.github/
├── copilot-instructions.md    # Entrée principale (contexte + ref skills)
├── skills/
│   ├── llm-good-practice/SKILL.md      # Patterns LLM (ce fichier)
│   ├── issue-workflow/SKILL.md         # Workflow issues
│   ├── pull-request-workflow/SKILL.md  # Workflow PR
│   └── [autre-skill]/SKILL.md
├── work/                      # Issues en cours
└── workflows/                 # CI/CD
README.md                      # Installation & usage
```

## Références

- Format YAML frontmatter des skills : `name`, `description`, tags
- Voir skill `issue-workflow` pour exemple complet
- Voir skill `pull-request-workflow` pour workflow Git

---

SKILL:llm-good-practice

