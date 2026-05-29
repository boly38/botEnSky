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

## Pièges techniques ⚠️

- si le MCP IntelliJ ou MCP Playwrights de recherche web est désactivé, le signaler à l'humain
- **Les outils IntelliJ** (`file_search`, `find_files_by_glob`) **ne listent pas les dossiers cachés** par défaut.
  Toujours utiliser `list_dir` explicitement sur `.gitlab/`, `.github/` pour détecter ces fichiers.
- éditions simples : privilégier les outils natifs de copilot (plus efficaces que MCP).

## Bonnes pratiques - Terminal & Interaction

- Terminal command: **toujours éviter le mode interactif** (ex. `git --no-pager diff`, `ls | cat`). Les pagers et confirmations bloquent l'exécution.
- Questions à l'humain : utiliser MCP `ask_questions`.
- Éviter les confirmations interactives, préférer les flags explicites.

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

