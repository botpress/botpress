process.traceDeprecation = true

const chalk = require('chalk')
const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'

const productionPlugins = () =>
  isProduction
    ? [
        new UglifyJSPlugin({
          sourceMap: true,
          cache: true
        })
      ]
    : []

const webConfig = {
  mode: isProduction ? 'production' : 'development',
  bail: true,
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  entry: {
    web: './src/web/index.jsx',
    lite: './src/web/lite.jsx'
  },
  output: {
    path: path.resolve(__dirname, './lib/web/js'),
    publicPath: '/js/',
    filename: '[name].[chunkhash].js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css'],
    alias: {
      '~': path.resolve(__dirname, './src/web')
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      minChunks: 1,
      automaticNameDelimiter: '~',
      name: 'commons',
      filename: 'commons.js',
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          test: path.resolve(__dirname, 'node_modules'),
          name: 'commons',
          enforce: true
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      hash: true,
      template: './src/web/index.html',
      filename: '../index.html'
    }),
    new HtmlWebpackPlugin({
      inject: false,
      hash: true,
      template: './src/web/lite.html',
      filename: '../lite/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isProduction ? JSON.stringify('production') : JSON.stringify('development')
      }
    }),
    ...productionPlugins(),
    new CopyWebpackPlugin([
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
        include: path.resolve(__dirname, 'src/web'),
        use: [
          { loader: 'thread-loader' },
          {
            loader: 'babel-loader',
            options: {
              presets: ['stage-3', ['env', { targets: { browsers: ['last 2 versions'] } }], 'react'],
              plugins: ['transform-class-properties'],
              compact: true,
              babelrc: false,
              cacheDirectory: true
            }
          }
        ]
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
  if (!isProduction) {
    console.log(
      chalk.yellow('WARNING: You are currently building Botpress in development; NOT generating a production build')
    )
    console.log(chalk.yellow('Run with NODE_ENV=production to create a production build instead'))
  }
}

const compiler = webpack(webConfig)
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
  compiler.watch(
    {
      ignored: ['*', /!.\/src\/web/]
    },
    postProcess
  )
}

module.exports = { web: webConfig }
