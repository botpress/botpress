import fs from 'fs'
import _ from 'lodash'
import Module from 'module'
import path from 'path'

let requireCache = {}
const getRequireCacheKey = (scriptPath, module) => `req-${scriptPath}_${module}`

// Clears index.js from cache & all its dependencies recursively, stopping after this number of iterations
const MAX_CHILD_DEPS_LEVEL = 3

export const explodePath = (location: string): string[] => {
  const parts: string[] = location.split(path.sep)
  const paths: string[] = []
  const abs = path.isAbsolute(location)

  const push = p => {
    paths.push(abs ? path.resolve('/', p) : p)
  }

  for (let i = 0; i < parts.length; i++) {
    const folder = path.join(...parts.slice(0, i + 1))
    push(path.join(folder, 'node_modules'))
    push(path.join(folder, 'node_production_modules'))
    if (i === parts.length - 1) {
      push(folder)
    }
  }

  return paths.reverse()
}

export const requireFromString = (code: string, moduleName: string, parentScript: string, _require: any) => {
  const requireKey = getRequireCacheKey(parentScript, moduleName)

  const mod = new Module(moduleName, undefined)
  mod.require = _require
  // @ts-ignore
  mod._compile(code, moduleName)

  return (requireCache[requireKey] = mod.exports)
}

export const requireAtPaths = (module: string, locations: string[], scriptPath?: string) => {
  const requireKey = getRequireCacheKey(scriptPath, module)

  if (requireCache[requireKey] && scriptPath) {
    return requireCache[requireKey]
  }

  const lookups = buildLookupPaths(module, locations)

  for (const loc of lookups) {
    try {
      if (['.js', '.json'].includes(path.extname(loc))) {
        if (!fs.existsSync(loc)) {
          continue
        }
        return (requireCache[requireKey] = require(loc))
      } else {
        // package.json
        const pkgPath = path.join(loc, 'package.json')
        if (!fs.existsSync(pkgPath)) {
          continue
        }
        const pkg = require(pkgPath)
        if (!pkg.main) {
          continue
        }
        const pkgEntry = path.join(loc, pkg.main)
        return (requireCache[requireKey] = require(pkgEntry))
      }
    } catch (err) {}
  }

  try {
    return (requireCache[requireKey] = require(module))
  } catch (err) {
    throw new Error(`Module "${module}" not found. Tried these locations: "${locations.join(', ')}"`)
  }
}

export const clearRequireCache = () => {
  requireCache = {}
}

export const buildLookupPaths = (module: string, locations: string[]) => {
  const folders = _.flatten(locations.map(explodePath))

  return _.flatten(
    folders.map(folder => {
      const paths = [
        path.join(folder, module + '.js'),
        path.join(folder, module),
        path.join(folder, module, 'index.js')
      ]
      if (path.basename(folder) === module) {
        paths.unshift(path.join(folder, 'index.js'))
      }
      return paths
    })
  )
}

export const clearModuleScriptCache = (moduleLocation: string, depth: number = 0) => {
  const cacheKey = require.resolve(moduleLocation)
  const file = require.cache[cacheKey]

  if (file) {
    for (const { filename } of file.children) {
      // Circular reference protection, we only unload the user's module files
      if (depth < MAX_CHILD_DEPS_LEVEL && !filename.includes('node_modules')) {
        clearModuleScriptCache(filename, depth++)
      }
    }

    DEBUG('cache')(`Clear cached file ${cacheKey}`)
    delete require.cache[cacheKey]
  }
}
