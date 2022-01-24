const nativeExtensions = ['node_sqlite3.node', 'fse.node']

module.exports = (name, options) => {
  // a popular convention among "isomorphic" libraries is to name their different implementation lib.browser.js and lib.node.js
  // requiring ./lib.node would fail without the native ext check
  if (nativeExtensions.some(next => name.includes(next))) {
    try {
      return global.rewire(name)
    } catch (err) {
      return options.defaultResolver(name, options)
    }
  }

  return options.defaultResolver(name, options)
}
