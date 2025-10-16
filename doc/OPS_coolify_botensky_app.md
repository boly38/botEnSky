[< OPS](./OPS.md)

## Coolify > BotEnSky Application deployment

Coolify is used to deploy app.

- Requirement : Coolify is installed,
  With at minimum:
- `Servers` : check you have a server installed with ssh access (ie. start ssh server if needed)


### HowTo deploy botEnSky on Coolify - Build Pack : `Docker compose`

Add botEnSky as a new Coolify project instance :
- `Projects > +add` : add and name a new project ex. Name `boly38/botensky` - Description `botensky`
- Environment `Production` > `+Add Resource`
- `Public Repository` > Repository URL `https://github.com/boly38/botEnSky` > `Check repository`
- `Configuration` > branch `deploy-prod-package` > Build Pack `Docker compose`
- `Configuration` > `Domains for app` > `https://bes.example.fr` [doc](https://coolify.io/docs/knowledge-base/docker/compose)
- Docker compose location : `/docker-compose.yml` > Click on `Continue`
- Wait for it
- When compose file is loaded, click on `Save`
- Click on `Deploy` et voilà 🚀


TIP: show debug log to see the very first deployment in details. Coolify is very friendly.

TIP: to test using local WSL2, you could map 127.0.0.1 to a given name ex `coolify.local` and set `General > Domains` with `http://coolify.local/`. In that context, your app is visible from http://coolify.local:5000/


## FAQ

### on "no available server" issue
Means that Traefik dont route to your app ([doc](https://envix.shadowarcanist.com/coolify/troubleshooting/no-available-server/))
- check health endpoint `/app $ wget http://127.0.0.1/health`
- check network/app configuration