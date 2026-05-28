# Tests manuels - URL Shortener

Tests manuels pour diagnostiquer et tester le service de raccourcissement d'URLs avec plusieurs providers.

## Fichiers de test

### 1. `service.js` - Test du service complet
Test du service `UrlShortener` avec support multi-provider et fallback.

```bash
node tests/manual/url_shortener/service.js
```

**Teste:**
- ✅ Le service `buildShortUrlWithText()` avec fallback multi-provider
- ✅ Détection du provider réussi (is.gd, v.gd, ou fallback)
- ✅ Logs d'information pour chaque étape

**Résultats attendus:**
- Raccourcissement réussi avec is.gd ou v.gd
- Si tous les providers échouent, fallback vers l'URL complète

---

### 2. `raw_isgd.js` - Test raw is.gd API
Test direct de l'API is.gd (Node.js HTTPS natif, zéro dépendances).

```bash
node tests/manual/url_shortener/raw_isgd.js
```

**Teste:**
- ✅ Appel brut à is.gd
- ✅ Réponse HTTP (status, headers, body)
- ✅ Détection d'erreurs (403 CloudFlare, erreur métier, etc.)

**Cas d'intérêt:**
- **200 + https://is.gd/xxx** : Provider fonctionne ✅
- **200 + Error, database insert failed** : Service dégradé (voir ticket #182)
- **403 Forbidden** : CloudFlare challenge (voir ticket #182)

---

### 3. `raw_vgd.js` - Test raw v.gd API
Test direct de l'API v.gd (fallback provider, fonctionnalité similaire à is.gd).

```bash
node tests/manual/url_shortener/raw_vgd.js
```

**Teste:**
- ✅ Appel brut à v.gd
- ✅ Réponse HTTP (status, headers, body)
- ✅ Détection d'erreurs

**Cas d'intérêt:**
- **200 + https://v.gd/xxx** : Provider fonctionne ✅
- **200 + Error** : Erreur métier v.gd
- **403 Forbidden** : v.gd peut aussi bloquer les requêtes

**Note:** v.gd est un service compatible avec is.gd, avec API similaire. Il peut servir de fallback.

---

## Workflow de diagnostic

### Scenario 1: "Le service ne raccourcit plus les URLs"
```bash
# 1. Tester le service complet
node tests/manual/url_shortener/service.js

# 2. Si fallback: tester is.gd directement
node tests/manual/url_shortener/raw_isgd.js

# 3. Si is.gd échoue, vérifier v.gd (fallback)
node tests/manual/url_shortener/raw_vgd.js
```

### Scenario 2: "Vérifier la résilience multi-provider"
```bash
# Tous les tests devraient passer ou fallback correctement
node tests/manual/url_shortener/service.js
node tests/manual/url_shortener/raw_isgd.js
node tests/manual/url_shortener/raw_vgd.js
```

### Scenario 3: "Déboguer un provider spécifique"
```bash
# Tester le provider isolé (ex: v.gd)
node tests/manual/url_shortener/raw_vgd.js

# Puis vérifier que le service utilise le fallback correctement
node tests/manual/url_shortener/service.js
```

---

## Notes

- ✅ Les tests raw utilisent Node.js HTTPS natif (zéro dépendances)
- ✅ Les tests incluent User-Agent `botEnSky/test` pour éviter les blocages
- ✅ Timeouts à 5 secondes pour éviter les blocages infinis
- ⚠️ Les logs du service incluent les codes HTTP et détails pour diagnostic

---

## Providers supportés

| Provider | Endpoint | Type | Notes |
|----------|----------|------|-------|
| **is.gd** | `https://is.gd/create.php` | Primaire | Gratuit, depuis 2006, compatible 301 redirect |
| **v.gd** | `https://v.gd/create.php` | Fallback | Gratuit, API compatible avec is.gd |

---

## Références

- Service: `src/lib/UrlShortener.js`
- Issue #182: is.gd 403 errors + improvements
- Providers: is.gd (primaire), v.gd (fallback)

