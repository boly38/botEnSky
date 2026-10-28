[< botEnSky](../README.md)

# Operator guide

BotEnSky is deployed on a private VM using Coolify.

This page describes the VM requirements. For setup and deployment instructions, see:

- [Coolify installation](./OPS_coolify.md)
- [BotEnSky application deployment](./OPS_coolify_botensky_app.md)

## Requirements

### A Secure Linux Virtual machine (VM)
- Example : OVH dedicated VM ([VPS help doc](https://help.ovhcloud.com/csm/fr-vps-getting-started?id=kb_article_view&sysparm_article=KB0047736))
- you could use your own VM, or VM provider to instantiate a new Linux VM.
- you must have an ssh access to the VM.
- your VM must have swap on.
- tune your server timezone (optional)
```bash
timedatectl
timedatectl list-timezones | grep Paris
timedatectl set-timezone Europe/Paris
sudo systemctl restart cron
sudo systemctl restart rsyslog
```

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
