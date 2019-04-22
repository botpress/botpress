import CleanWebpackPlugin from 'clean-webpack-plugin'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import webpack from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

import { debug, error, normal } from './log'

const libraryTarget = mod => `botpress = typeof botpress === "object" ? botpress : {}; botpress["${mod}"]`

export function config(projectPath) {
  const packageJson = require(path.join(projectPath, 'package.json'))

  const full: webpack.Configuration = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map',
    entry: ['./src/views/full/index.jsx'],
    output: {
      path: path.resolve(projectPath, './assets/web'),
      publicPath: '/js/modules/',
      filename: 'full.bundle.js',
      libraryTarget: 'assign',
      library: libraryTarget(packageJson.name)
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-bootstrap': 'ReactBootstrap'
    },
    resolveLoader: {
      modules: ['node_modules', path.resolve(projectPath, './node_modules/module-builder/node_modules')]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    plugins: [new CleanWebpackPlugin()],
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env'], '@babel/preset-typescript', '@babel/preset-react'],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-syntax-function-bind',
                '@babel/plugin-proposal-function-bind'
              ]
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
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: packageJson.name + '__[name]__[local]___[hash:base64:5]'
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
          test: /font.*\.(woff|woff2|svg|eot|ttf)$/,
          use: { loader: 'file-loader', options: { name: '../fonts/[name].[ext]' } }
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          use: [{ loader: 'file-loader', options: { name: '[name].[hash].[ext]' } }]
        }
      ]
    }
  }

  if (process.argv.find(x => x.toLowerCase() === '--analyze')) {
    full.plugins.push(new BundleAnalyzerPlugin())
  }

  if (packageJson.webpack) {
    _.merge(full, packageJson.webpack)
  }

  const lite: webpack.Configuration = Object.assign({}, full, {
    entry: ['./src/views/lite/index.jsx'],
    output: {
      path: path.resolve(projectPath, './assets/web'),
      publicPath: '/js/lite-modules/',
      filename: 'lite.bundle.js',
      libraryTarget: 'assign',
      library: libraryTarget(packageJson.name)
    },
    plugins: [] // We clear the plugins here, since the cleanup is already done by the "full" view
  })

  const webpackFile = path.join(projectPath, 'webpack.frontend.js')
  if (fs.existsSync(webpackFile)) {
    debug('Webpack override found for frontend')
    return require(webpackFile)({ full, lite })
  }

  return [full, lite]
}

function writeStats(err, stats, exitOnError = true) {
  if (err || stats.hasErrors()) {
    error(stats.toString('minimal'))

    // @deprecated : This warning should be removed next major version
    console.error(`
There was a breaking change in how module views are handled in Botpress 11.6
Web bundles and liteViews were replaced by a more standardized method.

Please check our migration guide here: https://botpress.io/docs/developers/migrate/
`)

    if (exitOnError) {
      return process.exit(1)
    }
  }

  for (const child of stats.toJson().children) {
    normal(`Generated frontend bundle (${child.time} ms)`)
  }
}

export function watch(projectPath: string) {
  const confs = config(projectPath)
  const compiler = webpack(confs)
  compiler.watch({}, (err, stats) => writeStats(err, stats, false))
}

export function build(projectPath: string) {
  const confs = config(projectPath)
  webpack(confs, (err, stats) => writeStats(err, stats, true))
}
