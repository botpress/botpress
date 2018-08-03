import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'

import { ExtendedKnex } from '../../database/interfaces'
import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { CMSService, ContentElement, ContentType } from '.'
import { CodeFile, SafeCodeSandbox } from './util'

const CONTENT_ELEMENTS_TABLE = 'content_elements'
const LOCATION = 'content-types'

class SearchParameters {
  searchTerm: string
  orderBy: string[] = ['createdOn']
  from = 0
  count = 50
}

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
    await this.seed()
    await this.loadContentTypesFromFiles()
  }

  private async prepareDb() {
    await this.memDb.createTableIfNotExists(CONTENT_ELEMENTS_TABLE, table => {
      table.string('id')
      table.string('botId')
      table.primary(['id', 'botId'])
      table.string('contentType')
      table.text('rawData')
      table.text('computedData')
      table.text('previewText')
      table.string('createdBy')
      table.timestamp('createdOn')
    })
  }

  private async seed() {
    const fileNames = await this.ghost.directoryListing(botId, 'content-elements', '.json')
    let contentElements: ContentElement[] = []

    for (const fileName of fileNames) {
      const file = <string>await this.ghost.readFile(botId, 'content-elements', fileName)
      const fileContentElements = <ContentElement[]>JSON.parse(file)
      contentElements = _.concat(contentElements, fileContentElements)
    }

    Promise.mapSeries(contentElements, element =>
      this.memDb('CONTENT_ELEMENTS_TABLE')
        .insert(this.transformItemApiToDb(element, botId))
        .then()
    )
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

<<<<<<< Updated upstream
  private async loadContentTypeFromFile(sandbox: SafeCodeSandbox, fileName: string): Promise<void> {
    const type = <ContentType>await sandbox.run(fileName)
=======
  private async loadContentTypeFromFile(fileName: string): Promise<void> {
    const content = <string>await this.ghost.readFile('global', 'content-types', fileName)
    const type = safeEvalToObject<ContentType>(content)
>>>>>>> Stashed changes

    if (!type || !type.id) {
      throw new Error('Invalid type ' + fileName)
    }
  }

  private transformItemApiToDb(element: ContentElement, botId: string) {
    return {
      id: element.id,
      botId: botId,
      contentType: element.contentType,
      rawData: element.rawData,
      computedData: element.computedData,
      previewText: element.previewText,
      createdBy: element.createdBy,
      createdOn: element.createdOn
    }
  }

  async listContentElements(botId: string, contentType?: string, params?: SearchParameters): Promise<ContentElement[]> {
    let query = this.memDb(CONTENT_ELEMENTS_TABLE)
    query = query.where('botId', botId)

<<<<<<< Updated upstream
    for (const fileName of fileNames) {
      const file = <string>await this.ghost.readFile(botId, '/content-elements', fileName)
      // const element = safeEvalToObject<ContentElement>(file) // Do we need safe??
      // console.log(element)
      // elements.push(element)
=======
    if (contentType) {
      query = query.where('contentType', contentType)
    }

    if (params && params.searchTerm) {
      query = query.where(builder =>
        builder.where('formData', 'like', `%${params.searchTerm}%`).orWhere('id', 'like', `%${params.searchTerm}%`)
      )
    }

    if (params) {
      params.orderBy.forEach(column => {
        query = query.orderBy(column)
      })
>>>>>>> Stashed changes
    }

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
