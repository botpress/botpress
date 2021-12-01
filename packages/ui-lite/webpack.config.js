process.traceDeprecation = true

const chalk = require('chalk')
const webpack = require('webpack')
const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'
const moment = require('moment')
const FileManagerPlugin = require('filemanager-webpack-plugin')

const config = {
  cache: false,
  mode: isProduction ? 'production' : 'development',
  bail: true,
  devtool: process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map',
  entry: ['./src/index.tsx'],
  output: {
    path: path.resolve(__dirname, './public/js'),
    publicPath: 'assets/ui-lite/public/js/',
    filename: '[name].[chunkhash].js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      common: path.resolve(__dirname, '../bp/dist/common')
    }
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        extractComments: false
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
  externals: {},
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      hash: true,
      template: './src/index.html',
      filename: '../index.html'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new FileManagerPlugin({
      onStart: {
        delete: ['public']
      },
      onEnd: [
        {
          delete: [path.resolve(__dirname, '../bp/dist/ui-lite/public')]
        },
        {
          copy: [
            {
              source: 'public',
              destination: path.resolve(__dirname, '../bp/dist/ui-lite/public')
            }
          ]
        }
      ]
    })
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
      {
        test: require.resolve('react'),
        loader: 'expose-loader',
        options: {
          exposes: ['React']
        }
      },
      {
        test: require.resolve('react-dom'),
        loader: 'expose-loader',
        options: {
          exposes: ['ReactDOM']
        }
      },
      {
        test: /\.js$/i,
        include: [
          path.resolve(__dirname, 'src'),
          // Common files must be transpiled to avoid issues with IE11
          path.resolve(__dirname, '../bp/dist/common'),
          // Ensure that all dependencies of ui-lite are polyfilled
          path.resolve(__dirname, '../../node_modules/')
        ],
        use: [
          {
            loader: 'thread-loader'
          },
          {
            loader: 'babel-loader',
            options: {
              presets: [
                require.resolve('babel-preset-stage-3'),
                [
                  require.resolve('babel-preset-env'),
                  {
                    targets: {
                      browsers: ['last 2 versions']
                    }
                  }
                ],
                require.resolve('babel-preset-react')
              ],
              plugins: [
                require.resolve('babel-plugin-transform-class-properties'),
                require.resolve('babel-plugin-transform-es2015-arrow-functions'),
                require.resolve('babel-plugin-transform-object-rest-spread')
              ],
              compact: true,
              babelrc: false,
              cacheDirectory: true
            }
          }
        ]
      }
    ]
  }
}

if (process.argv.find(x => x.toLowerCase() === '--analyze')) {
  config.plugins.push(new BundleAnalyzerPlugin())
}

const compiler = webpack(config)

compiler.hooks.done.tap('ExitCodePlugin', stats => {
  const errors = stats.compilation.errors
  if (errors && errors.length && process.argv.indexOf('--watch') === -1) {
    for (const e of errors) {
      console.error(e.message)
    }
    console.error('Webpack build failed')
    process.exit(1)
  }
})

const postProcess = (err, stats) => {
  if (err) {
    throw err
  }

  console.log(`[${moment().format('HH:mm:ss')}] Shared ${chalk.grey(stats.toString('minimal'))}`)
}
if (process.argv.indexOf('--compile') !== -1) {
  compiler.run(postProcess)
} else if (process.argv.indexOf('--watch') !== -1) {
  compiler.watch(
    {
      ignored: ['*', /!.\/src/]
    },
    postProcess
  )
}

module.exports = { web: config }
