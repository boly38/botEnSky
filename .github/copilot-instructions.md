# botEnSky - Contexte Projet

## Project Structure

```
botEnSky/          # PROJECT ROOT (Git)
├── .github/        # Copilot instructions, skills
│   ├── skills/     # Compétences réutilisables
│   └── copilot-instructions.md  # Ce fichier
├── bin/            # Scripts (start.sh, startDev.sh, www.js)
├── src/
│   ├── config/     # Injection dépendances
│   ├── domain/     # Helpers (post.js)
│   ├── plugins/    # Plugins bot (BioClip, Plantnet, Summary...)
│   ├── services/   # Services (Bluesky, Audit, Logger...)
│   ├── servicesExternal/  # APIs externes (GrBird, Plantnet...)
│   ├── www/        # Web UI Express (public/, views/)
│   └── locales/    # i18n FR/EN
├── tests/          # Mocha tests
└── doc/            # Documentation (OPS)
```

## Stack

**Node.js Bluesky Bot** | Express.js web UI  
**Runtime**: Node.js | **Frameworks**: @atproto/api, node-cron, winston | **Tests**: Mocha

## Principes

- SOLID, KISS, DRY
- MCP IntelliJ prioritaire
- **pnpm only** (JAMAIS npm ou yarn)

## Commandes essentielles

```bash
pnpm install             # Setup
pnpm start               # Lance bot + web UI
pnpm test                # Tests Mocha
node src/index.js        # Bot seul

# Dev
LOG_LEVEL=debug pnpm start           # Mode debug
DO_SIMULATE=true pnpm start          # Simulation (pas de posts réels)
```

## Plugins Bot

**Cycle**: Cron triggers → Plugin.process() → Bluesky API  
**Planification**: 08h30, 11h30, 14h30, 16h30, 17h30, 20h30 (FR timezone)

- **Plantnet**: Identifie plantes (Pl@ntNet API) + répond
- **AskPlantnet**: Répond mentions + Pl@ntNet
- **BioClip**: Identifie oiseaux (BioClip API) + répond
- **AskBioClip**: Répond mentions + BioClip
- **OneDayOneBioclip**: Post quotidien (Unsplash + BioClip)
- **Summary**: Analytics 7 jours (posts, likes, reposts)
- **UnMute**: Gestion auteurs mutés

## Config (env vars)

```bash
BLUESKY_USERNAME=bot.bsky.social
BLUESKY_PASSWORD=***
PLANTNET_API_KEY=***
GR_BIRD_API_KEY=***          # BioClip
UNSPLASH_ACCESS_KEY=***
DISCORD_WEBHOOK_URL=***      # Notifications
PORT=3000                    # Web UI
```

## Web UI

**Stack**: Express.js + EJS + CSS moderne (no framework)  
**Pages**: Home (logs), Principes (fonctions), FAQ  
**Design**: Glassmorphism, dark mode, mobile-first, animations

**Fichiers clés**:
- `src/www/views/pages/index.ejs`: Layout principal
- `src/www/views/partials/`: Composants
- `src/www/public/css/`: Design system CSS
- `src/www/public/js/`: JavaScript vanilla

## Conventions

- **Code**: Anglais (logs, messages) | JSDoc **anglais**
- **Commits**: Anglais + issue closure (`Fix #<id>`)
- **Modules**: ESM (`import/export`, pas CommonJS)

## Services clés

- **BlueskyService**: Login, search posts, reply, newPost
- **PluginsCommonService**: Helpers plugins (imageHtmlOf, replyResult...)
- **SummaryService**: Analytics 7j (cache 24h)
- **GrBirdApiService**: API BioClip (identification oiseaux)
- **PlantnetApiService**: API Pl@ntNet (identification plantes)

## Helpers domain/post.js

```javascript
postHtmlOf(post)      // HTML pour web UI
postTextOf(post)      // Texte brut
postLinkOf(post)      // URL Bluesky
postImageOf(post)     // URL image
postAuthorOf(post)    // Handle auteur
```

---

**FLAGS**: `copilot-instructions`
