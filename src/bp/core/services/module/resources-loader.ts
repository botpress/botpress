import { Logger } from 'botpress/sdk'
import fse from 'fs-extra'
import path from 'path'

import { addHashToFile, isOriginalFile } from '../../misc/checksum'
import ModuleResolver from '../../modules/resolver'

/** Describes a resource that the module wants to export to the bot */
interface ModuleResourceExport {
  [name: string]: FileTeleport
}

interface FileTeleport {
  /** The source location of the file, in the module's folder */
  src: string
  /** Final destination of the resource on the bot's folder */
  dest: string
  /** Copy files without checking their original checksum */
  ignoreChecksum?: boolean
}

export class ModuleResourceLoader {
  private modulePath: string = ''
  private paths: ModuleResourceExport = {}

  constructor(private logger: Logger, private moduleName: string) {}

  async importResources() {
    const resolver = new ModuleResolver(this.logger)
    this.modulePath = await resolver.resolve('MODULES_ROOT/' + this.moduleName)

    this.paths = {
      actions: {
        src: `${this.modulePath}/dist/actions`,
        dest: `${process.PROJECT_LOCATION}/data/global/actions/${this.moduleName}`
      },
      assets: {
        src: `${this.modulePath}/assets`,
        dest: `${process.PROJECT_LOCATION}/assets/modules/${this.moduleName}`,
        ignoreChecksum: true
      },
      content_types: {
        src: `${this.modulePath}/dist/content-types`,
        dest: `${process.PROJECT_LOCATION}/data/global/content-types/${this.moduleName}`
      },
      ...(await this._getHooksPaths())
    }

    this._loadModuleResources()
  }

  private _loadModuleResources() {
    for (const resource in this.paths) {
      if (fse.pathExistsSync(this.paths[resource].src)) {
        this._upsertModuleResources(this.paths[resource])
      }
    }
  }

  async getBotTemplatePath(templateName: string) {
    const resolver = new ModuleResolver(this.logger)
    const modulePath = await resolver.resolve('MODULES_ROOT/' + this.moduleName)
    return path.resolve(`${modulePath}/dist/bot-templates/${templateName}`)
  }

  private async _getHooksPaths(): Promise<ModuleResourceExport> {
    const hooks: ModuleResourceExport = {}

    const moduleHooks = `${this.modulePath}/dist/hooks/`
    if (!fse.pathExistsSync(moduleHooks)) {
      return hooks
    }

    for (const hookType of await fse.readdir(moduleHooks)) {
      hooks[hookType] = {
        src: `${this.modulePath}/dist/hooks/${hookType}`,
        dest: `${process.PROJECT_LOCATION}/data/global/hooks/${hookType}/${this.moduleName}`
      }
    }
    return hooks
  }

  private _upsertModuleResources(rootPath: FileTeleport): void {
    fse.mkdirpSync(rootPath.dest)

    if (rootPath.ignoreChecksum) {
      fse.copySync(rootPath.src, rootPath.dest)
    } else {
      const files = fse.readdirSync(rootPath.src)
      this._updateOutdatedFiles(files, rootPath)
    }
  }

  private _updateOutdatedFiles(files, rootPath: FileTeleport): void {
    for (const file of files) {
      const from = path.join(rootPath.src, file)
      const to = path.join(rootPath.dest, file)

      if (!fse.existsSync(to) || isOriginalFile(to)) {
        fse.copySync(from, to)
        addHashToFile(to)
      } else {
        this.logger.debug(`File ${file} has been changed manually, skipping...`)
      }
    }
  }
}
