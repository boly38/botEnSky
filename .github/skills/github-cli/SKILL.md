---
name: github-issues
description: Interagir avec GitHub issues et PRs via gh CLI
---

## But

Permettre à l'agent de lire/créer/commenter des issues et PRs GitHub sur le dépôt courant, via le client `gh` (GitHub CLI).

## Prérequis

`GH_TOKEN` doit être présent dans l'environnement du terminal. L'humain l'injecte manuellement :

```bash
export GH_TOKEN=ghp_xxxxxxxxxxxx
```

> L'agent NE doit jamais afficher ou logger le token. Il vérifie silencieusement sa présence avec `gh auth status`.

---

## ⚠️ Règle critique : toujours utiliser `--body-file`

Ne **jamais** passer le body d'une issue ou d'une PR directement en argument `--body "..."` dans le shell.  
Les caractères spéciaux (accents, backticks, `<!-- -->`, `$`, `\`) sont altérés ou interprétés par bash.

**Toujours** :
1. Écrire le body dans un fichier temporaire (ex: `/tmp/gh_body.md`) via l'outil de création de fichier
2. Passer `--body-file /tmp/gh_body.md` à `gh`
3. Supprimer le fichier temporaire après usage si nécessaire

```bash
# ✅ Correct
gh issue create --title "Mon titre" --body-file /tmp/gh_body.md

# ❌ À éviter
gh issue create --title "Mon titre" --body "contenu avec accents et \`backticks\`"
```

> **Note affichage** : `gh issue view` dans le terminal peut mal afficher les accents (encodage terminal).  
> Le contenu réel sur GitHub.com est correct si le fichier source était en UTF-8.  
> Pour vérifier sans ambiguïté : `gh issue view <N> --json body | python3 -c "import json,sys; print(json.load(sys.stdin)['body'][:200])"`

---

## Runbook

### Vérification initiale

Avant toute opération GitHub, toujours vérifier :

```bash
gh auth status
```

Si non authentifié → demander à l'humain d'exécuter `export GH_TOKEN=<token>` dans le terminal.

---

### Lister les issues ouvertes

```bash
gh issue list --state open --limit 20
```

### Créer une issue

```bash
# 1. Créer le fichier body (via outil de création de fichier)
# 2. Lancer :
gh issue create \
  --title "Titre de l'issue" \
  --body-file /tmp/gh_body.md \
  --label "enhancement"
```

> Toujours demander confirmation à l'humain avant de créer (`require_approval: true`).

### Éditer une issue existante

```bash
gh issue edit <NUMERO> \
  --title "Nouveau titre" \
  --body-file /tmp/gh_body.md
```

### Commenter une issue

```bash
gh issue comment <NUMERO> --body "Commentaire court sans accents"
# Si accents ou markdown complexe :
gh issue comment <NUMERO> --body-file /tmp/gh_comment.md
```

### Fermer une issue

```bash
gh issue close <NUMERO> --comment "Raison de la fermeture"
```

---

### Lister les PRs ouvertes

```bash
gh pr list --state open
```

### Créer une PR

```bash
# 1. Créer le fichier body (via outil de création de fichier)
# 2. Lancer :
gh pr create \
  --title "Titre de la PR" \
  --body-file /tmp/gh_pr_body.md \
  --base main \
  --head <branche>
```

> Toujours proposer un titre et body à l'humain avant de soumettre.

### Consulter une PR

```bash
gh pr view <NUMERO>
```

---

## Workflow recommandé pour lier une issue à une PR

1. Identifier le numéro de l'issue (`gh issue list`)
2. Créer le body PR dans `/tmp/gh_pr_body.md` avec `Closes #<NUMERO>` dedans
3. Créer la PR avec `--body-file`
4. Confirmer avec l'humain avant de pousser

---

## Sécurité

- Ne jamais afficher `GH_TOKEN` dans les logs ou réponses.
- Ne jamais pousser de commit ou merger une PR sans approbation explicite de l'humain.
- Toujours vérifier la branche courante avant toute opération (`git branch --show-current`).


SKILL:github-cli