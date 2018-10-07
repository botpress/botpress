import { ConfigurationError } from 'errors'
import fs from 'fs'

import path from 'path'

import { unpack } from './unpacker'

const lookupPaths: string[] = []

if (process.pkg) {
  // Running botpress in packages mode
  lookupPaths.push(process.cwd() + '/modules')
}

if (process.env.BP_MODULES_PATH) {
  lookupPaths.push(process.env.BP_MODULES_PATH)
}

if (process.env.BP_PATH) {
  lookupPaths.push(process.env.BP_PATH + '/modules')
}

// Check env variables (are we developing? BP_PATH different)

/** Makes path with forward slashes work on all OS */
const fixPathForOS = p => p.replace(/\/\//g, '/').replace(/\//g, path.sep)

/**
 * Resolves the real absolute path of a module from a path defined in [`botpress.config.json`]{@see BotpressConfig}
 * @private
 * @param modulePath The module path to load, which may be pointing to a TGZ file or a folder and may also contain variables like {{MODULES_ROOT}}
 */
export async function resolve(modulePath: string) {
  const paths = lookupPaths.reduce((arr: string[], lp?: string) => {
    const item = modulePath.replace('MODULES_ROOT', lp!)
    arr.push(fixPathForOS(item))
    arr.push(fixPathForOS(item + '.tgz'))
    return arr
  }, [])

  for (const p of paths) {
    if (!fs.existsSync(p)) {
      continue
    }

    if (fs.statSync(p).isDirectory()) {
      addToNodePath(path.resolve(p, 'node_modules'))
      return p
    }

    if (!p.endsWith('.tgz')) {
      throw new ConfigurationError(`The file at "${p}" is not a .tgz file`)
    }

    const finalDestination = await unpack(p)
    const nodeProductionModuleDir = path.resolve(finalDestination, 'node_production_modules')
    const nodeModuleDir = path.resolve(finalDestination, 'node_modules')

    if (fs.existsSync(nodeProductionModuleDir)) {
      addToNodePath(nodeProductionModuleDir)
    }

    if (fs.existsSync(nodeModuleDir)) {
      addToNodePath(nodeModuleDir)
    }

    return finalDestination
  }

  throw new ConfigurationError(`Could not find module at path "${modulePath}"`)
}
