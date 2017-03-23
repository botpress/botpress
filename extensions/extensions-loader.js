const { requireExtension } = require('./extensions')

module.exports = function(source) {
  const length = '/extensions/lite/'.length

  const start = this.resourcePath.indexOf('/extensions/lite/')
  const file = this.resourcePath.substr(start + length)
  console.log(this.resourcePath, file)
  return requireExtension(file)
}
