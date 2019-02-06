import { Logger } from 'botpress/sdk'
import fse from 'fs-extra'
import path from 'path'

import ModuleResolver from '../../modules/resolver'
import { FileContent, GhostService } from '../ghost/service'

/** Describes a resource that the module will export to the data folder */
interface ResourceExportPath {
  /** The source location of the file, in the module's folder */
  src: string
  /** Final destination of the resource on the bot's folder */
  dest: string
  /** Copy files without checking their original checksum */
  ignoreChecksum?: boolean
}

export class ModuleResourceLoader {
  private modulePath: string = ''
  private exportPaths: ResourceExportPath[] = []

  constructor(private logger: Logger, private moduleName: string, private ghost: GhostService) {}

  async importResources() {
    const resolver = new ModuleResolver(this.logger)
    this.modulePath = await resolver.resolve('MODULES_ROOT/' + this.moduleName)

    this.exportPaths = [
      {
        src: `${this.modulePath}/dist/actions`,
        dest: `/actions/${this.moduleName}`
      },
      {
        src: `${this.modulePath}/assets`,
        dest: `/assets/modules/${this.moduleName}`,
        ignoreChecksum: true
      },
      {
        src: `${this.modulePath}/dist/content-types`,
        dest: `/content-types/${this.moduleName}`
      },
      ...(await this._getHooksPaths())
    ]

    await this._loadModuleResources()
  }

  private async _loadModuleResources(): Promise<void> {
    for (const resource of this.exportPaths) {
      if (fse.pathExistsSync(resource.src)) {
        await this._upsertModuleResources(resource)
      }
    }
  }

  async getBotTemplatePath(templateName: string) {
    const resolver = new ModuleResolver(this.logger)
    const modulePath = await resolver.resolve('MODULES_ROOT/' + this.moduleName)
    return path.resolve(`${modulePath}/dist/bot-templates/${templateName}`)
  }

  private async _getHooksPaths(): Promise<ResourceExportPath[]> {
    const hooks: ResourceExportPath[] = []

    const moduleHooks = `${this.modulePath}/dist/hooks/`
    if (!fse.pathExistsSync(moduleHooks)) {
      return hooks
    }

    for (const hookType of await fse.readdir(moduleHooks)) {
      hooks.push({
        src: `${this.modulePath}/dist/hooks/${hookType}`,
        dest: `/hooks/${hookType}/${this.moduleName}`
      })
    }
    return hooks
  }

  private async _upsertModuleResources(rootPath: ResourceExportPath): Promise<void> {
    if (rootPath.ignoreChecksum) {
      const absoluteRootPathDest = process.PROJECT_LOCATION + rootPath.dest
      fse.mkdirpSync(absoluteRootPathDest)
      fse.copySync(rootPath.src, absoluteRootPathDest)
    } else {
      const files = fse.readdirSync(rootPath.src)
      const filesContents = files.map(file => {
        return {
          name: `${rootPath.dest}/${file}`,
          content: fse.readFileSync(`${rootPath.src}/${file}`)
        } as FileContent
      })

      await this.ghost.global().upsertFiles('/', filesContents)
    }
  }
}
