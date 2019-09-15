const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

module.exports = function override(config, env) {
  config.resolve.alias['common'] = path.join(__dirname, '../../../out/bp/common')
  config.resolve.alias['~'] = path.join(__dirname, './src')
  config.resolve.plugins = config.resolve.plugins.filter(p => !p instanceof ModuleScopePlugin)
  config.devtool = process.argv.find(x => x.toLowerCase() === '--nomap') ? false : 'source-map'

  return config
}
