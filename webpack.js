var webpack = require('webpack')
var path = require('path')
var CopyWebpackPlugin = require('copy-webpack-plugin')
// var HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
var nodeExternals = require('webpack-node-externals')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

var ExtensionsPlugin = require('./extensions/extensions-plugin')

var nodeConfig = {
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-cheap-module-source-map',
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
      '~': path.resolve(__dirname, './src'),
      '+': path.resolve(__dirname, './extensions/lite')
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
              presets: ['latest', 'stage-0'],
              plugins: ['transform-object-rest-spread']
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    ExtensionsPlugin.beforeResolve,
    ExtensionsPlugin.afterResolve,
    new webpack.DefinePlugin({
      BP_EDITION: JSON.stringify(process.env.BOTPRESS_EDITION || 'lite')
    })
  ]
}

var webConfig = {
  bail: true,
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-cheap-module-source-map',
  entry: {
    // vendor: [ // This doesn't work with lite.bundle.js
    //   'axios',
    //   'bluebird',
    //   'howler',
    //   'knex',
    //   'lodash',
    //   'moment',
    //   'react',
    //   'react-bootstrap',
    //   'react-codemirror',
    //   'react-dom',
    //   'react-jsonschema-form'
    // ],
    web: './src/web/index.jsx',
    lite: './src/web/lite.jsx'
  },
  output: {
    path: path.resolve(__dirname, './lib/web/js'),
    publicPath: '/js/',
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css'],
    alias: {
      '~': path.resolve(__dirname, './src/web'),
      '+': path.resolve(__dirname, './extensions/lite')
    }
  },
  plugins: [
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   minChunks: Infinity
    // }),
    ExtensionsPlugin.beforeResolve,
    ExtensionsPlugin.afterResolve,
    new webpack.DefinePlugin({
      BP_EDITION: JSON.stringify(process.env.BOTPRESS_EDITION || 'lite'),
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new UglifyJSPlugin({ sourceMap: true, cache: true }),
    new webpack.NoEmitOnErrorsPlugin(),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './src/web/index.html'),
        to: path.resolve(__dirname, './lib/web/index.html')
      },
      {
        from: path.resolve(__dirname, './src/web/lite.html'),
        to: path.resolve(__dirname, './lib/web/lite/index.html')
      },
      {
        from: path.resolve(__dirname, './src/web/img'),
        to: path.resolve(__dirname, './lib/web/img')
      },
      {
        from: path.resolve(__dirname, './src/web/audio'),
        to: path.resolve(__dirname, './lib/web/audio')
      }
    ])
    // TODO: Fix caching to take into account changes to extensions and environement variables
    // new HardSourceWebpackPlugin({
    //   cacheDirectory: __dirname + '/.cache/',
    //   recordsPath: __dirname + '/.cache/records.json',
    //   environmentPaths: {
    //     root: process.cwd(),
    //     directories: ['node_modules'],
    //     files: ['package.json', 'webpack.js'],
    //   }
    // })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        exclude: /node_modules/i,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['latest', 'stage-0', 'react'],
            plugins: ['transform-object-rest-spread', 'transform-decorators-legacy'],
            compact: true,
            babelrc: false,
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          },
          { loader: 'postcss-loader' },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        use: [{ loader: 'file-loader', options: { name: '../fonts/[name].[ext]' } }]
      }
    ]
  }
}

var compiler = webpack([webConfig, nodeConfig])
var postProcess = function(err, stats) {
  if (err) {
    throw err
  }
  console.log(stats.toString('minimal'))
}

if (process.argv.indexOf('--compile') !== -1) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('*****')
    console.log('WARNING: You are currently building Botpress in development; NOT generating a production build')
    console.log('Run with NODE_ENV=production to create a production build instead')
    console.log('*****')
  }
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}

module.exports = { web: webConfig, node: nodeConfig }
