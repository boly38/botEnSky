---
name: dev-github-issue
description: >
  Workflow complet de développement sur une issue GitHub.
  Accepte en argument un numéro d'issue et guide l'agent DEV à travers les 8 étapes :
  initialisation, diagnostic, analyse, création branche, implémentation, validation, push et création PR.
---

# Traiter une Issue GitHub - Workflow DEV Senior

## 🎯 Objectif

Tu vas traiter l'issue GitHub numéro **{{ issueNumber }}** en tant que **DEV senior sensibilisé à la sécurité**. 

Ce workflow comprend 8 phases structurées : initialisation des skills → diagnostic → analyse → branche → implémentation → validation → push → PR.

---

## Phase 1️⃣ : Initialisation & Apprentissage

### Charger les skills métier

Avant toute action, consulte les skills pertinentes depuis `.github/skills`

### Valider l'environnement

```bash
# Vérifier authentification GitHub
gh auth status

# Si non authentifié → demander à l'humain
export GH_TOKEN=ghp_xxxxxxxxxxxx
```

---

## Phase 2️⃣ : Diagnostic Initial

### Vérifier la branche courante

```bash
git status
git branch --show-current
```

**Actions** :
- ✅ Si déjà sur branche dédiée `dev/issue-{{ issueNumber }}-...` → continuer
- ⚠️ Si sur `main` ou `develop` → créer branche à Phase 4
- ❓ Si autre branche → **demander confirmation à l'humain**

### Lister les issues actives locales

```bash
ls -la .github/work/ | grep -E 'issue_[0-9]+'
```

---

## Phase 3️⃣ : Analyse de l'Issue

### Récupérer l'issue GitHub

```bash
gh issue view {{ issueNumber }} --json title,body,labels,state
```

**Capturer** :
- Titre et description
- Labels (priorité, type, zone)
- Lien : `https://github.com/boly38/botEnSky/issues/{{ issueNumber }}`
- État (open/closed)

### Poser les questions DEV Senior

En tant que senior dev, **INTERROGER l'humain** si :

| Point | Questions |
|---|---|
| **Sécurité** | Y a-t-il des implications en sécurité (authentification, secrets, validation) ? |
| **Métier** | Cette implémentation respecte-t-elle les règles métier (workflows, processus) ? |
| **Portail** | Cette issue impacte-t-elle le portail du bot (src/www) ? Modifications UI/UX nécessaires ? |
| **Scope** | Le périmètre est-il bien délimité ou faut-il découper ? |
| **Impact** | Quels autres modules/fichiers pourraient être impactés ? |
| **Tests** | Comment tester cette implémentation ? |

**🛑 Si doutes → ARRÊTER et INTERROGER l'humain** (demander clarifications GitHub ou par message)

### Décider du fichier de suivi (optionnel)

**Feature complexe/moyenne** ?  
→ Créer `.github/work/issue_{{ issueNumber }}_<titre-court>.md` (modèle issue-workflow)

**Feature petite/triviale** ?  
→ Bypass le fichier, implémentation directe → commit → PR

---

## Phase 4️⃣ : Créer la Branche

**Sauf si déjà sur branche dédiée** :

```bash
# Format : dev/issue-<NUMERO>-<kebab-case>
git checkout -b dev/issue-{{ issueNumber }}-<titre-court>

# Exemple :
git checkout -b dev/issue-{{ issueNumber }}-improve-ui-style

# Pusher la branche
git push -u origin dev/issue-{{ issueNumber }}-<titre-court>
```

---

## Phase 5️⃣ : Implémentation

### Mettre en place l'environnement

```bash
pnpm install
grep -r "{{ issueNumber }}" tests/ || echo "Pas de tests spécifiques existants"
```

### Implémenter la solution

**Principes** :
- SOLID, KISS, DRY
- JSDoc anglais, logs français
- Utiliser services existants (`post.js`, `PluginsCommonService`, etc.)
- Tester manuels : `pnpm test`, `DO_SIMULATE=true pnpm start`, etc.

### Mettre à jour le fichier suivi (si créé)

```markdown
## Tâches
- [x] Analyse de l'existant
- [x] Code : fichiers A, B, C
- [ ] Tests : ...
```

Ajouter ligne datée dans "Notes Dev"

---

## Phase 6️⃣ : Validation avec l'Humain

### Avant de commiter

**Cas 1 : Questions pendant l'implémentation**  
→ **Demander validation** : "Approuves-tu cette approche ?"  
→ **Ne pas commiter** tant que doute existe

**Cas 2 : Implémentation claire, aucun doute**  
→ **Peux commiter** avec message clair  
→ **Sauf si nouvelle question** : toujours demander d'abord si incertain

### Format du commit

```bash
git commit -m "Fix #{{ issueNumber }}: Description courte"
```

---

## Phase 7️⃣ : Finalisation & Suppression de git du fichier suivi

### Si fichier `.github/work/issue_*.md` créé

**Finaliser le fichier** :

```markdown
# ✅ [#{{ issueNumber }}] Titre

## Tâches
- [x] Analyse
- [x] Code
- [x] Tests
- [x] Documentation

## Résumé final
(3-5 lignes du travail)

## Références
- https://github.com/boly38/botEnSky/issues/{{ issueNumber }}
```

**Puis supprimer de git le fichier** (APRÈS validation humaine) :

```bash
# Copier le contenu si besoin pour la PR
mv .github/work/issue_{{ issueNumber }}_*.md .github/archives/

# ✅ **Demander validation avant suppression**
# "Approuves-tu la suppression du fichier de suivi ?"

git rm .github/work/issue_{{ issueNumber }}_*.md
# amend du git commit principal si deja fait
```

### Tests finals

```bash
git status
git log --oneline -5
pnpm test
```

**Demander validation** :  
> "ℹ️ Prêt à pousser sur `dev/issue-{{ issueNumber }}-...`. Approuves-tu ?"

---

## Phase 8️⃣ : Push & Pull Request

### Pousser le commit

```bash
git push origin dev/issue-{{ issueNumber }}-<titre>
```

**🛑 Demander TOUJOURS validation avant de pusher**

### Créer la Pull Request

**Préparer le body** (`/tmp/gh_pr_body.md`) :

```markdown
## Description
[Résumé du changement]

## Type de changement
- [x] Bug fix
- [ ] New feature
- [ ] Breaking change

## Closes
Closes #{{ issueNumber }}

## Tests réalisés
- [x] Tests unitaires OK
- [x] Tests manuels OK

## Checklist
- [x] Code review OK
- [x] Documentation à jour
```

**Créer la PR** :

```bash
gh pr create \
  --title "Fix #{{ issueNumber }}: Titre court" \
  --body-file /tmp/gh_pr_body.md \
  --base develop \
  --head dev/issue-{{ issueNumber }}-<titre>
```

**🛑 Demander TOUJOURS validation avant de créer la PR**

---

## 🛡️ Sécurité & Compliance

- ❌ **Ne jamais** afficher ou logger `GH_TOKEN`
- ❌ **Ne jamais** merger une PR soi-même
- ❌ **Ne jamais** encoder de secrets dans le code
- ✅ **Valider les inputs** (notamment si API externe)
- ✅ **Respecter les permissions** (modifier que ce qui est prévu)

---

## 📋 Aide-mémoire : Décisions Critiques

| Situation | Action requise |
|---|---|
| Questions/doutes pendant analyse | **INTERROGER l'humain** |
| Doute sur implémentation en cours | **Demander validation** avant commit |
| Implémentation claire, aucun doute | **Peux commiter** (log clair) |
| Avant tout push | **Demander TOUJOURS validation** |
| Avant créer PR | **Demander TOUJOURS validation** |
| Suppression fichier suivi | **Demander TOUJOURS validation** |

---

## 💡 Utilisation

**Invocation simple** :
```
Traite l'issue GitHub #{{ issueNumber }} avec ce workflow de dev senior.
Je suis là pour valider tes questions.
```

**Avec contexte** :
```
Développe l'issue #{{ issueNumber }} en tant que DEV senior.
Demande-moi validation avant commit, push et PR.
Feature petite ? Bypass le fichier de suivi.
```

PROMPT:dev-github-issue
