const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const isProductionBuild = process.argv.includes('--prod')

module.exports = function override(config, env) {
  config.resolve.alias['common'] = path.join(__dirname, '../../../../out/bp/common')
  config.resolve.alias['~'] = path.join(__dirname, './src')
  config.resolve.alias['botpress/shared'] = 'ui-shared'
  config.resolve.plugins = config.resolve.plugins.filter(p => !p instanceof ModuleScopePlugin)
  config.devtool = process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map'

  // webpack.config.js

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
}
