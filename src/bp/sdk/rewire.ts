import _ from 'lodash'
import Module from 'module'
import syspath from 'path'

const originalRequire = Module.prototype.require
const nativeBindingsPath = syspath.resolve(syspath.dirname(process.execPath), 'bindings')
const nativeExtensions = ['node_sqlite3.node', 'fse.node']

function addToNodePath(path) {
  overwritePaths(getPaths().concat(path))
}

function reloadPaths() {
  (Module as any)._initPaths()
}

function getPaths(): string[] {
  const currentPath = process.env.NODE_PATH || ''
  return currentPath
    .split(syspath.delimiter)
    .filter(Boolean)
    .map(x => x.trim())
}

function overwritePaths(paths: string[]) {
  process.env.NODE_PATH = _.uniq(paths).join(syspath.delimiter)
  reloadPaths()
}

global.require = {
  addToNodePath,
  getPaths,
  overwritePaths
}

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
