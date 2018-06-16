const nodeExternals = require('webpack-node-externals')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const isProduction = process.env.NODE_ENV === 'production'

const nodeConfig = {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  entry: [path.resolve(__dirname, './index.js')],
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'node.bundle.js',
    libraryTarget: 'commonjs2',
    publicPath: __dirname
  },
  externals: [nodeExternals()],
  target: 'node',
  node: {
    __dirname: false
  },

  resolve: {
    extensions: ['.js'],
    alias: {
      '~': path.resolve(__dirname, './src')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['stage-3', ['env', { targets: { node: '8.9' } }]],
              plugins: ['transform-class-properties']
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  }
}

const showNodeEnvWarning = () => {
  if (!isProduction) {
    console.log(
      chalk.yellow('WARNING: You are currently building Botpress in development; NOT generating a production build')
    )
    console.log(chalk.yellow('Run with NODE_ENV=production to create a production build instead'))
  }
}

const compiler = webpack(nodeConfig)
const postProcess = (err, stats) => {
  if (err) {
    throw err
  }
  console.log(chalk.green(stats.toString('minimal')))
}

if (process.argv.indexOf('--compile') !== -1) {
  showNodeEnvWarning()
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(
    {
      ignored: ['*', /!.\/src\/*/, /.\/src\/web/]
    },
    postProcess
  )
}

module.exports = { node: nodeConfig }
