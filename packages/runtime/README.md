# Botpress Runtime

The botpress runtime is a lightweight version of botpress that runs on the cloud

## Testing Runtime with Messaging

1. Edit the file `dist/.env` and configure the following elements:

```js
ENABLE_EXPERIMENTAL_CONVERSE=true
MESSAGING_ENDPOINT=http://localhost:3100
```

2. Restart the server
3. Import your bot (check api.rest for the commands)
4. Type `yarn chat` to start a small development server, then open the URL in your browser
5. To fix the messaging config of your bot, open the page `http://localhost:5000/id-of-bot` (if you use the sample, then `test-bot`)
6. Restart the server (if the bot couldn't mount properly)

You can also load a specific client id directly using `http://localhost:5000?clientId=my-id` or even use the official messaging server using `&messagingEndpoint=https://messaging.botpress.dev`

## SDK

### Removed methods

- `bp.http.*`
- `bp.config.*`
- `bp.workspaces.*`
- `bp.distributed.*`
- `bp.experimental.*`
- `bp.realtime.*`
- `bp.bots.*` except `bp.bots.getBotById`
- `bp.kvs.*` except `bp.kvs.forBot`
- `bp.ghost.*` except `bp.ghost.forBot` (also only provides functions to read files, not write)
- `bp.cms.deleteContentElements`
- `bp.cms.createOrUpdateContentElement`
- `bp.cms.saveFile`
- `bp.cms.readFile`
- `bp.cms.getFilePath`
