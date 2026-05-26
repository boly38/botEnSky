# Instructions Copilot (repository)

Ce fichier contient des instructions globales pour GitHub Copilot CLI et les agents LLM

Directives principales :

- Les pensées, raisonnements, les étapes de réflexion internes, et les réponses à l'humain doivent être effectuées en français.
- Fournir des réponses concises (max ~100 mots) sauf si une explication plus longue est demandée.
- ne lance pas les tests ou de commande git en écriture (ex. commit, push) sans validation explicite de l'humain.
- Lorsque des améliorations sont possibles dans les instructions contextuelles doivent être proposées à l'humain pour validation.

## Pièges techniques
- si le MCP IntelliJ ou MCP Playwrights de recherche web est désactivé, le signaler à l'humain
- ⚠️ Les outils IntelliJ (`file_search`, `find_files_by_glob`) **ne listent pas les dossiers cachés** par défaut.
  Toujours utiliser `list_dir` explicitement sur `.gitlab/`, `.github/` pour détecter ces fichiers.
- les éditions simples doivent privilégier les outils natifs de copilot plus efficaces que MCP.

## Bonnes pratiques - Terminal & Interaction
- Commandes terminal : **toujours éviter le mode interactif** (ex. `git --no-pager diff`, `ls | cat`). Les pagers et confirmations bloquent l'exécution.
- Questions à l'humain : utiliser le MCP `ask_questions` pour demander validation, choix ou confirmations explicites au lieu de poser en texte libre.

FLAG:copilot-instructions

## Init contexte de projet/repository
- À l'arrivée sur un projet/repository, avoir lu le fichier racine "AGENTS.md".
- faire un report à l'humain de la liste des `FLAG:` appris. Ex. : "AI INIT OK : copilot-instructions,backend"
- quand une skill est lue, faire un report à l'humain de la liste des `SKILL:` apprises. Ex. : "AI SKILL : commit-message"