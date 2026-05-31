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

> ⚠️ **RÈGLE ABSOLUE** : Ce workflow contient des **GATES DE VALIDATION HUMAINE** obligatoires.  
> Un gate = **terminer ton tour**, afficher le bloc demandé, **attendre la réponse de l'humain**.  
> Il est **INTERDIT** de franchir un gate et de continuer dans le même tour de réponse.

---

## Phase 1️⃣ : Initialisation & Apprentissage

### Charger les skills métier

Avant toute action, consulte les skills pertinentes depuis `.github/skills` :
- **llm-good-practice** : Patterns LLM, pièges techniques (notamment Terminal & pagers)
- **github-cli** : Outils bas-niveau `gh` et flags essentiels (`GH_PAGER=cat`)
- **issue-workflow** : Optionnel (workflow de suivi local d'issue)

### Valider l'environnement

```bash
# Vérifier authentification GitHub
gh auth status

# Si non authentifié → demander à l'humain
export GH_TOKEN=ghp_xxxxxxxxxxxx

# ⚠️ IMPORTANT : Toujours utiliser GH_PAGER=cat avec gh CLI pour éviter les blocages interactifs
export GH_PAGER=cat
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
GH_PAGER=cat gh issue view {{ issueNumber }} --json title,body,labels,state
```

**Capturer** :
- Titre et description
- Labels (priorité, type, zone)
- Lien : `https://github.com/boly38/botEnSky/issues/{{ issueNumber }}`
- État (open/closed)

### Poser les questions DEV Senior

En tant que senior dev, **analyser SYSTÉMATIQUEMENT** chaque point :

| Point | Analyse obligatoire |
|---|---|
| **Sécurité** | Y a-t-il des implications en sécurité (authentification, secrets, validation) ? |
| **Métier** | Cette implémentation respecte-t-elle les règles métier (workflows, processus) ? |
| **Portail** | **OBLIGATOIRE** : Vérifier `src/www/` ET le portail live `https://botensky.verymad.net` — noter l'état actuel visible |
| **Scope** | Le périmètre est-il bien délimité ou faut-il découper ? |
| **Impact** | Quels autres modules/fichiers pourraient être impactés ? |
| **Tests** | Comment tester cette implémentation ? |

> 🔍 **Le check Portail n'est PAS optionnel** : toujours inspecter `src/www/` pour identifier les fichiers impactés (vues EJS, CSS, routes Express). Si le portail est impacté, le noter explicitement dans l'analyse.

**🚦 GATE 3A — Validation Analyse**

Avant de créer la branche, afficher ce bloc et **terminer le tour** :

```
🚦 GATE 3A - Validation Analyse #{{ issueNumber }}

📋 Résumé :
- Titre : [titre de l'issue]
- Problème : [1 phrase]
- Solution proposée : [1 phrase]

✅ Checks :
- [ ] Sécurité : [OK / risques identifiés]
- [ ] Portail src/www impacté : [OUI fichiers: X,Y / NON]
- [ ] Portail live vérifié : [URL ou état actuel]
- [ ] Scope délimité : [OUI / découpé en : X]
- [ ] Fichiers à modifier : [liste]

❓ Questions bloquantes : [AUCUNE / liste]

👉 Tape "ok" pour continuer, ou donne tes corrections.
```

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

### ⚠️ Mandatory: UI/CSS Issues Testing

**If labels include `ui` OR issue path includes `src/www/`:**

```bash
# 1. Load UI debugging skill
# Read: .github/skills/ui-css-debugging/SKILL.md

# 2. Start the web server locally
pnpm install
pnpm start   # Launches http://localhost:3000

# 3. Open browser & test on mobile
# - Press F12 for DevTools
# - Toggle device mode (Ctrl+Shift+M)
# - Test at 768px breakpoint (mobile) and full width (desktop)
# - Verify header, navigation, responsive behavior
# - Screenshot or note what works/what doesn't

# 4. Inspect element if needed
# Right-click problematic element → Inspect
# Check computed styles in DevTools Elements panel
```

**Do NOT assume UI works without browser testing!**

### Mettre à jour le fichier suivi (si créé)

```markdown
## Tâches
- [x] Analyse de l'existant
- [x] Code : fichiers A, B, C
- [x] Tests : Web UI tested at mobile breakpoint
- [ ] Documentation
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

**🚦 GATE 7 — Validation avant Push**

Afficher ce bloc et **terminer le tour** — ne pas pusher dans ce même tour :

```
🚦 GATE 7 - Validation Push #{{ issueNumber }}

🌿 Branche : dev/issue-{{ issueNumber }}-<titre>
📦 Commit(s) :
  [git log --oneline -3]

📝 Résumé des changements :
  - [fichier 1] : [ce qui a changé]
  - [fichier 2] : [ce qui a changé]

✅ Tests : [pnpm test → X passing / état]
🌐 Portail vérifié : [OUI/NON + observations]

👉 Tape "push" pour que je pousse, ou donne tes corrections.
```

---

## Phase 8️⃣ : Push & Pull Request

### Pousher le commit

Seulement après validation GATE 7 :

```bash
git push origin dev/issue-{{ issueNumber }}-<titre>
```

### Créer la Pull Request

**Déterminer la branche base** :

```bash
# Branche par défaut du repo (généralement main)
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
# Si une branche de travail a été précisée par l'humain → l'utiliser
```

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

**🚦 GATE 8 — Validation avant création PR**

Afficher ce bloc et **terminer le tour** — ne pas créer la PR dans ce même tour :

```
🚦 GATE 8 - Validation PR #{{ issueNumber }}

📋 PR à créer :
  - Titre : "Fix #{{ issueNumber }}: <titre court>"
  - Base : <branche-base>
  - Head : dev/issue-{{ issueNumber }}-<titre>

📝 Body PR :
<contenu complet du body>

👉 Tape "pr" pour créer la PR, ou donne tes corrections.
```

**Créer la PR** (seulement après validation GATE 8) :

```bash
gh pr create \
  --title "Fix #{{ issueNumber }}: Titre court" \
  --body-file /tmp/gh_pr_body.md \
  --base <branche-base> \
  --head dev/issue-{{ issueNumber }}-<titre>
```


---

## 🛡️ Sécurité & Compliance

- ❌ **Ne jamais** afficher ou logger `GH_TOKEN`
- ❌ **Ne jamais** merger une PR soi-même
- ❌ **Ne jamais** encoder de secrets dans le code
- ✅ **Valider les inputs** (notamment si API externe)
- ✅ **Respecter les permissions** (modifier que ce qui est prévu)

---

## 📋 Aide-mémoire : Gates de Validation Obligatoires

> **PRINCIPE** : Un gate = terminer le tour + attendre la réponse. **Jamais** de gate et d'action dans le même tour.

| Gate | Moment | Format attendu | Déclencheur humain |
|---|---|---|---|
| **GATE 3A** | Après analyse, avant branche | Bloc résumé + checks | "ok" ou corrections |
| **GATE 7** | Après commit/tests, avant push | Bloc commit + résumé changements | "push" |
| **GATE 8** | Après push, avant PR | Bloc titre + body PR complet | "pr" |

| Autre situation | Action |
|---|---|
| Questions/doutes pendant analyse | **Intégrer dans GATE 3A** |
| Doute sur implémentation en cours | **Demander validation** avant commit |
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
