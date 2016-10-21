var fs = require('fs')
var path = require('path')

if(fs.existsSync(path.join(__dirname, 'src'))) {
  module.exports = require(path.join(__dirname, 'src/skin'))
} else {
  module.exports = require(path.join(__dirname, 'lib/skin'))
}
