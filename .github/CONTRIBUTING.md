[ < Back](../README.md)

# HowTo Contribute

Please create an [issue](https://github.com/boly38/botEnSky/issues) describing your goal / question / bug description...

If you're interested in an existing issue, please contribute by up-voting for it by adding a :+1:.

If you want to push some code :
- fork and prepare a feature-git-branch, then create a [pull request](https://github.com/boly38/botEnSky/pulls) that link your issue.
- execute tests

You could also be critic with existing ticket/PR : all constructive feedbacks are welcome.

## HowTo execute tests
* launch tests using `npm test`.

Think about environment setup.


## Basis reminder
Clone this repository from GitHub:

```
$ git clone https://github.com/boly38/botEnSky.git
```

### Prerequisites

1. Install NodeJs (https://nodejs.org/en/download/)
2. Install dependencies
```bash
npm install
```

### Set your own private environment

- study each required environment variable in the [template](../env/.env.template)
- copy the template in a private file
```bash 
cp ./env/.env.template ./env/.env.development
```

### Start the bot

Execute the application
```bash
npm run startDev
```
or (production mode)
```bash
npm run start
```

## PullRequests additional information
Activated bot:
- [houndci](https://houndci.com/)



# Maintainer HowTos
## HowTo create a fresh version
- use patch or minor or major workflow

this will make a new version and on version tag, the main ci workflow will push a new npmjs version too.

## HowTo release using Gren

```bash
# provide PAT with permissions to create release on current repository
export GREN_GITHUB_TOKEN=your_token_here
# one time setup
npm install github-release-notes -g

git fetch --all && git pull
# make a release vX with all history
gren release --data-source=prs -t v2.2.2 --milestone-match=v2.2.2
# overrides release vX with history from vX-1
gren release --data-source=prs -t "v2.2.2..v2.2.1" --milestone-match="v2.2.2" --override
```
