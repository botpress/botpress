var fs = require('fs')
var path = require('path')

if(fs.existsSync(path.join(__dirname, 'src/skin.js'))) {
  module.exports = require(path.join(__dirname, 'src/skin.js'))
} else {
  module.exports = require(path.join(__dirname, 'lib/skin.js'))
}
