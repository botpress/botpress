const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const pkg = require('./package.json')
const path = require('path')

const nodeConfig = {
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

const webConfig = {
  devtool: 'source-map',
  entry: ['./src/views/index.jsx'],
  output: {
    path: path.resolve(__dirname, './bin'),
    publicPath: '/js/modules/',
    filename: 'web.bundle.js',
    libraryTarget: 'assign',
    library: ['botpress', pkg.name]
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-bootstrap': 'ReactBootstrap',
    'prop-types': 'PropTypes'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          query: {
            presets: ['latest', 'stage-0', 'react'],
            plugins: ['transform-object-rest-spread', 'transform-decorators-legacy']
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            query: {
              modules: true,
              importLoaders: 1,
              localIdentName: pkg.name + '__[name]__[local]___[hash:base64:5]'
            }
          },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      },
      {
        test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        use: { loader: 'file-loader', query: { name: '../fonts/[name].[ext]' } }
      }
    ]
  }
}

const compiler = webpack([nodeConfig, webConfig])
const postProcess = function(err, stats) {
  if (err) throw err
  console.log(stats.toString('minimal'))
}

if (process.argv.indexOf('--compile') !== -1) {
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}

module.exports = {
  web: webConfig,
  node: nodeConfig
}
