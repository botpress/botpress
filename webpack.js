const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

const ExtensionsPlugin = require('./extensions/extensions-plugin')

const nodeConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',
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
              presets: ['stage-3', ['env', { targets: { node: '6.10' } }], 'react'],
              plugins: ['transform-class-properties']
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

const webConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  bail: true,
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
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
        NODE_ENV: process.env.NODE_ENV === 'production' ? JSON.stringify('production') : JSON.stringify('development')
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
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        exclude: /node_modules/i,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['stage-3', ['env', { targets: { browsers: ['last 2 versions'] } }], 'react'],
            plugins: ['transform-class-properties'],
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

const showNodeEnvWarning = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('*****')
    console.log('WARNING: You are currently building Botpress in development; NOT generating a production build')
    console.log('Run with NODE_ENV=production to create a production build instead')
    console.log('*****')
  }
}

const compiler = webpack([webConfig, nodeConfig])
const postProcess = (err, stats) => {
  if (err) {
    throw err
  }
  console.log(stats.toString('minimal'))
}

if (process.argv.indexOf('--compile') !== -1) {
  showNodeEnvWarning()
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}

const runCompiler = function(cb) {
  showNodeEnvWarning()
  compiler.run(function(err, stats) {
    postProcess(err, stats)
    cb()
  })
}

module.exports = { web: webConfig, node: nodeConfig, run: runCompiler }
