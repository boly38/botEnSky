# botEnSky

👢 botEnSky is a [BlueSky social app](https://bsky.app/) 🤖 bot born on May 16, 2024.
- written in JavaScript (Node.js ESM Project),
- the worthy successor to [@botentrain1](https://twitter.com/botentrain1) (ex Twitter bot - [code](https://github.com/boly38/botEnTrain)) but for BlueSky.

His ambition is to **bring 😊 happiness to 🦋 Bluesky 👤 users**.

## References

- **BlueSky 🤖 Bot account : [@botensky.bsky.social](https://bsky.app/profile/botensky.bsky.social)** 
- Bot engine 🌐 WebPage : [botensky.onrender.com](https://botensky.onrender.com/)

## Bot features (plugins)

- French help - cf. [botensky.onrender.com](https://botEnSky.onrender.com)
- English : cf. below.

### Plugins
- 🧩 [Plantnet](src/plugins/Plantnet.js) plugin

*search a post with an embedded image, a not muted author, and without reply using [some questions](src/data/questionsPlantnet.json) and use Pla@ntNet API to try to identify the flower.*
- on **good score** result: post a reply with ratio, name, common name, and embed sample image +alt (provided by Pl@ntNet)
- on **bad score** result, or **nothing detected** result: mute author and don't reply. The action to "mute" the author is to avoid to replay the same plantnet identification twice a day (for same result). Muted authors are unMuted by UnMute plugin at the end of the day.

- 🧩 [askPlantnet](src/plugins/AskPlantnet.js) plugin

*search a post with one of [askPlantnet](src/data/askPlantnet.json) mention, and try to identify the parent post using the same previous logic except that bad score or nothing detected will produce a reply.*


- 🧩 [unMute](src/plugins/UnMute.js) plugin

*remove bot all muted authors.*

- 🧩 [Summary](src/plugins/Summary.js) plugin

*get some analytics for last 7 days of bot activity.*

### Bot trigger
- Github Actions [workflows](.github/workflows) (`trigger_*`) are used to trigger the bot, they are based on `schedule` directives (UTC time, [doc](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule))


## How to contribute ?

- cf. [CONTRIBUTING](.github/CONTRIBUTING.md)

### Versions
- [releases notes](https://github.com/boly38/botEnSky/releases)  - generated via `gren` [![Automated Release Notes by gren](https://img.shields.io/badge/%F0%9F%A4%96-release%20notes-00B2EE.svg)](https://github-tools.github.io/github-release-notes/)
- [tests - code-coverage](https://boly38.github.io/botEnSky/)

### Credits
Application and code structure:
- [NodeJs](https://nodejs.org/) and Node dependencies (cf. [graph](https://github.com/boly38/botEnSky/network/dependencies))
- [BlueSky API](https://docs.bsky.app/)

Services ( having free plan 🚀 🌷 )
- [GitHub Actions](https://github.com/features/actions)
- [Render](https://render.com/) free app hosting and automated deployments
- [PlantNet.org](https://plantnet.org) ([API](https://my.plantnet.org/)) - plant identification service (max 200 req/days)
- [betterstack](https://logs.betterstack.com/) - logs management
- 

Team:
- cf. [contributors](https://github.com/boly38/botEnSky/graphs/contributors)
