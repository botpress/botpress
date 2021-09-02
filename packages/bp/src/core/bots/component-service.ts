import { Logger } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { extractArchive } from 'core/misc/archive'

import fse from 'fs-extra'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import tmp from 'tmp'

export class ComponentService {
  private _botTranslations: { [botId: string]: any } = {}

  constructor(private logger: Logger, private ghostService: GhostService, private cms: CMSService) {}

  public async extractBotComponents(botId: string) {
    const files = await this.ghostService.forBot(botId).directoryListing('components', '*.*')

    for (const file of files) {
      const tmpDir = tmp.dirSync({ unsafeCleanup: true })
      const tmpFolder = tmpDir.name

      try {
        const buffer = await this.ghostService.forBot(botId).readFileAsBuffer('components', file)
        await extractArchive(buffer, tmpFolder)

        const details = await this._validateComponent(tmpFolder)

        if (details?.packageType === 'component' && details.name) {
          await this._importCustomComponent(botId, details.name, tmpFolder)
        }
      } finally {
        tmpDir.removeCallback()
      }
    }
  }

  public getBotTranslations(botId: string) {
    return this._botTranslations[botId] || {}
  }

  private async _validateComponent(folder: string): Promise<{ name: string; packageType: 'component' } | undefined> {
    const { name, packageType } = await fse.readJson(path.join(folder, 'package.json'))
    if (!name || !packageType) {
      this.logger.error('The name and type of package (packageType) must be provided')
      return
    }

    if (packageType === 'component') {
      if (!(await fse.pathExists(path.join(folder, 'dist/backend/schema.js')))) {
        this.logger.error('Custom components must have a schema')
        return
      }

      if (!(await fse.pathExists(path.join(folder, 'dist/ui')))) {
        this.logger.error('Custom components must have an interface. Otherwise, create a simple content type')
        return
      }

      return { name, packageType }
    }
  }

  private async _importCustomComponent(botId: string, componentName: string, srcFolder: string) {
    const destFolder = path.join(process.PROJECT_LOCATION, '/data/assets/bots/', botId, 'component', componentName)
    await mkdirp(destFolder)
    await fse.move(path.join(srcFolder, 'dist/ui'), path.join(destFolder), {
      overwrite: true
    })

    const fileContent = await fse.readFile(path.join(srcFolder, 'dist/backend/schema.js'), 'utf-8')
    await this.cms.addBotContentType(botId, componentName, fileContent.toString())

    const translationsPath = path.join(srcFolder, 'dist/translations/index.js')
    await this.loadTranslations(botId, componentName, translationsPath)
  }

  private async loadTranslations(botId: string, componentName: string, translationsPath: string) {
    if (!(await fse.pathExists(translationsPath))) {
      return
    }

    const translations = require(translationsPath).default

    if (!this._botTranslations[botId]) {
      this._botTranslations[botId] = {}
    }

    Object.keys(translations!).map(lang => {
      _.merge(this._botTranslations[botId], {
        [lang]: {
          component: {
            [componentName]: translations[lang]
          }
        }
      })
    })
  }
}
