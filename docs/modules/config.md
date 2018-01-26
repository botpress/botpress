---
layout: guide
---

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

### Example of configuration object <a class="toc" id="toc-example-of-configuration-object" href="#toc-example-of-configuration-object"></a>


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

## Using the configuration <a class="toc" id="toc-using-the-configuration" href="#toc-using-the-configuration"></a>


The configuration object for your module has four methods:

- `saveAll(object) -> Promise()`
- `set(name, value) -> Promise()`

- `loadAll() -> Promise(object)`
- `get(name) -> Promise(value)`

### Accessing the configuration <a class="toc" id="toc-accessing-the-configuration" href="#toc-accessing-the-configuration"></a>


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

  ready: function(bp, configuration, helpers) {
    // more code ...
  }
}
```

## Where is the configuration saved? / Is the configuration persisted in database? <a class="toc" id="toc-where-is-the-configuration-saved-is-the-configuration-persisted-in-database" href="#toc-where-is-the-configuration-saved-is-the-configuration-persisted-in-database"></a>

The configuration is persisted in the database. In fact, it is persisted using the built-in Key-Value store.

## Can I overwrite the configuration at run time? / Can I use environment variables to set configuration? <a class="toc" id="toc-can-i-overwrite-the-configuration-at-run-time-can-i-use-environement-variables-to-set-configuration" href="#toc-can-i-overwrite-the-configuration-at-run-time-can-i-use-environement-variables-to-set-configuration"></a>


You may overwrite the configuration or provide default values from environement variables. To do so, simply assign a value to the `env` property of the configuration key. In the example above, `accessToken` can be overwritten by the `WIT_TOKEN` environement variable.

## Can I commit to source-control some values? <a class="toc" id="toc-can-i-commit-to-source-control-some-values" href="#toc-can-i-commit-to-source-control-some-values"></a>

You may overwrite the configuration from inside your botfile using the `config` key followed by the name of the module:

```js
// botfile.js
{
  // usual botfile ...
  config: {
    'botpress-messenger': {
      displayGetStarted: true,
      greetingMessage: 'Hello!'
    }
  }
}
```
