import sysfs from 'fs'
import _ from 'lodash'
import Module from 'module'
import os from 'os'
import syspath from 'path'

const originalRequire = Module.prototype.require
const platformFolders: string[] = []
const nativeBindingsPaths: string[] = []

const nativeExBaseFolder =
  (process.core_env.NATIVE_EXTENSIONS_DIR && syspath.resolve(process.core_env.NATIVE_EXTENSIONS_DIR)) ||
  (process.pkg
    ? syspath.resolve(syspath.dirname(process.execPath), 'bindings')
    : syspath.resolve(process.PROJECT_LOCATION, '../../build/native-extensions'))

if (process.distro.os === 'linux') {
  platformFolders.push('linux/default')

  try {
    const fullDist = _.last(process.distro.toString().split(' '))!
    const smallDist = fullDist.split('_')[0]

    const folders = sysfs
      .readdirSync(syspath.resolve(nativeExBaseFolder, './linux/'))
      .filter(x => x.startsWith(smallDist))
      .sort()
      .reverse()

    const nearestDistro = _.find(folders, f => f <= fullDist) || _.first(folders)
    nearestDistro && platformFolders.unshift('linux/' + nearestDistro)
  } finally {
  }
} else if (os.platform() === 'win32') {
  platformFolders.push('windows/all')
} else if (os.platform() === 'darwin') {
  platformFolders.push('darwin/all')
} else {
  throw new Error(`Unsupported OS "${process.distro}"`)
}

for (const folder of platformFolders) {
  nativeBindingsPaths.push(syspath.resolve(nativeExBaseFolder, folder))
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
    if (nativeExtensions.includes(ext)) {
      const newPaths = nativeBindingsPaths.map(x => syspath.join(x, ext))
      for (const newPath of newPaths) {
        try {
          return originalRequire.apply(this, [newPath])
        } catch (err) {
          /* Swallow error, try next one */
        }
      }
      throw new Error(
        `Could not require NativeExtension "${ext}" for OS "${
          process.distro
        }". Tried the following paths: [ ${newPaths.join(', ')} ]`
      )
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
