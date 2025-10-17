[< OPS](OPS.md)

# Operator guide - OPS guide for Coolify

### Coolify 

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

#### Coolify Recover unstable proxy

- https://github.com/coollabsio/coolify/issues/4605

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
