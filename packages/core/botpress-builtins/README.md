This package provides you with several builtin content types that we found to be most commonly used. To make use of them you need to install that package and register builtins like this:

```js
const { contentElements, contentRenderers, actions, setup } = require('@botpress/builtins')

await setup(bp)

// Register built-in content elements
await Promise.all(
  Object.values(contentElements)
    .map(schema => bp.contentManager.loadCategoryFromSchema(schema))
)

// Register renderers for the built-in elements
_.toPairs(contentRenderers).forEach(params => bp.renderers.register(...params))

// Register built-in actions
await bp.dialogEngine.registerActions(actions)
```
