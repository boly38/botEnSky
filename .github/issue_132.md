# 🐛 Issue #132 - AskPlantnet wrong reply behavior

## 📋 Résumé
Les plugins "Ask" (AskPlantnet, AskBioclip) présentent un comportement de réponse incorrecte dans certains cas. Le bot semble répondre à un post sans lien avec la plante/oiseau analysé.

## 🔍 Symptômes observés

### Exemples issue #132 (3-4 juillet 2025)
- Initial test: https://bsky.app/profile/boly38.bsky.social/post/3lt3lrjwpvc2z
- Wrong reply (reply to a post that has no link with plant):
  - https://bsky.app/profile/botensky.bsky.social/post/3lt4xnvg2wi2z
  - https://bsky.app/profile/botensky.bsky.social/post/3lt5lp4x4fb2b

### Problème
❌ Le bot répond à un post qui n'a pas de lien avec la plante identifiée

**Hypothèses possibles:**
- Mauvais choix du post parent ?
- Mauvaise sélection du post de réponse ?
- Problème dans le threading Bluesky ?
- Autre ?

## 🔬 Logique métier attendue

### Scénario normal
1. **U1** poste **P1** avec **IMG1** (photo oiseau/plante)
2. **U2** répond à P1 avec **P2** : "AskBioclip" ou mentionne @botEnsky
3. Bot doit :
   - ✅ Analyser **P1** (parentPost) car c'est là qu'est **IMG1**
   - ✅ Répondre à **P2** (candidate) car c'est **U2** qui a sollicité le bot

### Code actuel
```javascript
// AskPlantnet.js
const candidate = await searchNextCandidate(...);  // P2 (mention)
const parentPost = await getParentPostOf(candidate.uri);  // P1 (photo)
const parentPhoto = firstImageOf(parentPost);  // IMG1

// ... identification ...

return await plantnetCommonService.replyToWithIdentificationResult(
    candidate,  // Répond à P2 (celui qui a demandé)
    {tags, doSimulate, context},
    {scoredResult, firstImageOriginalUrl, firstImageText}
);
```

**Code semble correct** selon la logique métier. Le bug doit être ailleurs.

## 📦 Fichiers à modifier

- `src/plugins/AskPlantnet.js` - Ligne ~90
- `src/plugins/AskBioclip.js` - Ligne ~97

## 🔍 Approche de diagnostic

Avant de corriger, on ajoute des logs détaillés pour comprendre le problème exact lors de la prochaine occurrence.

## ✨ Tâches

### Phase 1: Instrumentation (logs de diagnostic)
- [x] Ajouter logs dans AskPlantnet.js avant identification
- [x] Ajouter logs dans AskPlantnet.js avant reply
- [x] Ajouter logs dans AskBioclip.js avant identification
- [x] Ajouter logs dans AskBioclip.js avant reply
- [ ] Déployer et attendre reproduction du bug
- [ ] Analyser les logs pour identifier le problème exact

### Phase 2: Correction (après analyse des logs)
- [ ] Identifier la cause exacte du bug
- [ ] Implémenter la correction appropriée
- [ ] Tester avec simulation
- [ ] Vérifier thread de réponses
- [ ] Documenter changement comportement

## 🧪 Tests à effectuer après analyse

### Une fois le problème identifié via les logs
1. Créer scénario de reproduction
2. Tester avec `doSimulate=true`
3. Vérifier threading des réponses
4. Valider que la correction résout le problème observé

## 📊 Logs de diagnostic ajoutés

### Informations loguées

**Avant identification:**
```
[DIAGNOSTIC] Candidate (mention post): <URL du post de mention>
[DIAGNOSTIC] Parent post (image source): <URL du post avec l'image>
[DIAGNOSTIC] Image to analyze: <URL de l'image>
```

**Avant réponse (si identification OK):**
```
[DIAGNOSTIC] Identification successful: <résultat>
[DIAGNOSTIC] Will reply to: <URL du post> (mention post from user who asked)
[DIAGNOSTIC] Image was from: <URL du post> (parent post with image)
```

### Objectif
Ces logs permettront de vérifier lors de la prochaine occurrence:
1. ✅ Quelle image a été analysée
2. ✅ À quel post le bot répond
3. ✅ Si le parent post est bien celui attendu
4. ✅ Si la logique métier est respectée

## 📝 Notes de Dev

- 2025-01-26: Analyse initiale - code semble correct selon logique métier
- 2025-01-26: Ajout logs diagnostic pour analyser prochaine occurrence

## 🔗 Références
- Issue #132: https://github.com/boly38/botEnSky/issues/132
- Feature disabled: https://github.com/boly38/botEnSky/actions/workflows/a2_askplantnet.yml
