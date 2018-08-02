import { inject, injectable, tagged } from 'inversify'

import { ExtendedKnex } from '../../database/interfaces'
import BotsTable from '../../database/tables/server-wide/bots'
import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { CMSService, ContentElement, ContentType } from '.'
import { safeEvalToObject } from './util'

const LOCATION = 'content-types'

@injectable()
export class GhostCMSService implements CMSService {
  loadedContentTypes: ContentType[]

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'CMS')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostContentService,
    @inject(TYPES.InMemoryDatabase) private memDb: ExtendedKnex
  ) {}

  async initialize() {
    await this.ghost.addRootFolder(true, LOCATION, { filesGlob: '**.js', isBinary: false })
    await this.prepareDb()
    await this.loadContentTypesFromFiles()
    await this.listContentElements('bot123', 'buitin_text')
  }

  private async prepareDb() {
    await this.memDb.createTableIfNotExists('content_elements', table => {
      table.string('id')
      table.string('botId')
      table.primary(['id', 'botId'])
      table.string('contentType')
      table.text('rawData')
      table.text('computedData')
      table.text('previewText')
      table.string('createdBy')
      table.timestamp('created_on')
    })
  }

  private async loadContentTypesFromFiles(): Promise<void> {
    const fileNames = await this.ghost.directoryListing('global', LOCATION, '*.js')
    let filesLoaded = 0
    for (const fileName of fileNames) {
      try {
        await this.loadContentTypeFromFile(fileName)
        filesLoaded++
      } catch (e) {
        this.logger.error(e, `Could not load Content Type "${fileName}"`)
      }
    }
    this.logger.debug(`Loaded ${filesLoaded} content types`)
  }

  private async loadContentTypeFromFile(fileName: string): Promise<void> {
    const content = <string>await this.ghost.readFile('global', LOCATION, fileName)
    const type = safeEvalToObject<ContentType>(content)

    if (!type || !type.id) {
      throw new Error('Invalid type')
    }

    this.logger.debug('Loading ' + fileName)
  }

  async listContentElements(botId: string, contentType: string): Promise<ContentElement[]> {
    const fileNames = await this.ghost.directoryListing(botId, '/content-elements', '.json')
    const elements: ContentElement[] = []

    // fileNames.map(fileName => {
    //   this.ghost.readFile(botId, '/content-elements', fileName)
    // })

    for (const fileName of fileNames) {
      const file = <string>await this.ghost.readFile(botId, '/content-elements', fileName)
      const element = safeEvalToObject<ContentElement>(file) // Do we need safe??
      console.log(element)
      elements.push(element)
    }

    return elements
  }
  getContentElement(botId: string, id: string): Promise<ContentElement> {
    throw new Error('Method not implemented.')
  }
  getContentElements(botId: string, ids: string): Promise<ContentElement[]> {
    throw new Error('Method not implemented.')
  }
  getAllContentTypes(): Promise<ContentType[]>
  getAllContentTypes(botId: string): Promise<ContentType[]>
  async getAllContentTypes(botId?: any) {
    return []
  }
  getContentType(contentType: string): Promise<ContentType> {
    throw new Error('Method not implemented.')
  }
  countContentElements(botId: string, contentType: string): Promise<number> {
    throw new Error('Method not implemented.')
  }
  deleteContentElements(botId: string, ids: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
