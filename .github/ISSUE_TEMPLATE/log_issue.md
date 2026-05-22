---
name: Bug Report
about: Report a bug
title: Logs not being sent to Discord normally
labels: bug
assignees: ''

---

## Description
Logs are not being sent to Discord during normal application operation. They only appear in Discord when the application is redeployed.

## Expected Behavior
Logs should be sent to Discord in real-time as the application runs, without requiring a redeployment.

## Current Behavior
Logs only appear in Discord after the application is redeployed. This suggests a potential issue with Promise handling in JavaScript.

## Possible Cause
This could be related to:
- Unresolved or improperly handled JavaScript Promises
- Asynchronous operations not completing before the application stops processing
- Event listeners or handlers not being properly initialized

## Steps to Reproduce
1. Run the application normally
2. Observe that logs do not appear in Discord
3. Redeploy the application
4. Notice that logs now appear in Discord

## Additional Information
- This issue appears to be related to Promise handling in the application
- The problem doesn't occur after redeployment, suggesting initialization or shutdown timing issues
