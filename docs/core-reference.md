## Core Reference

---

### EventBus > `bp.events`

The EventBus is an instance of [EventEmmitter2](https://github.com/asyncly/EventEmitter2), so all of its features are available. 

#### `emit(name, [arg])`

##### Example

```js
bp.events.emit('messenger.connected', { connected: true })
```

#### `on(name, listener)`

##### Wildcards

The instance is configured with wildcards enabled, the wildcard delimiter is **`.`**.

##### Example
```js
bp.events.on('messenger.connected', event => {
  bp.logger.info('Messenegr connected')
})

// accepts wildcards (*)
bp.events.on('messenger.*', event => /* ... */)
```

---

### Database > `bp.db`

#### `get() -> Promise(knex)`

Returns an instance of the [knex](http://knexjs.org/) database query builder. It is configured to use a SQLite3 database located in `${dataDir}/db.sqlite`.

##### Example

```js
bp.db.get()
.then(knex => 
   knex('users')
   .where({ gender: 'male' }}
   .limit(10))
.then(users => /* ... */)
```

#### `saveUser(UserObject) -> Promise()`

Saves a user in the built-in `users` table. **Does not** overwrite existing entries (they are ignored). An entry is considered unique by the union of `id` and `platform`.

##### User Object

```js
{ id: string, // *required*
  platform: string, // *required*
  gender: string,
  timezone: integer (-12, +14),
  locale: string
}
```

---

### Middlewares > `bp.middlewares` {#core-middlewares}

#### `load() -> void`

Loads (or reloads) all the middleware in the correct order (ordered by their `order` property. Customizations (custom order and enabled/disabled) set in the UI are also taken into account.

This method **must** be called in your bot initialization in order for it to work properly.

##### Example

```js
module.exports = function(bp) {
  bp.middlewares.load()
}
```

#### `register(MiddlewareDefinition) -> void`

##### MiddlewareDefinition

```js
{
  name: string, // *required*
  type: string(ingoing|outgoing), // *required*
  handler: function, // *required*
  order: int,
  module: string,
  description: string
}
```

##### Example

```js
// Taken from botpress-messenger/src/index.js

bp.middlewares.register({
  name: 'messenger.sendMessages',
  type: 'outgoing',
  order: 100,
  handler: outgoingMiddleware,
  module: 'botpress-messenger',
  description: 'Sends out messages that targets platform = messenger.' +
  ' This middleware should be placed at the end as it swallows events once sent.'
})
```

#### `sendIncoming(MiddlewareEvent) -> void`

##### MiddlewareEvent

```js
{
  type: string, // *required*, e.g. 'message', 'postback'
  platform: string, // *required*, e.g. 'facebook', 'slack'
  text: string, // *required*, the textual representation of the event value
  raw: any // *required*, the raw event, as received from the platform
}
```

##### Example

```js
bp.middlewares.sendIncoming({
  type: 'postback',
  platform: 'facebook',
  text: 'GET_STARTED',
  raw: fbEvent // complex object
})
```

#### `sendOutgoing(MiddlewareEvent) -> void`

---

### Logger > `bp.logger`

The logger is an instance of the excellent [`winstonjs`](https://github.com/winstonjs/winston).

#### `verbose(args...)`
#### `debug(args...)`
#### `info(args...)`
#### `warn(args...)`
#### `error(args...)`

---

### Modules > `bp.modules`

#### `install(name, [name2], [...]) -> Promise()`
#### `uninstall(name, [name2], [...]) -> Promise()`
#### `listInstalled() -> string[]`

---

### Notifications > `bp.notifications`

#### `send(NotificationDefinition) -> void`

Sends and persist a notification to the Botpress UI. Useful to get the bot administrator's attention.

##### NotificationDefinition

```js
{
  message: string, // *required*
  url: string, // on notification click, possibility to bring the user to an URL
  level: string // default: info. choices: info, error, success
}
```

---

### HTTP Server > `bp.getRouter(moduleName, [options]) -> Express Router` {#core-server}

Returns an [Express Router](http://expressjs.com/en/4x/api.html#express.router) for the specified module. The exposed API methods will be available at: `/api/<moduleName>/<methods>`.

**The module name must start by `botpress-`, for example `botpress-messenger`.**

By default, routes have a couple of middlewares installed, which you can turn on or off if needed:

- [**`bodyParser.json`**](https://github.com/expressjs/body-parser)
- [**`bodyParser.urlencoded`**](https://github.com/expressjs/body-parser)
- **`auth`**: the default botpress authentication

##### Example

```js
bp.getRouter('botpress-awesome', { auth: req => false })
.get('ping', (req, res) => res.send('pong'))
```

---

### Hear

#### `bp.hear(condition, handler) -> void`

Utility function to easily register incoming middlewares. 

The condition can be a string, a regex or an object. In case of an object, all conditions must match for the handler to be called.

The handler takes the MiddlewareEvent as the first argument and takes the `next` middleware caller as the second argument. If the `next` argument is not specified in your handler, botpress assumes you wanted to call it and calls it at the end of the synchronous execution of the handler.

##### Examples (string)

```js
bp.hear('hello', (event, next) => {
  /* swallow the event by never calling next() */
})
```

##### Examples (regex)

```js
bp.hear(/^hello$/i, event => {
  /* next not specified so will be called automatically */
})
```

##### Examples (object)

```js
const complexCondition = {
  'user.first_name': /watson$/i,
  'raw.phone.number': value => !Number.isNaN(value),
  platform: 'sms'
}

bp.hear(complexCondition, smsHandler)
```
