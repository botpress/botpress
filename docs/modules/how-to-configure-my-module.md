# How to configure my module

The configuration of your module must be set in your module's entry point:

```js
// your module's index.js

module.exports = {
  config: {}, // <--- here
  init: function() {},
  ready: function() {}
}
```

Each key of the object represents a configuration variable. The value of the configuration variable is an object with the following values:

```js
{
  type: 'string', // REQUIRED. Can be "string", "choice", "bool" or "any"
  required: true, // defaults to false
  env: 'string', // defaults to null
  default: 'default_value', // REQUIRED if type = choice. Defaults to null, '', false (depending on the type)
  validation: null, // function. defaults to () => true
}
```

### Example of configuration object

```js
config: {
  accessToken: {
    type: 'string',
    required: true,
    env: 'WIT_TOKEN',
    default: '<YOUR TOKEN HERE>' },

  selectedMode: {
    type: 'choice',
    validation: ['understanding', 'stories'],
    required: true,
    default: 'understanding'
  }
}
```

## Using the configuration

The configuration object for your module has four methods:

- `saveAll(object) -> Promise()`
- `set(name, value) -> Promise()`

- `loadAll() -> Promise(object)`
- `get(name) -> Promise(value)`

### Accessing the configuration

The configuration object passed to your module in it's `init` and `ready` methods:

```js
module.exports = {

  config: {
    accessToken: { type: 'string', required: true, env: 'WIT_TOKEN', default: '<YOUR TOKEN HERE>' },
    selectedMode: { type: 'choice', validation: ['understanding', 'stories'], default: 'understanding' }
  },

  init: async function(bp, configuration) {
    const config = await config.loadAll()
    console.log(config) // prints { accessToken: 'user_token', selectedMode: 'understanding' }
  },

  ready: function(bp, configuration) {
    // more code ...
  }
}
```
