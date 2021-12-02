const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const { createProxyMiddleware } = require('http-proxy-middleware')

const isProductionBuild = process.argv.includes('--prod')
const noMap = process.argv.find(x => x.toLowerCase() === '--nomap')

module.exports = {
  webpack: (config, env) => {
    config.resolve.alias['common'] = path.join(__dirname, '../bp/dist/common')
    config.resolve.alias['~'] = path.join(__dirname, './src')
    config.resolve.alias['botpress/shared'] = '@botpress/ui-shared'
    config.resolve.plugins = config.resolve.plugins.filter(p => !p instanceof ModuleScopePlugin)
    config.devtool = isProductionBuild || noMap ? false : 'source-map'

    config.infrastructureLogging = { level: 'error' }

    config.plugins.push(
      new FileManagerPlugin({
        events: {
          onEnd: [
            {
              delete: [{ source: path.resolve(__dirname, '../bp/dist/admin/ui/public'), options: { force: true } }]
            },
            {
              copy: [
                {
                  source: 'dist',
                  destination: path.resolve(__dirname, '../bp/dist/admin/ui/public')
                }
              ]
            }
          ]
        }
      })
    )

    const oneOfConfigIdx = config.module.rules.findIndex(x => x.oneOf)

    // Override the CSS generation so we have .d.ts files for scss
    config.module.rules[oneOfConfigIdx].oneOf = [
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-modules-typescript-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]___[hash:base64:5]'
              },
              url: false,
              importLoaders: 1
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      ...config.module.rules[oneOfConfigIdx].oneOf
    ]

    // Configuration works for react and react-dom, but @blueprintjs still needs a special handling to make it work
    config.module.rules = [
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
        test: require.resolve('@botpress/ui-shared'),
        loader: 'expose-loader',
        options: {
          exposes: ['BotpressShared']
        }
      },
      ...config.module.rules
    ]

    /**
     * A bit counter-intuitive, but you don't want it when using the dev server (env === development)
     * and you don't want it when building the final release (isProductionBuild).
     * But, you want it when developing locally and building the whole project (env === production / isProductionBuild = false)
     */
    if (env !== 'development' && !isProductionBuild) {
      config.plugins.push(
        new HardSourceWebpackPlugin({
          info: {
            mode: 'none',
            level: 'debug'
          }
        })
      )
    }

    return config
  },
  devServer: configFunction => {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost)
      const target = 'http://localhost:3000'

      config.before = app => {
        app.use('/studio/:botId', (req, res) => res.redirect(`${target}/studio/${req.params.botId}`))

        const proxyPaths = ['/assets', '/lite', '/api', '/admin/env.js']
        proxyPaths.forEach(path => app.use(path, createProxyMiddleware({ target })))

        app.use(createProxyMiddleware('/socket.io', { target, ws: true, changeOrigin: true }))
      }

      config.after = app => {
        app.use('*', createProxyMiddleware({ target }))
      }

      return config
    }
  }
}
