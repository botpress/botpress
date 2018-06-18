---
layout: guide
---

By default `botpress init` initializes a minimal installation of the bot. It's pretty lightweight and is easy to work with.
But if you want to use latest ecmascript-features like ES6-modules you may need to enable transpiling. One of the ways to do that is via webpack.

Let's say you have just initialized a new bot. How can you make it transpiled via webpack?

First you'd need to install missing dependencies to it:
`yarn add --dev babel-core babel-loader babel-preset-latest webpack@4 webpack-node-externals`

Next thing is adding webpack config. It could look something like this:

```js
var webpack = require('webpack')
var nodeExternals = require('webpack-node-externals')
const path = require('path')

var nodeConfig = {
  devtool: 'source-map',
  entry: ['./src/index.js'],
  output: {
    path: path.resolve(__dirname, './bin'),
    filename: 'node.bundle.js',
    libraryTarget: 'commonjs2',
    publicPath: __dirname
  },
  externals: [nodeExternals(), 'botpress'],
  target: 'node',
  node: { __dirname: false },
  resolve: { extensions: ['.js'] },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: { loader: 'babel-loader', options: { presets: ['latest'] } }
    }]
  },
}

var compiler = webpack([nodeConfig])
var postProcess = function(err, stats) {
  if (err) { throw err }
  console.log(stats.toString('minimal'))
}

if (process.argv.indexOf('--compile') !== -1) {
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}

module.exports = { node: nodeConfig }
```

Now when we have config ready we need to update our package json with scripts that compile or watch our app and change an entry-point of the app:

```json
  "main": "bin/node.bundle.js",
  "scripts": {
    // ...
    "watch": "node webpack.js --watch",
    "compile": "node webpack.js --compile"
  },
```

From now on you can run `yarn compile && yarn start` to compile your app and start the server. You can also run `yarn watch` in separate session to make it rebuild automatically.

But if you start an app you may face a problem with JSDoc-package that is added to new bots by default to enable documenting actions. An issue is that path should now be set up relevantly to `/bin` folder while we should still require transpiled actions. To fix it you may need to update your `src/custom.js` like this:

```js
/* ... */
const actionFiles = [
  { untranspiledPath: '../src/actions.js', actions: require('./actions.js') }
]

module.exports = async bp => {
  await registerRenderers(bp)
  await registerActions(bp)
}

async function registerActions(bp) {
  const metadata = {}
  bp.dialogEngine.registerActionMetadataProvider(action => metadata[action])

  for (const { untranspiledPath, actions } of actionFiles) {
    const docs = await jsdoc.explain({ files: path.join(__dirname, untranspiledPath) })
    /* ... */
  }
}
```
