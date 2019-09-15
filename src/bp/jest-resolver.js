const { default: defaultResolver } = require('jest-resolve/build/defaultResolver')

module.exports = (name, options) => {
  if (name.indexOf('.node') > 0) {
    try {
      return global.rewire(name)
    } catch (err) {
      return defaultResolver(name, options)
    }
  }

  return defaultResolver(name, options)
}
