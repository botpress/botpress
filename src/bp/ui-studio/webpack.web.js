process.traceDeprecation = true

const chalk = require('chalk')
const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'

const webConfig = {
  cache: false,
  mode: isProduction ? 'production' : 'development',
  bail: true,
  devtool: process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map',
  entry: {
    web: './src/web/index.jsx',
    lite: './src/web/lite.jsx'
  },
  output: {
    path: path.resolve(__dirname, './public/js'),
    publicPath: '/assets/ui-studio/public/js/',
    filename: '[name].[chunkhash].js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css'],
    alias: {
      '~': path.resolve(__dirname, './src/web'),
      DOCS: path.resolve(__dirname, '../../../docs/guide/docs'),
      common: path.resolve(__dirname, '../../../out/bp/common')
    }
  },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        sourceMap: true,
        cache: true
      })
    ],
    splitChunks: {
      chunks: 'async',
      minChunks: 2,
      automaticNameDelimiter: '~',
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minSize: 0
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    },
    occurrenceOrder: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      hash: true,
      template: './src/web/index.html',
      filename: '../index.html',
      chunks: ['commons', 'web']
    }),
    new HtmlWebpackPlugin({
      inject: true,
      hash: true,
      template: './src/web/lite.html',
      filename: '../lite/index.html',
      chunks: ['commons', 'lite']
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isProduction ? JSON.stringify('production') : JSON.stringify('development')
      }
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './src/web/img'),
        to: path.resolve(__dirname, './public/img')
      },
      {
        from: path.resolve(__dirname, './src/web/audio'),
        to: path.resolve(__dirname, './public/audio')
      },
      {
        from: path.resolve(__dirname, './src/web/external'),
        to: path.resolve(__dirname, './public/external')
      },
      {
        from: path.resolve(__dirname, '../../../docs/guide/docs/assets'),
        to: path.resolve(__dirname, './public/external/docs')
      }
    ]),
    new CleanWebpackPlugin(['public'])
  ],

  module: {
    rules: [
      {
        test: /\.md$/,
        use: [
          {
            loader: 'raw-loader'
          }
        ]
      },
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
        test: /\.styl$/,
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
          { loader: 'stylus-loader' }
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
