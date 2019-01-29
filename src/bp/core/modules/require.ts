import fs from 'fs'
import _ from 'lodash'
import path from 'path'

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

export const requireAtPaths = (module: string, locations: string[]) => {
  const folders = _.flatten(locations.map(explodePath))
  const lookups = _.flatten(
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

  for (const loc of lookups) {
    try {
      if (['.js', '.json'].includes(path.extname(loc))) {
        if (!fs.existsSync(loc)) {
          continue
        }
        return require(loc)
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
        return require(pkgEntry)
      }
    } catch (err) {}
  }

  try {
    return require(module)
  } catch (err) {
    throw new Error(`Module "${module}" not found. Tried these locations: "${locations.join(', ')}"`)
  }
}
