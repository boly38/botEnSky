# Workflow Issues

## Fichiers

```
.github/issue_*.md      # Feature/Tâche en cours (1 fichier par feature)
```

Convention de nommage recommandée (issues liées à un ticket):

`issue_<topic>_<id>.md` (avec `<topic>` en `snake_case` et `<id>` numérique, ex: `issue_faq_image_train_ai_172.md`)

## Principe STRICT

**1 issue = 1 fichier `.github/issue_*.md`**

- ✅ Tout DANS ce fichier: cocher tâches, ajouter notes
- ❌ PAS de fichiers annexes (.github/PHASE*.md, UPDATE*.md)
- ❌ PAS documenter ailleurs (sauf demande explicite)

**Doc DRY/SRP**: 1 info = 1 endroit. README/MIGRATION_V3/CHANGELOG ont chacun leur scope (voir `/agent.md`)

## Structure issue_*.md

```markdown
# 🚀 Feature : Titre

## 📋 Résumé
Objectif concis

## ✨ Tâches
- [ ] ...
- [ ] Tests: ...

## 📦 Fichiers
- src/...

## ✅ Tests
- Liste vérifications

## 📝 Notes de Dev (section vivante)
- 2025-01-09: Découverte X, adapté Y
- 2025-01-09: Problème Z résolu via solution W

## 🔗 Références
- Liens utiles
```

## Workflow LLM

### Pendant développement
1. Lire `agent.md` + `.github/issue_*.md` actif
2. Travailler sur tâches
3. **Cocher `- [x]` items complétés DANS le fichier issue**
4. **Ajouter notes importantes en section "Notes de Dev"** (succinct)
5. **NE PAS créer d'autres fichiers** sauf demande explicite

### Cas spéciaux
- **Déborder autre tâche** : STOP et demander confirmation humain
- **Documentation volumineuse** : Demander où documenter (ne pas décider seul)
- **Fichier annexe nécessaire** : Demander autorisation explicite

### Finalisation issue
1. Vérifier toutes coches `- [x]` OK
2. Mettre à jour sections Fichiers/Tests
3. Badge `✅` dans titre
4. Section "Résumé Final" (3-5 lignes max)
5. Indiquer moment commit (NE PAS commiter auto)

## Règles Strictes

**FAIRE dans issue_*.md** :
- ✅ Cocher tâches progressivement
- ✅ Notes dev succinctes (dates + fait)
- ✅ Mise à jour sections Fichiers/Tests
- ✅ Snippets code courts si nécessaire

**NE PAS FAIRE** :
- ❌ Créer PHASE*.md, UPDATE*.md, OPTIMIZATION*.md
- ❌ Documenter hors du fichier issue actif
- ❌ Code complet (snippets uniquement)
- ❌ Explications longues (→ rester concis)
- ❌ Dupliquer info agent.md

## Exceptions

**Création fichier annexe autorisée SI** :
- Humain le demande explicitement
- LLM demande autorisation ET humain accepte
- Documentation technique volumineuse (>200 lignes) nécessaire

→ Dans ce cas, référencer le fichier dans issue_*.md

## Exemples

### ✅ BON : Travail dans issue
```markdown
# 🚀 Feature : RSS Blog

## Tâches
- [x] Phase 1: Tests API
- [ ] Phase 2: Implémentation RSS
- [ ] Phase 3: Tests RSS

## Notes de Dev
- 2025-01-09: Tests API créés, images[] OK
- 2025-01-09: Découverte: slug généré depuis title
```

### ❌ MAUVAIS : Fichiers multiples
```
.github/issue_blog_rss.md
.github/PHASE1_TESTS.md          ← NE PAS CRÉER
.github/UPDATE_WINDOWS.md        ← NE PAS CRÉER
.github/OPTIMIZATION_*.md        ← NE PAS CRÉER
```

## Références

`/agent.md`

## Amélioration continue
En fin de session de développement d'une tâche :
- identifier une améliorations possible dans ce workflow, ou l'usage des tools/MCP 
- si trouvée, alors propose-les à l'humain pour suggestion.