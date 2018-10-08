import Module from 'module'
import syspath from 'path'

const originalRequire = Module.prototype.require
const nativeBindingsPath = syspath.resolve(syspath.dirname(process.execPath), 'bindings')
const nativeExtensions = ['node_sqlite3.node', 'fse.node']

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

Module.prototype.require = function(mod) {
  if (mod === 'botpress/sdk') {
    return originalRequire.apply(this, ['core/sdk_impl'])
  }

  if (process.pkg && mod.endsWith('.node')) {
    const ext = syspath.basename(mod)
    const newPath = syspath.join(nativeBindingsPath, ext)
    if (nativeExtensions.includes(ext)) {
      return originalRequire.apply(this, [newPath])
    }
  }

  return originalRequire.apply(this, arguments)
}
