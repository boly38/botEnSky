# botEnSky

👢 botEnSky is a [BlueSky social app](https://bsky.app/) 🤖 bot born on May 16, 2024.
- written in JavaScript (Node.js ESM Project),
- the worthy successor to [@botentrain1](https://twitter.com/botentrain1) (ex Twitter bot - [code](https://github.com/boly38/botEnTrain)) but for BlueSky.

His ambition is to **bring 😊 happiness to 🦋 Bluesky 👤 users**.

## References

- **BlueSky 🤖 Bot account : [@botensky.bsky.social](https://bsky.app/profile/botensky.bsky.social)** 
- Bot engine 🌐 WebPage : https://botensky.verymad.net

## Bot features (plugins)

- French help - cf. https://botensky.verymad.net
- English : cf. below.

### Plugins
- 🧩 [Plantnet](src/plugins/Plantnet.js) plugin

*search a post with an embedded image, a not muted author, and without reply using [some questions](src/data/questionsPlantnet.json) and use Pl@ntNet API to try to identify the flower.*
- on **good score** result: post a reply with confident ratio, name, common name, and embed sample image +alt (provided by Pl@ntNet)
- on **bad score** result, or **nothing detected** result: mute author and don't reply. The action to "mute" the author is to avoid to replay the same plantnet identification twice a day (for same result). Muted authors are unMuted by UnMute plugin at the end of the day.

- 🧩 [askPlantnet](src/plugins/AskPlantnet.js) plugin

*search a post with one of [askPlantnet](src/data/askPlantnet.json) mention, and try to identify the parent post first image using the same previous logic except that bad score or nothing detected will produce a reply to the mention.*


- 🧩 [unMute](src/plugins/UnMute.js) plugin

*remove bot all muted authors.*

- 🧩 [Summary](src/plugins/Summary.js) plugin

*get some analytics for last 7 days of bot activity.*

- 🧩 [BioClip](src/plugins/BioClip.js) plugin

*search a post with an embedded image, a not muted author, and without reply using [some questions](src/data/questionsBioClip.json) and use [GrBird API](https://huggingface.co/spaces/3oly/grBird) to try to classify the bird.*
- on **good score** result: post a reply with confident ratio, species, genus, family, common name, and a link to flickr gallery (provided by [Avibase](https://avibase.bsc-eoc.org/))
- on **bad score** result, or **nothing detected** result: mute author and don't reply. The action to "mute" the author is to avoid to replay the same classification twice a day (for same result). Muted authors are unMuted by UnMute plugin at the end of the day.


- 🧩 [askBioclip](src/plugins/AskBioclip.js) plugin

*search a post with one of [askBioclip](src/data/askBioclip.json) mention, and try to classify the parent post first image using the same previous logic except that bad score or nothing detected will produce a reply to the mention.*

- 🧩 [1Day1Bioclip](src/plugins/OneDayOneBioclip.js) plugin

*Every day, the robot searches [Unsplash](https://unsplash.com/) for a collection with one of [this queries](src/data/oneDayOneBioclip.json) for photo of another author and attempts to identify it using Bioclip. The details of the photo and its identification are then posted on Bluesky.*

- 🧩 [Healthcheck](src/plugins/HealthCheck.js) plugin

*Performs health checks of external services upon manager request. These checks help ensure the system is functioning properly by diagnosing problems.

### Bot trigger
- Github Actions [workflows](.github/workflows) (`trigger_*`) are used to trigger the bot, they are based on `schedule` directives (UTC time, [doc](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule))


## How to contribute ?

- cf. [CONTRIBUTING](.github/CONTRIBUTING.md)

### Versions
- [releases notes](https://github.com/boly38/botEnSky/releases)  - generated via [GitHub client](https://cli.github.com/)
- [tests - code-coverage](https://boly38.github.io/botEnSky/)

### Credits : Services and projects with free plans 🚀 🌷

For a comprehensive and always up-to-date list of all services, libraries, and tools that make botEnSky possible, please visit the **[Credits page](https://botensky.verymad.net#credits)** on the botEnSky website.

### Contributions

- Team: cf. [contributors](https://github.com/boly38/botEnSky/graphs/contributors)
![Repobeats](https://repobeats.axiom.co/api/embed/7e769fd1b4307573766d3ea965277996d11a0b3f.svg "Repobeats analytics image")

<small>provided by [Repobeats](https://repobeats.axiom.co/)</small> 

