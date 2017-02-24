# How to use the hear middleware

### `bp.hear(condition, handler) -> void`

Utility function to easily register incoming middlewares. 

The condition can be a string, a regex or an object. In case of an object, all conditions must match for the handler to be called.

The handler takes the MiddlewareEvent as the first argument and takes the `next` middleware caller as the second argument. If the `next` argument is not specified in your handler, botpress assumes you wanted to call it and calls it at the end of the synchronous execution of the handler.

### Examples (string)

```js
bp.hear('hello', (event, next) => {
  /* swallow the event by never calling next() */
})
```

### Examples (regex)

```js
bp.hear(/^hello$/i, event => {
  /* next not specified so will be called automatically */
})
```

### Examples (object)

```js
const complexCondition = {
  'user.first_name': /watson$/i,
  'raw.phone.number': value => !Number.isNaN(value),
  platform: 'sms'
}

bp.hear(complexCondition, smsHandler)
```