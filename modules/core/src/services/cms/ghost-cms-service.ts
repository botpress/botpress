import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'

import { ExtendedKnex } from '../../database/interfaces'
import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { CMSService, ContentElement, ContentType, DefaultSearchParams, SearchParams } from '.'
import { CodeFile, SafeCodeSandbox } from './util'

const CONTENT_ELEMENTS_TABLE = 'content_elements'
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
    await this.ghost.addRootFolder(true, 'content-types', { filesGlob: '**.js', isBinary: false })
    await this.prepareDb()
    await this.loadContentTypesFromFiles()

    // TESTS
    await this.loadContentElementsFromFiles('bot123')
    console.log(await this.listContentElements('bot123', 'builtin_text'))
  }

  private async prepareDb() {
    await this.memDb.createTableIfNotExists(CONTENT_ELEMENTS_TABLE, table => {
      table.string('id')
      table.string('botId')
      table.primary(['id', 'botId'])
      table.string('contentType')
      table.string('formData')
      table.text('rawData')
      table.text('computedData')
      table.text('previewText')
      table.string('createdBy')
      table.timestamp('createdOn')
      table.timestamp('modifiedOn')
    })
  }

  private async loadContentElementsFromFiles(botId: string) {
    const fileNames = await this.ghost.directoryListing(botId, 'content-elements', '.json')
    let contentElements: ContentElement[] = []

    for (const fileName of fileNames) {
      const file = <string>await this.ghost.readFile(botId, 'content-elements', fileName)
      const fileContentElements = <ContentElement[]>JSON.parse(file)
      contentElements = _.concat(contentElements, fileContentElements)
    }

    Promise.mapSeries(contentElements, element =>
      this.memDb(CONTENT_ELEMENTS_TABLE)
        .insert(this.mapToTable(element, botId))
        .then()
    )
  }

  private mapToTable(element: ContentElement, botId: string) {
    return { ...element, botId: botId }
  }

  private async loadContentTypesFromFiles(): Promise<void> {
    const fileNames = await this.ghost.directoryListing('global', LOCATION, '*.js')

    const codeFiles = await Promise.map(fileNames, async filename => {
      const content = <string>await this.ghost.readFile('global', LOCATION, filename)
      return <CodeFile>{ code: content, relativePath: filename }
    })

    const sandbox = new SafeCodeSandbox(codeFiles)
    let filesLoaded = 0

    try {
      for (const file of sandbox.ls()) {
        try {
          const filename = path.basename(file)
          if (filename.startsWith('_')) {
            // File to exclude
            continue
          }
          await this.loadContentTypeFromFile(sandbox, file)
          filesLoaded++
        } catch (e) {
          this.logger.error(e, `Could not load Content Type "${file}"`)
        }
      }
    } finally {
      sandbox && sandbox.dispose()
      this.logger.debug(`Loaded ${filesLoaded} content types`)
    }
  }

  private async loadContentTypeFromFile(sandbox: SafeCodeSandbox, fileName: string): Promise<void> {
    const type = <ContentType>await sandbox.run(fileName)

    if (!type || !type.id) {
      throw new Error('Invalid type ' + fileName)
    }
  }

  async listContentElements(
    botId: string,
    contentType?: string,
    params: SearchParams = DefaultSearchParams
  ): Promise<ContentElement[]> {
    let query = this.memDb(CONTENT_ELEMENTS_TABLE)
    query = query.where('botId', botId)

    if (contentType) {
      query = query.where('contentType', contentType)
    }

    if (params.searchTerm) {
      query = query.where(builder =>
        builder.where('formData', 'like', `%${params.searchTerm}%`).orWhere('id', 'like', `%${params.searchTerm}%`)
      )
    }

    params.orderBy.forEach(column => {
      query = query.orderBy(column)
    })

    return <ContentElement[]>await query.offset(params.from).limit(params.count)
  }
  async getContentElement(botId: string, id: string): Promise<ContentElement> {
    return await this.memDb(CONTENT_ELEMENTS_TABLE)
      .where('botId', botId)
      .andWhere('id', id)
  }

  async getContentElements(botId: string, ids: string[]): Promise<ContentElement[]> {
    return await this.memDb(CONTENT_ELEMENTS_TABLE).where(builder => builder.where('botId', botId).whereIn('id', ids))
  }

  async countContentElements(botId: string, contentType: string): Promise<number> {
    return await this.memDb(CONTENT_ELEMENTS_TABLE)
      .where('botId', botId)
      .andWhere('contentType', contentType)
      .count('* as count')
      .get(0)
      .then(row => (row && Number(row.count)) || 0)
  }

  async deleteContentElements(botId: string, ids: string[]): Promise<void> {
    return await this.memDb(CONTENT_ELEMENTS_TABLE)
      .where('botId', botId)
      .whereIn('id', ids)
      .del()
  }

  async getAllContentTypes(botId?: any) {
    return []
  }

  getContentType(contentType: string): Promise<ContentType> {
    throw new Error('Method not implemented.')
  }
}
