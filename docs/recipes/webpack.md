---
layout: guide
---

By default `botpress init` initializes a minimal installation of the bot. It's pretty lightweight and is easy to work with.
But if you want to use the latest ECMAscript features, like ES6-modules, you will need to enable transpiling. One of the ways to do that is via webpack.

So you have just initialized a new bot. How can you make it transpiled via webpack?

Firstly, you will need to install the required dependencies into the project:
```js
yarn add --dev babel-core babel-loader babel-preset-latest webpack@4 webpack-node-externals
```

Next, you need to add a webpack config file (`webpack.config`). It will need to look something like this:

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

Now that you have a `webpack.config` file you need to update your `package.json` with 2 scripts that compile your app and change the entry-point of the app:

```json
  "main": "bin/node.bundle.js",
  "scripts": {
    // ...
    "watch": "node webpack.js --watch",
    "compile": "node webpack.js --compile"
  },
```

Finally, you need to change the file path JSDocs uses as it now needs to be relevantly to the `/bin` directory. 
Update your `src/custom.js` to look like this:

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

To compile your bot and start the server, run `yarn compile && yarn start`. To watch the files in the project for changes and rebuild the bot, run `yarn watch` instead.

> Note: Should you get an error, please search our [forum](https://help.botpress.io/) to see if anyone has had a similar problem and ask for help from the community.
