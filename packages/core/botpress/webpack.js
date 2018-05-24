process.traceDeprecation = true

const chalk = require('chalk')
const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

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
              presets: ['stage-3', ['env', { targets: { node: '6.10' } }], 'react'],
              plugins: ['transform-class-properties']
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  }
}

const webConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  bail: true,
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  entry: {
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
      '~': path.resolve(__dirname, './src/web')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: process.env.NODE_ENV === 'production' ? JSON.stringify('production') : JSON.stringify('development')
      }
    }),
    new UglifyJSPlugin({ sourceMap: true, cache: true }),
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
  },
  optimization: {
    noEmitOnErrors: true
  }
}

const showNodeEnvWarning = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      chalk.yellow('WARNING: You are currently building Botpress in development; NOT generating a production build')
    )
    console.log(chalk.yellow('Run with NODE_ENV=production to create a production build instead'))
  }
}

const compiler = webpack([webConfig, nodeConfig])
const postProcess = (err, stats) => {
  if (err) {
    throw err
  }
  console.log(chalk.grey(stats.toString('minimal')))
}

if (process.argv.indexOf('--compile') !== -1) {
  showNodeEnvWarning()
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(null, postProcess)
}

module.exports = { web: webConfig, node: nodeConfig }
