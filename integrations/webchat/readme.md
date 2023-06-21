# Webchat

## Description

How to test:

1. Open developer tools & go to network tab
2. Open app.botpress.cloud
3. Inspect the call https://controller.botpress.dev/v2/bots/xxxxx
4. On preview tab, drill down on "integrations", then copy params under configuration in your bot's integration config
5. Disable the official webchat integration
6. Put those parameters to configure your webchat integration, then save
