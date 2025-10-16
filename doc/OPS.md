[< botEnSky](../README.md)

# Operator guide - OPS guide --- DRAFT VERSION

BotEnSky application is currently deployed on render.com free plan without special requirements out of setting environment.
This page don't talk about render.com as there is nothing to add to official doc.

BotEnSky application planB (#142) is to deploy it on a private VM having special requirements : ex. #143 Coolify PaaS

💁 NOTE: this is a DRAFT VERSION, as for now only local test has been done

This page describe VM requirements

For Coolify PaaS installation, cf. [OPS_coolify](./OPS_coolify.md)
For BotEnSky applications install, cf. [OPS_coolify_botensky_app](./OPS_coolify_botensky_app.md)

## Requirements

### A Secure Linux Virtual machine (VM)
- Example : OVH dedicated VM ([VPS help doc](https://help.ovhcloud.com/csm/fr-vps-getting-started?id=kb_article_view&sysparm_article=KB0047736))
- you could use your own VM, or VM provider to instantiate a new Linux VM.
- you must have an ssh access to the VM.
- your VM must have swap on.

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
