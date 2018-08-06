import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import nanoid from 'nanoid'
import path from 'path'

import { ExtendedKnex } from '../../database/interfaces'
import { IDisposeOnExit, Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { CMSService, ContentElement, ContentType, DefaultSearchParams, SearchParams } from '.'
import { CodeFile, SafeCodeSandbox } from './util'

const CONTENT_ELEMENTS_TABLE = 'content_elements'
const LOCATION = 'content-types'

@injectable()
export class GhostCMSService implements CMSService {
  private contentTypes: ContentType[] = []
  private filesById = {}
  private sandbox: SafeCodeSandbox

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'CMS')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostContentService,
    @inject(TYPES.InMemoryDatabase) private memDb: ExtendedKnex
  ) {}

  disposeOnExit() {
    this.sandbox && this.sandbox.dispose()
  }

  async initialize() {
    await this.ghost.addRootFolder(true, LOCATION, { filesGlob: '**.js', isBinary: false })
    await this.prepareDb()
    await this.loadContentTypesFromFiles()

    // REMOVE THIS
    await this.loadContentElementsFromFiles('bot123')
    // console.log(await this.getAllContentTypes('bot123'))
    // console.log(await this.getAllContentTypes())
    // console.log(await this.createOrUpdateContentElement('bot123', 'builtin_text', ''))
    // console.log(await this.countContentElements('bot123', 'builtin_single-choice'))
    // console.log(await this.getRandomContentElement('builtin_single-choice'))
    // console.log(await this.listContentElements('bot123', undefined, { ...DefaultSearchParams, searchTerm: 'choice' }))
  }

  private async prepareDb() {
    await this.memDb.createTableIfNotExists(CONTENT_ELEMENTS_TABLE, table => {
      table.string('id')
      table.string('botId')
      table.primary(['id', 'botId'])
      table.string('contentType')
      table.text('formData') // rawData
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
    // Call computedData, previewText and persist as well?
    return { ...element, botId: botId }
  }

  private async loadContentTypesFromFiles(): Promise<void> {
    const fileNames = await this.ghost.directoryListing('global', LOCATION, '*.js')

    const codeFiles = await Promise.map(fileNames, async filename => {
      const content = <string>await this.ghost.readFile('global', LOCATION, filename)
      return <CodeFile>{ code: content, relativePath: filename }
    })

    this.sandbox = new SafeCodeSandbox(codeFiles)
    let filesLoaded = 0

    try {
      for (const file of this.sandbox.ls()) {
        try {
          const filename = path.basename(file)
          if (filename.startsWith('_')) {
            // File to exclude
            continue
          }
          await this.loadContentTypeFromFile(file)
          filesLoaded++
        } catch (e) {
          this.logger.error(e, `Could not load Content Type "${file}"`)
        }
      }
    } finally {
      this.logger.debug(`Loaded ${filesLoaded} content types`)
    }
  }

  private async loadContentTypeFromFile(sandbox: SafeCodeSandbox, fileName: string): Promise<void> {
    const contentType = <ContentType>await sandbox.run(fileName)

    if (!contentType || !contentType.id) {
      throw new Error('Invalid content type ' + fileName)
    }

    this.filesById[contentType.id] = fileName + '.json'
    this.contentTypes.push(contentType)
  }

  async listContentElements(
    botId: string,
    contentTypeId?: string,
    params: SearchParams = DefaultSearchParams
  ): Promise<ContentElement[]> {
    let query = this.memDb(CONTENT_ELEMENTS_TABLE)
    query = query.where('botId', botId)

    if (contentTypeId) {
      query = query.where('contentType', contentTypeId)
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

  async countContentElements(botId: string, contentTypeId: string): Promise<number> {
    return await this.memDb(CONTENT_ELEMENTS_TABLE)
      .where('botId', botId)
      .andWhere('contentType', contentTypeId)
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

  async getAllContentTypes(botId?: any): Promise<ContentType[]> {
    if (botId) {
      const fileNames = await this.ghost.directoryListing(botId, 'content-elements', '.json')
      const contentTypeIds = fileNames.map(fileName => fileName.split('.')[0])
      const contentTypes = []
      for (const id of contentTypeIds) {
        contentTypes.push(await this.getContentType(id))
      }
      return contentTypes
    }
    return this.contentTypes
  }

  async getContentType(contentTypeId: string): Promise<ContentType> {
    return this.contentTypes.find(x => x.id === contentTypeId)
  }

  async getRandomContentElement(contentTypeId: string): Promise<ContentElement> {
    return await this.memDb(CONTENT_ELEMENTS_TABLE)
      .where('contentType', contentTypeId)
      .orderByRaw('random()')
      .limit(1)
      .get(0)
  }

  async createOrUpdateContentElement(
    botId: string,
    contentTypeId: string,
    formData: string,
    contentElementId?: string
  ): Promise<string> {
    contentTypeId = contentTypeId.toLowerCase()
    const contentType = _.find(this.contentTypes, { id: contentTypeId })

    if (contentType === null) {
      throw new Error(`Content type "${contentTypeId}" is not a valid registered content type ID`)
    }

    const contentElement = { formData, ...(await this.fillComputedProps(contentType, formData)) }
    const body = this.transformItemApiToDb(contentElement)

    const isNewItemCreation = !contentElementId
    if (isNewItemCreation) {
      contentElementId = this.getNewContentElementId(contentType.id)
    }

    if (!isNewItemCreation) {
      await this.memDb(CONTENT_ELEMENTS_TABLE)
        .update(body)
        .where({ id: contentElementId })
        .then()
    } else {
      await this.memDb(CONTENT_ELEMENTS_TABLE).insert({
        ...body,
        createdBy: 'admin',
        createdOn: Date.now(), // helpers
        id: contentElementId,
        contentType: contentTypeId
      })
    }

    await this.dumpDataToFile(botId, contentTypeId)
    return contentElementId
  }

  private getNewContentElementId(contentTypeId: string) {
    const prefix = contentTypeId.replace(/^#/, '')
    return `${prefix}-${nanoid(6)}`
  }

  private resolveRefs(data) {
    if (!data) {
      return data
    }
    if (Array.isArray(data)) {
      return Promise.map(data, this.resolveRefs)
    }
    if (_.isObject(data)) {
      return Promise.props(_.mapValues(data, this.resolveRefs))
    }
    if (_.isString(data)) {
      const m = data.match(/^##ref\((.*)\)$/)
      if (!m) {
        return data
      }
      return this.memDb(CONTENT_ELEMENTS_TABLE)
        .select('formData')
        .where('id', m[1])
        .then(result => {
          if (!result || !result.length) {
            throw new Error(`Error resolving reference: ID ${m[1]} not found.`)
          }
          return JSON.parse(result[0].formData)
        })
        .then(this.resolveRefs)
    }
    return data
  }

  private async dumpDataToFile(botId: string, contentTypeId: string) {
    // TODO Do paging here and dump *everything*
    const params = { ...DefaultSearchParams, count: 10000 }
    const items = (await this.listContentElements(botId, contentTypeId, params)).map(item =>
      _.pick(item, 'id', 'formData', 'createdBy', 'createdOn')
    )
    await this.ghost.upsertFile(botId, '/', this.filesById[contentTypeId], JSON.stringify(items, undefined, 2))
  }

  private transformItemApiToDb(item) {
    if (!item) {
      return item
    }

    const result = { ...item }

    if ('formData' in item) {
      result.formData = JSON.stringify(item.formData)
    }
    if ('data' in item) {
      result.data = JSON.stringify(item.data)
    }
    return result
  }

  private async fillComputedProps(contentType: ContentType, formData: string) {
    if (formData == undefined) {
      throw new Error('"formData" must be a valid object')
    }

    const expandedFormData = await this.resolveRefs(formData)
    const computedData = await this.computeData(contentType.id, expandedFormData)
    const previewText = await this.computePreviewText(contentType.id, expandedFormData)

    if (!_.isString(previewText)) {
      throw new Error('computePreviewText must return a string')
    }

    if (computedData == undefined) {
      throw new Error('computeData must return a valid object')
    }

    return {
      computedData,
      previewText
    }
  }

  private computePreviewText(contentTypeId, formData) {
    const contentType = this.contentTypes.find(x => x.id === contentTypeId)
    if (!contentType) {
      throw new Error(`Unknown content type ${contentTypeId}`)
    }
    return !contentType.computePreviewText ? 'No preview' : contentType.computePreviewText(contentTypeId, formData)
  }

  private computeData(contentTypeId, formData) {
    const contentType = this.contentTypes.find(x => x.id === contentTypeId)
    if (!contentType) {
      throw new Error(`Unknown content type ${contentTypeId}`)
    }
    return !contentType.computeData ? formData : contentType.computeData(contentTypeId, formData)
  }
}
