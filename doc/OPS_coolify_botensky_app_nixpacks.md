
### (deprecated) HowTo deploy botEnSky on Coolify - Build Pack : `Nixpacks`

The app need to be nixpacks compatible to be deployed.

#### HowTo (local) verify nixpacks compatibility

````bash
# NB: this works under WSL2
# git clone and cd botensky/
# cat ./nixpacks.toml
nixpacks build . --name botensky-app
````

#### Local nixpacks run
Once nixpacks build is done, you could start app container.

````bash
docker run -it -p 5000:5000 botensky-app
````
#### HowTo Coolify nixpacks deploy

- once Coolify is installed,
- `Servers` : check you have a server installed with ssh access (ie. start ssh server if needed)
- `Projects > +add` : add and name a new project ex. Name `boly38/bot-en-sky:localQA` - Description `this is my bot`
- You could name your environment ex. replace `Production` by `wsl2`
- `Dashboard > boly38/bot-en-sky:localQA > +Add resource` :
- choose `Public repository`,
- if needed to validate the server to use
- Repository URL: `https://github.com/boly38/botEnSky` | Build Pack : `Nixpacks` | Base dir : `/` | Port `5000` | uncheck static site + `Continue`
- `General` > adapt name suffix ex `boly38/bot-en-sky:nixpacks/coolify-withWsl2` | Port mapping `5000:5000` (or your need)
- `Environment` > Paste in developper mode your env variables list
+ `Save` + `Deploy` et voilà 🚀

TIP: show debug log to see the very first deployment in details. Coolify is very friendly.

TIP: to test using local WSL2, you could map 127.0.0.1 to a given name ex `coolify.local` and set `General > Domains` with `http://coolify.local/`. In that context, your app is visible from http://coolify.local:5000/
