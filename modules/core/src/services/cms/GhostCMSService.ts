import { inject, injectable, tagged } from 'inversify'

import { ExtendedKnex } from '../../database/interfaces'
import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { CMSService, ContentElement, ContentType } from '.'

const LOCATION = 'content-types'

@injectable()
export class GhostCMSService implements CMSService {
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
  }

  private async prepareDb() {
    await this.memDb.createTableIfNotExists('content_items', table => {
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
    for (const fileName of fileNames) {
      try {
        await this.loadContentTypeFromFile(fileName)
      } catch (e) {
        this.logger.error(e, `Could not load Content Type "${fileName}"`)
      }
    }
    this.logger.debug(`Loaded 0 content types`)
  }

  private async loadContentTypeFromFile(fileName: string): Promise<void> {
    this.logger.debug('Loading ' + fileName)
  }

  listContentElements(botId: string, contentType: string): Promise<ContentElement[]> {
    throw new Error('Method not implemented.')
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
