# GitHub Actions

## Cron
GHA BeS Cron expression rely on month workaround to support FR timezone
- workaround with months - Central European Time (CET) Standard time (UTC+1) or Daylight saving time during summer (UTC+2)

Example
````github
on:
  schedule: # 08h30, 11h30, 14h30, 16h30, 17h30 et 20h30 (FR timezone)
    # (CET) Standard time (UTC+1)
    - cron: '30 7,10,13,15,16,19 * 11-12,1-3 *'
    # (CET) Daylight saving time (UTC+2)
    - cron: '30 6,9,12,14,15,18 * 4-10 *'
````

GHA cron : add timezone support :
- discussion https://github.com/orgs/community/discussions/13454 
- ticket https://github.com/actions/runner/issues/1423
