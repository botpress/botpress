const path = require('path')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
const isProduction = process.argv.indexOf('--compile') !== -1

const config = {
  mode: isProduction ? 'production' : 'development',
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
  node: {
    __dirname: false
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          query: {
            presets: ['latest', 'stage-0'],
            plugins: ['transform-object-rest-spread']
          }
        },
        exclude: /node_modules/
      }
    ]
  }
}

const compiler = webpack(config)
const postProcess = function(err, stats) {
  if (err) {
    throw err
  }

  console.log(stats.toString('minimal'))
}

if (isProduction) {
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}
