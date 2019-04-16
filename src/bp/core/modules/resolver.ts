import { Logger, ModuleEntryPoint } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { ConfigurationError } from 'errors'
import fs from 'fs'
import { inject } from 'inversify'
import path from 'path'

import Unpacker from './unpacker'

const lookupPaths: string[] = []

if (process.pkg) {
  // Running botpress in packages mode
  lookupPaths.push(path.dirname(process.execPath) + '/modules')
}

if (process.env.BP_MODULES_PATH) {
  lookupPaths.push(...process.env.BP_MODULES_PATH.split(':'))
}

if (process.env.BP_PATH) {
  lookupPaths.push(process.env.BP_PATH + '/modules')
}

// Check env variables (are we developing? BP_PATH different)

/** Makes path with forward slashes work on all OS */
const fixPathForOS = p => p.replace(/\/\//g, '/').replace(/\//g, path.sep)

export default class ModuleResolver {
  unpacker: Unpacker

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.unpacker = new Unpacker(this.logger)
  }

  private addModuleNodePath(modulePath) {
    const nodeProductionModuleDir = path.resolve(modulePath, 'node_production_modules')
    const nodeModuleDir = path.resolve(modulePath, 'node_modules')

    if (fs.existsSync(nodeProductionModuleDir)) {
      global.require.addToNodePath(nodeProductionModuleDir)
    }

    if (fs.existsSync(nodeModuleDir)) {
      global.require.addToNodePath(nodeModuleDir)
    }
  }

  async getModulesList() {
    const moduleFolder = lookupPaths.filter(x => fs.existsSync(x))
    if (!moduleFolder.length) {
      return []
    }

    const files: string[] = []
    for (const file of await fs.readdirSync(moduleFolder[0])) {
      if (fs.lstatSync(path.resolve(moduleFolder[0], file)).isDirectory() && !file.startsWith('.')) {
        files.push(file)
      } else if (file.endsWith('.tgz')) {
        files.push(path.basename(file, path.extname(file)))
      }
    }

    return files
  }

  /**
   * Resolves the real absolute path of a module from a path defined in [`botpress.config.json`]{@see BotpressConfig}
   * @private
   * @param modulePath The module path to load, which may be pointing to a TGZ file or a folder and may also contain variables like {{MODULES_ROOT}}
   */
  async resolve(modulePath: string) {
    const paths = lookupPaths.reduce((arr: string[], lp?: string) => {
      const item = modulePath.replace('MODULES_ROOT', lp!)
      arr.push(path.resolve(fixPathForOS(item)))
      arr.push(path.resolve(fixPathForOS(item + '.tgz')))
      return arr
    }, [])

    for (const p of paths) {
      if (!fs.existsSync(p)) {
        continue
      }

      if (fs.statSync(p).isDirectory()) {
        this.addModuleNodePath(p)
        return p
      }

      if (!p.endsWith('.tgz')) {
        throw new ConfigurationError(`The file at "${p}" is not a .tgz file`)
      }

      const finalDestination = await this.unpacker.unpack(p)
      this.addModuleNodePath(finalDestination)

      return finalDestination
    }

    throw new ConfigurationError(`Could not find module at path "${modulePath}"`)
  }

  requireModule(moduleLocation: string): ModuleEntryPoint {
    let originalRequirePaths = global.require.getPaths()

    try {
      // We temporarily bump the module's node_modules in priority
      // So that it loads the local versions of its own dependencies
      global.require.overwritePaths([
        path.join(moduleLocation, 'node_production_modules'),
        path.join(moduleLocation, 'node_modules'),
        ...originalRequirePaths
      ])

      const req = require(moduleLocation)
      return req.default ? req.default : req
    } finally {
      global.require.overwritePaths(originalRequirePaths)
    }
  }
}
