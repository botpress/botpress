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

  const getEntryPoint = view => {
    const isTs = fs.existsSync(path.join(projectPath, `./src/views/${view}/index.tsx`))
    return `./src/views/${view}/index.${isTs ? 'tsx' : 'jsx'}`
  }

  const full: webpack.Configuration = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map',
    entry: [getEntryPoint('full')],
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
      'react-bootstrap': 'ReactBootstrap',
      '@blueprintjs/core': 'BlueprintJsCore',
      '@blueprintjs/select': 'BlueprintJsSelect',
      'botpress/ui': 'BotpressUI',
      'botpress/content-picker': 'BotpressContentPicker',
      'botpress/documentation': 'DocumentationProvider',
      'botpress/utils': 'BotpressUtils',
      'botpress/shared': 'BotpressShared'
    },
    resolveLoader: {
      modules: [path.resolve(__dirname, '../node_modules'), 'node_modules']
    },
    resolve: {
      alias: {
        common: path.resolve(__dirname, '../../../packages/bp/dist/common')
      },
      modules: ['node_modules', path.resolve(__dirname, '../../../packages/ui-shared/node_modules')],
      extensions: ['.js', '.jsx', '.tsx', '.ts']
    },
    plugins: [new CleanWebpackPlugin()],
    module: {
      rules: [
        { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
        {
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader',
            options: {
              cwd: path.resolve(__dirname, '..'),
              presets: [['@babel/preset-env'], '@babel/preset-typescript', '@babel/preset-react'],
              plugins: [
                ['@babel/plugin-proposal-decorators', { legacy: true }],
                ['@babel/plugin-proposal-class-properties'],
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
            { loader: 'css-modules-typescript-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: `${packageJson.name}__[name]__[local]___[hash:base64:5]`
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

  if (process.argv.find(x => x.toLowerCase() === '--analyze-full')) {
    full.plugins!.push(new BundleAnalyzerPlugin())
  }

  if (packageJson.webpack) {
    _.merge(full, packageJson.webpack)
  }

  const lite: webpack.Configuration = Object.assign({}, full, {
    entry: [getEntryPoint('lite')],
    output: {
      path: path.resolve(projectPath, './assets/web'),
      publicPath: '/js/lite-modules/',
      filename: 'lite.bundle.js',
      libraryTarget: 'assign',
      library: libraryTarget(packageJson.name)
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM'
    },
    plugins: [] // We clear the plugins here, since the cleanup is already done by the "full" view
  })

  if (process.argv.find(x => x.toLowerCase() === '--analyze-lite')) {
    lite.plugins!.push(new BundleAnalyzerPlugin())
  }

  const webpackFile = path.join(projectPath, 'webpack.frontend.js')
  if (fs.existsSync(webpackFile)) {
    debug('Webpack override found for frontend', path.basename(projectPath))
    return require(webpackFile)({ full, lite })
  }

  return [full, lite]
}

function writeStats(err, stats, exitOnError = true, callback?, moduleName?: string) {
  if (err || stats.hasErrors()) {
    error(stats.toString('minimal'), moduleName)

    if (exitOnError) {
      return process.exit(1)
    }
  }

  for (const child of stats.toJson().children) {
    normal(`Generated frontend bundle (${child.time} ms)`, moduleName)
  }

  callback?.()
}

export function watch(projectPath: string) {
  const confs = config(projectPath)
  const compiler = webpack(confs)
  compiler.watch({}, (err, stats) => writeStats(err, stats, false, undefined, path.basename(projectPath)))
}

export async function build(projectPath: string): Promise<void> {
  const confs = config(projectPath)

  await new Promise(resolve => {
    webpack(confs, (err, stats) => writeStats(err, stats, true, resolve, path.basename(projectPath)))
  })
}
