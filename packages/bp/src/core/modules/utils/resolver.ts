import { Logger, ModuleEntryPoint } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { ConfigurationError } from 'errors'
import fs from 'fs'
import { inject } from 'inversify'
import path from 'path'

import Unpacker from './unpacker'

const lookupPaths: string[] = []

if (process.pkg) {
  // Modules will be picked from this location first
  lookupPaths.push(path.dirname(process.execPath) + '/data/modules')

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

export class ModuleResolver {
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
    for (const folder of moduleFolder) {
      for (const file of fs.readdirSync(folder)) {
        if (fs.lstatSync(path.resolve(folder, file)).isDirectory() && !file.startsWith('.')) {
          files.push(file)
        } else if (file.endsWith('.tgz')) {
          files.push(path.basename(file, path.extname(file)))
        }
      }
    }

    return files
  }

  /**
   * Returns the list of all detected modules on the file system and their current status
   * @param modulePath
   */
  async getModuleInfo(modulePath: string): Promise<{ path: string; archived?: boolean; valid: boolean } | undefined> {
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
        const hasPackage = fs.existsSync(path.join(p, 'package.json'))
        const hasIndexFile = fs.existsSync(path.join(p, 'dist/backend/index.js'))

        return { path: p, valid: hasPackage && hasIndexFile }
      }

      if (!p.endsWith('.tgz')) {
        return { path: p, archived: true, valid: false }
      }

      const { finalDestination } = await this.unpacker.getUnpackPaths(p)

      if (fs.existsSync(finalDestination)) {
        return { path: finalDestination, valid: true }
      }

      return { path: p, archived: true, valid: true }
    }
  }

  /**
   * Resolves the real absolute path of a module from a path defined in [`botpress.config.json`]{@see BotpressConfig}
   * @private
   * @param modulePath The module path to load, which may be pointing to a TGZ file or a folder and may also contain variables like {{MODULES_ROOT}}
   */
  async resolve(modulePath: string) {
    const moduleInfo = await this.getModuleInfo(modulePath)

    if (!moduleInfo) {
      throw new ConfigurationError(`Could not find module at path "${modulePath}"`)
    }

    const { archived, path: fullPath, valid } = moduleInfo

    if (!archived) {
      if (!valid) {
        return ''
      }

      this.addModuleNodePath(fullPath)
      return fullPath
    }

    if (!valid) {
      throw new ConfigurationError(`The file at "${fullPath}" is not a .tgz file`)
    }

    const finalDestination = await this.unpacker.unpack(fullPath)
    this.addModuleNodePath(finalDestination)

    return finalDestination
  }

  requireModule(moduleLocation: string): ModuleEntryPoint {
    const originalRequirePaths = global.require.getPaths()

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
