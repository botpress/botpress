import { Logger } from 'botpress/sdk'
import crypto from 'crypto'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import os from 'os'
import path from 'path'

import { GhostService } from '../ghost/service'

const debug = DEBUG('initialization')
  .sub('modules')
  .sub('resources')

const CHECKSUM = '//CHECKSUM:'

/**
 * Files starting with a dot are disabled. This prefix means it was automatically disabled and
 * will be automatically re-enabled when the corresponding module is enabled in the future
 */
const DISABLED_PREFIX = '.__'
interface ModuleMigrationInstruction {
  /** exact name of the files to delete (path is relative to the migration file) */
  filesToDelete: string[]
}

/** Describes a resource that the module will export to the data folder */
interface ResourceExportPath {
  /** The source location of the file, in the module's folder */
  src: string
  /** Final destination of the resource on the bot's folder */
  dest: string
  /** Copy files without checking their original checksum */
  ignoreChecksum?: boolean
  ghosted?: boolean
}

export class ModuleResourceLoader {
  private exportPaths: ResourceExportPath[] = []
  private globalPaths: string[]
  private hookMatcher: RegExp

  private get modulePath(): string {
    return process.LOADED_MODULES[this.moduleName]
  }

  constructor(private logger: Logger, private moduleName: string, private ghost: GhostService) {
    this.globalPaths = [`/actions/${this.moduleName}`, `/content-types/${this.moduleName}`]
    this.hookMatcher = new RegExp(`^[a-z_]+?\/${this.moduleName}/`)
  }

  async runMigrations() {
    const mfile = `${this.modulePath}/migrations.json`
    if (fse.existsSync(mfile)) {
      await this._executeMigration(mfile)
    }
  }

  async importResources() {
    this.exportPaths = [
      {
        src: `${this.modulePath}/dist/actions`,
        dest: `/actions/${this.moduleName}`,
        ghosted: true
      },
      {
        src: `${this.modulePath}/assets`,
        dest: `/data/assets/modules/${this.moduleName}`,
        ignoreChecksum: true
      },
      {
        src: `${this.modulePath}/dist/content-types`,
        dest: `/content-types/${this.moduleName}`,
        ghosted: true
      },
      ...(await this._getHooksPaths())
    ]

    await this._loadModuleResources()
  }

  async enableResources() {
    const ghost = this.ghost.global()

    for (const path of this.globalPaths) {
      const files = await ghost.directoryListing(path, undefined, undefined, true)
      await Promise.all(
        files
          .filter(name => name.startsWith(DISABLED_PREFIX))
          .map(file => ghost.renameFile(path, file, file.replace(DISABLED_PREFIX, '')))
      )
    }

    const hooks = await ghost.directoryListing('/hooks', undefined, undefined, true)
    await Promise.all(
      hooks
        .filter(f => this.hookMatcher.test(f) && path.basename(f).startsWith(DISABLED_PREFIX))
        .map(f =>
          ghost.renameFile('hooks/' + path.dirname(f), path.basename(f), path.basename(f).replace(DISABLED_PREFIX, ''))
        )
    )
  }

  async disableResources() {
    const ghost = this.ghost.global()

    for (const path of this.globalPaths) {
      const files = await ghost.directoryListing(path)
      await Promise.all(files.map(file => ghost.renameFile(path, file, DISABLED_PREFIX + file)))
    }

    const hooks = await ghost.directoryListing('/hooks')
    await Promise.all(
      hooks
        .filter(file => this.hookMatcher.test(file))
        .map(f => ghost.renameFile('hooks/' + path.dirname(f), path.basename(f), DISABLED_PREFIX + path.basename(f)))
    )
  }

  private async isSymbolicLink(filePath) {
    const fullPath = path.resolve(`${process.PROJECT_LOCATION}/${filePath}`)
    return fse.pathExistsSync(fullPath) && (await fse.lstatSync(fullPath).isSymbolicLink())
  }

  private async _loadModuleResources(): Promise<void> {
    for (const resource of this.exportPaths) {
      if (fse.pathExistsSync(resource.src) && !(await this.isSymbolicLink(resource.dest))) {
        await this._upsertModuleResources(resource)
      }
    }
  }

  async getBotTemplatePath(templateName: string) {
    return path.resolve(`${this.modulePath}/dist/bot-templates/${templateName}`)
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
        dest: `/hooks/${hookType}/${this.moduleName}`,
        ghosted: true
      })
    }
    return hooks
  }

  private async _upsertModuleResources(rootPath: ResourceExportPath): Promise<void> {
    if (rootPath.ignoreChecksum || !rootPath.ghosted) {
      fse.copySync(rootPath.src, process.PROJECT_LOCATION + rootPath.dest)
    } else {
      await this._updateOutdatedFiles(rootPath.src, rootPath.dest)
    }
  }

  @WrapErrorsWith('Error copying module ressources')
  private async _updateOutdatedFiles(src, dest): Promise<void> {
    const files = fse.readdirSync(src)

    const allGhostedFiles = await this.ghost.global().directoryListing('/', undefined, [], true)
    const getNormalizedDir = fullPath => path.dirname(fullPath.replace(/\\/g, '/').replace(/^\//, ''))
    const getNakedFileName = file =>
      path
        .basename(file)
        .replace(/^\.__/, '')
        .replace(/^\.?(\d+_)?/, '')

    for (const file of files) {
      const from = path.join(src, file)
      let to = path.join(dest, file)

      /** We're looking into the files we already have if there's a file
       * that has the same "name" if we excluded operational renamings such as
       * '.__' for disabled file or numbers prefix for re-ordering.
       * These operational renamings should not change the fact that they are the same file.
       *
       * This is important because imagine this scenario...
       * A module exposes the hook: "/hooks/on_server_started/my_module/something_we_dont_want.js"
       * The developer renames it to ".something_we_dont_want.js" in his installation because he doesn't want that behavior
       * Upon starting the server, we will again copy it, re-enabling the feature we just disabled!
       */
      const matched = allGhostedFiles.find(ghosted => {
        if (getNormalizedDir(ghosted) === getNormalizedDir(to)) {
          const normalizedFrom = getNakedFileName(file)
          const normalizedTo = getNakedFileName(path.basename(ghosted))
          return normalizedFrom === normalizedTo
        }
        return false
      })

      to = matched || to

      const isNewFile = !(await this.ghost.global().fileExists('/', to))
      const ressourceHasChanged = await this.ressourceHasChanged(from, to)
      const fileHasBeenManuallyUpdated = isNewFile || (await this.userHasManuallyChangedFile(to))
      if (isNewFile || (ressourceHasChanged && !fileHasBeenManuallyUpdated)) {
        debug('adding missing file "%s"', file)
        const contentWithHash = await this._getRessourceContentWithHash(from)
        await this.ghost.global().upsertFile('/', to, contentWithHash)
      } else if (fileHasBeenManuallyUpdated) {
        debug('not copying file "%s" because it has been changed manually', file)
      } else {
        debug('not copying file "%s" because already using latest version', file)
      }
    }
  }

  private _calculateHash = content => {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
  }

  private ressourceHasChanged = async (ressourceFilePath: string, destinationFilePath: string) => {
    try {
      const ressourceContent = await fse.readFileSync(ressourceFilePath, 'utf8')
      const destinationContent = await this.ghost.global().readFileAsString('/', destinationFilePath)
      const lines = destinationContent.split(os.EOL)
      const firstLine = lines[0]

      if (firstLine.indexOf(CHECKSUM) === 0) {
        return this._calculateHash(ressourceContent) !== firstLine.substring(CHECKSUM.length)
      }
    } catch (err) {
      return true
    }
    return true
  }

  /**
   * Checks if there is a checksum on the first line of the file,
   * and uses it to verify if there has been any manual changes in the file's content
   * @param filename
   */
  private userHasManuallyChangedFile = async filename => {
    const file = await this.ghost.global().readFileAsString('/', filename)
    const lines = file.split(os.EOL)
    const firstLine = lines[0]

    if (firstLine.indexOf(CHECKSUM) === 0) {
      const fileContent = lines.splice(1, lines.length).join(os.EOL)
      return this._calculateHash(fileContent) !== firstLine.substring(CHECKSUM.length)
    }

    return true
  }

  /**
   * Calculates the hash for the file's content, then adds a comment on the first line with the result
   * @param filename
   */
  private _getRessourceContentWithHash = async ressourceFilePath => {
    const ressourceContent = await fse.readFileSync(ressourceFilePath, 'utf8')
    const hash = this._calculateHash(ressourceContent)
    return `${CHECKSUM}${hash}${os.EOL}${ressourceContent}`
  }

  @WrapErrorsWith(args => `Error in migration script "${args[0]}".`)
  private async _executeMigration(migrationsFile: string) {
    const content: ModuleMigrationInstruction[] = JSON.parse(fse.readFileSync(migrationsFile, 'utf8'))
    if (!content) {
      throw new Error(`Expected a valid JSON object.`)
    }

    for (const migration of content) {
      if (!Array.isArray(migration.filesToDelete)) {
        continue
      }

      for (const fileToDelete of migration.filesToDelete) {
        if (await this.ghost.global().fileExists('/', fileToDelete)) {
          debug('migration deleted file "%s"', fileToDelete)
          await this.ghost.global().deleteFile('/', fileToDelete)
        } else {
          debug('not deleting file "%s", reason: not found', fileToDelete)
        }
      }
    }
  }
}
