## Core Reference {#core}

### EventBus > `bp.events`{#core-eventbus}

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

### Database > `bp.db`{#core-database}

### Middlewares > `bp.middlewares` {#core-middlewares}

### Logger > `bp.logger` {#core-logger}

### Modules > `bp.modules` {#core-modules}

### Notifications > `bp.notifications` {#core-notifications}

### HTTP Server > `bp.server` {#core-server}

