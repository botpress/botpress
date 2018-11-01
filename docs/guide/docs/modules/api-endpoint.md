---
id: api-endpoint
title: API endpoint
---

The only way to communicate with modules (or between them) is by using the API endpoint.
All modules are isolated and receives their own instance of `bp`

## Consuming an API

### Externally or from another module

The Botpress SDK exposes a method to get the axios headers for a request. It will automatically sets the base URL for the request, and will set the required headers to communicate with the specific bot. This method is `bp.http.getAxiosConfigForBot('bot123')`

Once you have this, you simply have to call the axios method of your choice, and add the config as the last parameter. Example:

```js
extractNluContent: async () => {
  const axiosConfig = bp.http.getAxiosConfigForBot(event.botId)
  const text = event.payload.text
  const data = await axios.post(`/api/ext/nlu/extract`, { text }, axiosConfig)
}
```

### From your module's views

When a user is using your module's interface, a bot is already selected so you just need to call `bp.axios`. It is always passed down to your react components as a property.

```JS
const result = await this.props.bp.axios.get('/api/ext/my-modyle/query')
```

## Creating an API endpoint

Modules are global, as is the API, so they must be able to manage multiple bots. We recommend setting up the API route in the `onServerReady` method of your entry point.

The bot ID targeted by the request is always available via `req.params.botId`

Setting up an API is very easy.

```js
const router = bp.http.createRouterForBot('dialog-sessions')

router.get('/count', async (req, res) => {
  const botId = req.params.botId

  const { dialogSessions } = await knex('dialog_sessions')
    .count('id as dialogSessions')
    .where({ botId })
    .first()

  res.send({ dialogSessions })
})
```

In the example above, we added a route handler that will be available via `/api/ext/dialog-sessions/count` which fetches data from the database and returns the data as json.
