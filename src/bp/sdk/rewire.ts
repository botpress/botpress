import Module from 'module'
import syspath from 'path'

const originalRequire = Module.prototype.require

function addToNodePath(path) {
  const currentPath = process.env.NODE_PATH || ''

  process.env.NODE_PATH = currentPath
    .split(syspath.delimiter)
    .filter(Boolean)
    .concat(path)
    .join(syspath.delimiter)
  ; (Module as any)._initPaths()
}

global.addToNodePath = addToNodePath

addToNodePath(syspath.resolve(__dirname, '../')) // 'bp/' directory

Module.prototype.require = function() {
  if (arguments && arguments[0] === 'botpress/sdk') {
    return originalRequire.apply(this, ['core/sdk_impl'])
  }
  return originalRequire.apply(this, arguments)
}
