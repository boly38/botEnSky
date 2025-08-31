[< botEnSky](../README.md)

# Operator guide - OPS guide --- DRAFT VERSION

BotEnSky application is currently deployed on render.com free plan without special requirements out of setting environment.
This page don't talk about render.com as there is nothing to add to official doc.

BotEnSky application planB (#142) is to deploy it on a private VM having special requirements : ex. #143 Coolify PaaS

💁 NOTE: this is a DRAFT VERSION, as for now only local test has been done

This page describe VM requirements + Coolify PaaS installation.

For BotEnSky applications install, cf. [OPS_app](./OPS_app.md)

## Requirements

### A Secure Linux Virtual machine (VM)
- Example : OVH dedicated VM ([VPS help doc](https://help.ovhcloud.com/csm/fr-vps-getting-started?id=kb_article_view&sysparm_article=KB0047736))
- you could use your own VM, or VM provider to instantiate a new Linux VM.
- you must have an ssh access to the VM.

### Ssh notice

- configure VM ssh service, and keep pk in a secure place,
- refuse ssh root login with password (mandatory),
- add an ssh script `/etc/ssh/scripts/sshnotify.sh` that will notify ssh connexions to your favorite tchat app channel.

TODO: add more details on this

### Fail2Ban service is recommended
- add [fail2ban](https://github.com/fail2ban/fail2ban) : a project that monitor and ban IP of ssh attempts too many failures
````
systemctl start/enable/stop fail2ban
````

To see banned ip :
```
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### Coolify 
💁 NOTE: this is a DRAFT VERSION, for now only local QA using WSL2 has been done.

#### Coolify install
- Follow [Coolify installation guide](https://coolify.io/docs/installation)
- On issue, you could rely on [manual as fallback](https://coolify.io/docs/get-started/installation#manual-installation)
- ✔️ at the end, you have docker installed on your VM, and coolify visible from your browser.
- ➕👤 create a Coolify administrator account with a secure password.


### Coolify - TIPS
#### Coolify Start
```bash
sudo su -
cd /data/coolify
docker compose \
  --env-file /data/coolify/source/.env \
  -f /data/coolify/source/docker-compose.yml \
  -f /data/coolify/source/docker-compose.prod.yml \
  up -d --pull always --remove-orphans --force-recreate
````

go to http://youserver:8000

#### Coolify Stop
```bash
docker compose \
  --env-file /data/coolify/source/.env \
  -f /data/coolify/source/docker-compose.yml \
  -f /data/coolify/source/docker-compose.prod.yml down
```

#### Coolify Recover admin account

💁 TIP: I dont remember the email used by account creation

```bash
docker exec -it coolify-db psql -U coolify
````

Then in Postgres console :

````sql
\c coolify
SELECT email FROM users;
````

💁 TIP: I want to reset admin account creation (not tested)

```bash
docker exec -it coolify bash
php artisan coolify:reset-password
```

TIP: save it in a safe place (like Keepass)
