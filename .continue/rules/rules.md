# Continue.dev - Project Rules

## Agent Context Files

Lire selon contexte:

- `agent.md` - Vue globale projet, principes SOLID/KISS, priorité MCP IDE
- `.github/agent.md` - **Workflow gestion tâches/issues (OBLIGATOIRE)**

## Workflow

1. Lire agent.md pertinent avant modification
2. Analyser code existant (patterns, conventions)
3. Appliquer principes SOLID/KISS
4. Utiliser fonctions natives IDE (MCP IntelliJ) prioritairement
5. **Suivre workflow `.github/agent.md` pour gestion tâches/issues**
6. Documenter changements importants dans `.github/issue_*.md`

## ⚠️ MCP IntelliJ Auto-save

MCP edits: fichier modifié dans IDE mais sauvegarde différée. Préférer `intellij_get_file_text_by_path` vs `cat`. Attendre 5-10s avant `git diff`.
