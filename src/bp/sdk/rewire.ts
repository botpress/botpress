import _ from 'lodash'
import Module from 'module'
import syspath from 'path'

const originalRequire = Module.prototype.require
let nativeBindingsPath = syspath.resolve(syspath.dirname(process.execPath), 'bindings')

if (!process.pkg) {
  const platformFolder = { win32: 'windows' }[process.platform] || process.platform
  const nativeExFolder =
    process.env.NATIVE_EXTENSIONS_DIR || syspath.resolve(process.PROJECT_LOCATION, '../../build/native-extensions')
  nativeBindingsPath = syspath.resolve(nativeExFolder, platformFolder)
}

const nativeExtensions = ['node_sqlite3.node', 'fse.node', 'crfsuite.node', 'fasttext.node']

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

  if (mod.endsWith('.node')) {
    if (mod.startsWith('!')) {
      return originalRequire.apply(this, [mod.substr(1)])
    }
    const ext = syspath.basename(mod)
    const newPath = syspath.join(nativeBindingsPath, ext)
    if (nativeExtensions.includes(ext)) {
      return originalRequire.apply(this, [newPath])
    }
  }

  return originalRequire.apply(this, arguments)
}

/*
----------------------
  Performance monitoring instrumentation code
  Will output the most expensive require resolutions to the console
  Usage: set `BP_DEBUG_REQUIRE` to `true`
------------------------
*/

if (global.process.env.BP_DEBUG_REQUIRE) {
  const { performance, PerformanceObserver } = require('perf_hooks')
  const os = require('os')

  const SAMPLING_INTERVAL = 5000
  const TOP_COUNT = 10

  Module.prototype.require = performance.timerify(Module.prototype.require)
  require = performance.timerify(require)

  let allRequires: { duration: Number; call: string }[] = []

  const obs = new PerformanceObserver(list => {
    const entries = list.getEntries()
    entries.forEach(e => allRequires.push({ duration: e.duration, call: e[0] }))
  })

  obs.observe({ entryTypes: ['function'], buffered: true })

  setInterval(() => {
    const significantCalls = _.take(_.orderBy(allRequires, 'duration', 'desc'), TOP_COUNT)
    const formattedCalls = significantCalls.map((x, i) => `${i}) ${x.duration}\t\t${x.call}`).join(os.EOL)
    console.log(formattedCalls)
    allRequires = []
  }, SAMPLING_INTERVAL)
}
