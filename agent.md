# botEnSky - Agent Context

## Stack

Node.js Bluesky Bot | Express.js web UI  
Node.js | @atproto/api, node-cron, winston | Mocha tests

## Principes

SOLID, KISS, DRY | MCP IntelliJ prioritaire | pnpm only

**Doc DRY/SRP**: 1 info = 1 endroit
- README.md: Installation, plugins, config
- .github/issue_*.md: Features en cours (voir `.github/agent.md`)
- src/locales/: i18n FR/EN

## Workflow

1. Lire `agent.md` + `.github/agent.md` + issue active
2. Analyser code existant (patterns, conventions)
3. Appliquer SOLID/KISS
4. Tests manuels (bot simulation, web UI)
5. Cocher tâches dans `.github/issue_*.md`

## Architecture

```
src/
├── config/              ← Injection dépendances
├── domain/              ← Helpers (post.js)
├── plugins/             ← Plugins bot (BioClip, Plantnet, Summary...)
├── services/            ← Services (Bluesky, Audit...)
├── servicesExternal/    ← APIs externes (GrBird, Plantnet...)
├── www/                 ← Web UI Express
│   ├── public/          ← CSS modern, JS vanilla, assets
│   └── views/           ← EJS (pages/ + partials/)
└── locales/             ← i18n FR/EN
```

## Plugins Bot

**Cycle**: Cron triggers → Plugin.process() → Bluesky API  
**Planification**: 08h30, 11h30, 14h30, 16h30, 17h30, 20h30 (FR timezone)

- **BeSPlantnet**: Identifie plantes (Pl@ntNet API) + répond
- **BeSAskPlantnet**: Répond mentions + Pl@ntNet
- **BeSBioClip**: Identifie oiseaux (BioClip API) + répond
- **BeSAskBioClip**: Répond mentions + BioClip
- **OneDayOneBioclip**: Post quotidien (Unsplash + BioClip)
- **Summary**: Analytics 7 jours (posts, likes, reposts)
- **UnMute**: Gestion auteurs mutés

## Commandes

```bash
pnpm install             # Setup
pnpm start               # Lance bot + web UI
pnpm test                # Tests Mocha
node src/index.js        # Bot seul

# Dev
LOG_LEVEL=debug pnpm start           # Mode debug
DO_SIMULATE=true pnpm start          # Simulation (pas de posts réels)
```

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
- `src/www/views/partials/`: Composants (header, home-new, principes-new, faq-new)
- `src/www/public/css/`: Design system CSS
- `src/www/public/js/`: JavaScript vanilla (theme, navigation, lightbox...)

## Conventions

Code: **Français** (logs, messages) | JSDoc **anglais**  
ESM: `import/export` (pas CommonJS)

## Services clés

**BlueskyService**: Login, search posts, reply, newPost  
**PluginsCommonService**: Helpers plugins (imageHtmlOf, replyResult...)  
**SummaryService**: Analytics 7j (cache 24h)  
**GrBirdApiService**: API BioClip (identification oiseaux)  
**PlantnetService**: API Pl@ntNet (identification plantes)

## Helpers domain/post.js

```javascript
postHtmlOf(post)      // HTML pour web UI
postTextOf(post)      // Texte brut
postLinkOf(post)      // URL Bluesky
postImageOf(post)     // URL image
postAuthorOf(post)    // Handle auteur
```
