---
name: issue-workflow
description: >
  Flux de travail pour traiter les tickets Github.
  À utiliser lors du démarrage, du suivi ou de la clôture d'une tâche de développement.
  Couvre le cycle de vie du fichier d'incident, le suivi des tâches et la finalisation.
---

# Compétence : Workflow des issues Github

## Structure `.github/work/`

Les Tickets Github du projet sont appelées "issues"
```
.github/
├── work/          # issues suivies et actives (travail et/ou PR en cours), vidé avant merge
├── skills/        # skills partagées équipe
└── copilot-instructions.md  # Contexte projet
```

## Nommage de fichier issue

```
.github/issue/issue_xxx_courte-description.md
```

✅ `issue_162_improve_ui_style.md`  
✅ `issue_164_audit_fix.md`  
❌ `issue_199.md` — description manquante  
❌ `minor_improvement.md` — issue_prefix manquant

## Modèle de fichier issue_*.md

```markdown
# 🎯 [XXXXX] Titre

## Introduction
Résumé court des objectifs (2-3 lignes max)

## Tâches
- [ ] Code : ...
- [ ] Tests : ...
- [ ] Documentation : ...
- [ ] Relecture prête

## Fichiers modifiés
- dev/java/...

## Liste de contrôle
- [ ] Tests OK (`mvn test`)
- [ ] Sonar, Swagger OK
- [ ] Impact autres repo : test e2e, pf-configuration 
- [ ] Manuel à jour

## Notes Dev (section vivante)

- YYYY-MM-DD: découverte X
- YYYY-MM-DD: adaptation Y

## Références
- https://github.com/boly38/botEnSky/issues/162
```

## Workflow à suivre pendant les développements

1. Connaître les issues en cours dans `.github/work/`
2. Travailler sur les tâches
3. **Cocher `- [x]` progressivement** dans le fichier de ticket après chaque tâche terminée
4. **Ajouter une note datée et brève** dans Dev Notes (date + fait, 1 ligne)
5. **Ne jamais créer de fichiers supplémentaires** sans approbation explicite d'un humain

## Finalisation

1. Toutes les tâches `- [x]` doivent être cochées sinon demander à l'humain
2. Mettre à jour "Fichiers modifiés" et "Checklist"
3. Ajouter le badge ✅ au titre : `# ✅ [issue-XXXXX] Titre`
4. Ajouter une section "Résumé final" (3-5 lignes)
5. Proposer un message de commit en utilisant la skill `commit-message`
6. **Ne pas auto-committer** — toujours attendre la confirmation d'un humain

En fin de travail, concernant le fichier issue dans `.github/work/`
- doit être utilisé pour permettre de constituer la PullRequest (voir skill, demander à l'humain)
- n'a pas vocation à rester une fois la tâche terminée : après avoir intégré son contenu demander à l'humain avant de supprimer

Attention, si le fichier de travail est en français, le contenu sur github doit être en anglais.

## Règles de périmètre

| Situation | Action |
|---|---|
| La tâche dépasse le périmètre du ticket | STOP — demander la confirmation d'un humain |
| Une documentation technique étendue est nécessaire | Créer `doc/*.md`, référencer dans l'issue |
| Un fichier annexe séparé est nécessaire | Demander une autorisation explicite au préalable |

## À FAIRE / À NE PAS FAIRE (strict)

**À FAIRE** :
- ✅ Cocher les tâches progressivement
- ✅ Notes datées d'une ligne dans les Notes Dev
- ✅ Courts extraits de code inline UNIQUEMENT si nécessaire
- ✅ Toujours inclure le lien Github

**À NE PAS FAIRE** :
- ❌ Ne pas créer `PHASE*.md`, `UPDATE*.md`, `REFACTOR*.md`
- ❌ Ne pas écrire des blocs de code complets dans le fichier d'issue (seuls des extraits)
- ❌ Éviter les longues explications — garder les notes concises
- ❌ Ne pas dupliquer le contenu de `.github/copilot-instructions.md` (contexte projet)

SKILL:issue-workflow