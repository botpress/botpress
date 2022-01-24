import { ContentElement, ContentType, IO, KnexExtended, Logger, SearchParams } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { JobService } from 'core/distributed'
import { EventEngine } from 'core/events'
import { LoggerProvider } from 'core/logger'
import { MediaServiceProvider } from 'core/media'
import { ModuleLoader } from 'core/modules'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import { nanoid } from 'nanoid'
import path from 'path'
import { VError } from 'verror'

import { IDisposeOnExit } from '../../common/typings'

import { CodeFile, SafeCodeSandbox } from './code-sandbox'
import { renderRecursive, renderTemplate } from './templating'

const UNLIMITED_ELEMENTS = -1
export const DefaultSearchParams: SearchParams = {
  sortOrder: [{ column: 'createdOn' }],
  from: 0,
  count: 50
}

export const CmsImportSchema = Joi.array().items(
  Joi.object().keys({
    id: Joi.string().required(),
    contentType: Joi.string().required(),
    formData: Joi.object().required()
  })
)

@injectable()
export class CMSService implements IDisposeOnExit {
  broadcastAddElement: Function = this.local__addElementToCache
  broadcastUpdateElement: Function = this.local__updateElementFromCache
  broadcastRemoveElements: Function = this.local__removeElementsFromCache
  broadcastInvalidateForBot: Function = this.local__invalidateForBot

  private readonly contentTable = 'content_elements'
  private readonly typesDir = 'content-types'
  private readonly elementsDir = 'content-elements'

  private contentTypes: ContentType[] = []
  private filesById = {}
  private sandbox!: SafeCodeSandbox

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'CMS')
    private logger: Logger,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.InMemoryDatabase) private memDb: KnexExtended,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MediaServiceProvider) private mediaServiceProvider: MediaServiceProvider,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine
  ) {}

  disposeOnExit() {
    this.sandbox?.dispose()
  }

  async initialize() {
    this.broadcastAddElement = await this.jobService.broadcast<void>(this.local__addElementToCache.bind(this))
    this.broadcastRemoveElements = await this.jobService.broadcast<void>(this.local__removeElementsFromCache.bind(this))
    this.broadcastUpdateElement = await this.jobService.broadcast<ContentElement>(
      this.local__updateElementFromCache.bind(this)
    )
    this.broadcastInvalidateForBot = await this.jobService.broadcast<string>(this.local__invalidateForBot.bind(this))

    await this.prepareDb()
    await this._loadContentTypesFromFiles()
  }

  private async prepareDb() {
    await this.memDb.createTableIfNotExists(this.contentTable, table => {
      table.string('id')
      table.string('botId')
      table.primary(['id', 'botId'])
      table.string('contentType')
      table.text('formData')
      table.jsonb('previews')
      table.string('createdBy')
      table.timestamp('createdOn')
      table.timestamp('modifiedOn')
    })
  }

  async getAllElements(botId: string): Promise<ContentElement[]> {
    const fileNames = await this.ghost.forBot(botId).directoryListing(this.elementsDir, '*.json', 'library.json')
    let contentElements: ContentElement[] = []

    for (const fileName of fileNames) {
      try {
        const contentType = path.basename(fileName).replace(/\.json$/i, '')
        const fileContentElements = await this.ghost
          .forBot(botId)
          .readFileAsObject<ContentElement[]>(this.elementsDir, fileName)

        fileContentElements.forEach(el => Object.assign(el, { contentType }))
        contentElements = _.concat(contentElements, fileContentElements)
      } catch (err) {
        throw new Error(`while processing elements of "${fileName}": ${err}`)
      }
    }

    return contentElements
  }

  async loadElementsForBot(botId: string): Promise<any[]> {
    try {
      const contentElements = await this.getAllElements(botId)

      const elements = await Promise.map(contentElements, element => {
        return this.memDb(this.contentTable)
          .insert(this.transformItemApiToDb(botId, element))
          .catch(err => {
            // ignore duplicate key errors
            // TODO: Knex error handling
          })
      })

      await this.recomputeElementsForBot(botId)

      return elements
    } catch (err) {
      throw new Error(`while processing content elements: ${err}`)
    }
  }

  async deleteAllElements(botId: string): Promise<void> {
    const files = await this.ghost.forBot(botId).directoryListing(this.elementsDir, '*.json')
    await Promise.map(files, file => this.ghost.forBot(botId).deleteFile(this.elementsDir, file))
    await this.clearElementsFromCache(botId)
  }

  async clearElementsFromCache(botId: string) {
    await this.memDb(this.contentTable)
      .where({ botId })
      .delete()
  }

  private async _loadContentTypesFromFiles(): Promise<void> {
    const fileNames = await this.ghost.global().directoryListing(this.typesDir, '*.js')

    const codeFiles = await Promise.map(fileNames, async filename => {
      const content = <string>await this.ghost.global().readFileAsString(this.typesDir, filename)
      const folder = path.dirname(filename)
      return <CodeFile>{ code: content, folder, relativePath: path.basename(filename) }
    })

    this.sandbox = new SafeCodeSandbox(codeFiles, await this.loggerProvider('CMS[Render]'))
    let filesLoaded = 0

    for (const file of this.sandbox.ls()) {
      try {
        const filename = path.basename(file)
        if (filename.startsWith('_')) {
          // File to exclude
          continue
        }
        await this._loadContentTypeFromFile(file)
        filesLoaded++
      } catch (err) {
        this.logger.attachError(err).error(`Could not load Content Type "${file}"`)
      }
    }

    this.logger.info(`Loaded ${filesLoaded} content types`)
  }

  private async _loadContentTypeFromFile(fileName: string): Promise<void> {
    const contentType = <ContentType>await this.sandbox.run(fileName)

    if (!contentType || !contentType.id) {
      throw new Error(`Invalid content type ${fileName}`)
    }

    this.filesById[contentType.id] = `${contentType.id}.json`
    this.contentTypes.push(contentType)
  }

  async listContentElements(
    botId: string,
    contentTypeId?: string,
    params: SearchParams = DefaultSearchParams,
    language?: string
  ): Promise<ContentElement[]> {
    const { searchTerm, ids, filters, sortOrder, from, count } = params

    let query = this.memDb(this.contentTable)
    query = query.where({ botId })

    if (contentTypeId) {
      query = query.andWhere('contentType', contentTypeId)
    }

    if (searchTerm) {
      query = query.andWhere(builder =>
        builder.where('formData', 'like', `%${searchTerm}%`).orWhere('id', 'like', `%${searchTerm}%`)
      )
    }

    if (ids) {
      query = query.andWhere(builder => builder.whereIn('id', ids))
    }

    filters?.forEach(filter => {
      query = query.andWhere(filter.column, 'like', `%${filter.value}%`)
    })

    sortOrder?.forEach(sort => {
      query = query.orderBy(sort.column, sort.desc ? 'desc' : 'asc')
    })

    if (count !== UNLIMITED_ELEMENTS) {
      query = query.limit(count)
    }

    const dbElements = await query.offset(from)
    const elements: ContentElement[] = dbElements.map(this.transformDbItemToApi)

    return Promise.map(elements, el => (language ? this._translateElement(el, language) : el))
  }

  async getContentElement(botId: string, id: string, language?: string): Promise<ContentElement> {
    const element = await this.memDb(this.contentTable)
      .where({ botId, id })
      .first()

    const deserialized = this.transformDbItemToApi(element)
    return language ? this._translateElement(deserialized, language) : deserialized
  }

  async getContentElements(botId: string, ids: string[], language?: string): Promise<ContentElement[]> {
    const elements = await this.memDb(this.contentTable).where(builder => builder.where({ botId }).whereIn('id', ids))

    const apiElements: ContentElement[] = elements.map(this.transformDbItemToApi)
    return Promise.map(apiElements, el => (language ? this._translateElement(el, language) : el))
  }

  async countContentElements(botId?: string): Promise<number> {
    let query = this.memDb(this.contentTable)

    if (botId) {
      query = query.where({ botId })
    }

    return query
      .count('* as count')
      .first()
      .then(row => (row && Number(row.count)) || 0)
  }

  async deleteContentElements(botId: string, ids: string[]): Promise<void> {
    const elements = await this.getContentElements(botId, ids)
    await Promise.map(elements, el => this.moduleLoader.onElementChanged(botId, 'delete', el))

    await this.broadcastRemoveElements(botId, ids)

    this.deleteMedia(botId, elements)

    const contentTypes = _.uniq(_.map(elements, 'contentType'))
    await Promise.mapSeries(contentTypes, contentTypeId => this._writeElementsToFile(botId, contentTypeId))
  }

  getMediaFiles(formData): string[] {
    const media = '/media/'
    const iterator = (result: string[], value, key: string) => {
      if (key.startsWith('image') && value && value.includes(media)) {
        result.push(value.substr(value.indexOf(media) + media.length))
      } else if (key.startsWith('items$') && value.length) {
        value.forEach(e => _.reduce(e, iterator, result))
      }
      return result
    }
    return _.reduce(formData, iterator, []).filter(Boolean)
  }

  deleteMedia(botId: string, elements: ContentElement[]) {
    const mediaService = this.mediaServiceProvider.forBot(botId)
    _.map(elements, 'formData').forEach(formData => {
      const filesToDelete = this.getMediaFiles(formData)
      filesToDelete.forEach(f => mediaService.deleteFile(f))
    })
  }

  async getAllContentTypes(botId?: string): Promise<ContentType[]> {
    if (botId) {
      const botConfig = await this.configProvider.getBotConfig(botId)
      const enabledTypes = botConfig.imports.contentTypes || []
      return Promise.map(enabledTypes, x => this.getContentType(x))
    }

    return this.contentTypes
  }

  getContentType(contentTypeId: string): ContentType {
    const type = this.contentTypes.find(x => x.id === contentTypeId)
    if (!type) {
      throw new Error(`Content type "${contentTypeId}" is not a valid registered content type ID`)
    }
    return type
  }

  private _generateElementId(contentTypeId: string): string {
    const prefix = contentTypeId.replace(/^#/, '')
    return `${prefix}-${nanoid(6)}`
  }

  async elementIdExists(botId: string, id: string): Promise<boolean> {
    const element = await this.memDb(this.contentTable)
      .where({ botId, id })
      .first()

    return !!element
  }

  async createOrUpdateContentElement(
    botId: string,
    contentTypeId: string,
    formData: object,
    contentElementId?: string,
    language?: string
  ): Promise<string> {
    process.ASSERT_LICENSED?.()
    contentTypeId = contentTypeId.toLowerCase()
    const contentType = _.find(this.contentTypes, { id: contentTypeId })

    if (!contentType) {
      throw new Error(`Content type "${contentTypeId}" is not a valid registered content type ID`)
    }

    const { languages, defaultLanguage } = await this.configProvider.getBotConfig(botId)

    // If language is specified, we update only the one specified. This is mostly for requests made with the SDK
    if (language) {
      // If we are editing an existing content elements, we need to fetch other translations to merge them so they aren't lost
      if (contentElementId) {
        formData = {
          ...(await this.getContentElement(botId, contentElementId)).formData,
          ...this.getTranslatedProps(formData, language)
        }
      } else {
        formData = this.getTranslatedProps(formData, language)
      }
    }

    const contentElement = {
      formData,
      ...(await this.fillComputedProps(contentType, formData, languages, defaultLanguage))
    }
    const body = this.transformItemApiToDb(botId, contentElement)

    if (!contentElementId) {
      contentElementId = this._generateElementId(contentTypeId)
    }

    if (!(await this.elementIdExists(botId, contentElementId))) {
      await this.broadcastAddElement(botId, body, contentElementId, contentType.id)
      const created = await this.getContentElement(botId, contentElementId)

      await this.moduleLoader.onElementChanged(botId, 'create', created)
    } else {
      const originalElement = await this.getContentElement(botId, contentElementId)
      const updatedElement = await this.broadcastUpdateElement(botId, body, contentElementId)

      await this.moduleLoader.onElementChanged(botId, 'update', updatedElement, originalElement)
    }

    await this._writeElementsToFile(botId, contentTypeId)
    return contentElementId
  }

  resolveRefs = data => {
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
      return this.memDb(this.contentTable)
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

  private async _writeElementsToFile(botId: string, contentTypeId: string) {
    process.ASSERT_LICENSED?.()
    const params = { ...DefaultSearchParams, count: UNLIMITED_ELEMENTS }
    const elements = (await this.listContentElements(botId, contentTypeId, params)).map(element =>
      _.pick(element, 'id', 'formData', 'createdBy', 'createdOn', 'modifiedOn')
    )
    const fileName = this.filesById[contentTypeId]
    const content = JSON.stringify(elements, undefined, 2)

    await this.ghost.forBot(botId).upsertFile(this.elementsDir, fileName, content)
  }

  private _translateElement(element: ContentElement, language: string) {
    return {
      ...element,
      formData: this.getOriginalProps(element.formData, this.getContentType(element.contentType), language)
    }
  }

  private transformDbItemToApi(item: any): ContentElement {
    if (!item) {
      return item
    }

    return {
      ...item,
      formData: JSON.parse(item.formData),
      previews: item.previews && JSON.parse(item.previews)
    }
  }

  private transformItemApiToDb(botId: string, element) {
    if (!element) {
      return element
    }

    const result = { ...element, botId }

    if ('formData' in element && typeof element.formData !== 'string') {
      result.formData = JSON.stringify(element.formData)
    }

    if (element.previews) {
      result.previews = JSON.stringify(element.previews)
    }

    return result
  }

  async recomputeElementsForBot(botId: string): Promise<void> {
    const { languages, defaultLanguage } = await this.configProvider.getBotConfig(botId)

    for (const contentType of this.contentTypes) {
      let elementId
      try {
        await this.memDb(this.contentTable)
          .select('id', 'formData', 'botId')
          .where('contentType', contentType.id)
          .andWhere({ botId })
          .then<Iterable<any>>()
          .each(async (element: any) => {
            elementId = element.id
            const computedProps = await this.fillComputedProps(
              contentType,
              JSON.parse(element.formData),
              languages,
              defaultLanguage
            )
            element = { ...element, ...computedProps }

            return this.memDb(this.contentTable)
              .where('id', element.id)
              .andWhere({ botId })
              .update(this.transformItemApiToDb(botId, element))
              .catch(err => {
                throw new VError(err, `Could not update the element for ID "${element.id}"`)
              })
          })
      } catch (err) {
        throw new Error(`while computing elements of type "${contentType.id}" (element: ${elementId}): ${err}`)
      }
    }
  }

  private async fillComputedProps(contentType: ContentType, formData: object, languages: string[], defaultLanguage) {
    if (formData == null) {
      throw new Error(`"formData" must be a valid object (content type: ${contentType.id})`)
    }

    const expandedFormData = await this.resolveRefs(formData)
    const previews = this.computePreviews(contentType.id, expandedFormData, languages, defaultLanguage)

    return { previews }
  }

  private computePreviews(contentTypeId, formData, languages, defaultLang) {
    const contentType = this.contentTypes.find(x => x.id === contentTypeId)

    if (!contentType) {
      throw new Error(`Unknown content type ${contentTypeId}`)
    }

    return languages.reduce((result, lang) => {
      if (!contentType.computePreviewText) {
        result[lang] = 'No preview'
      } else {
        const translated = this.getOriginalProps(formData, contentType, lang)
        let preview = contentType.computePreviewText({ ...translated, ...this._getAdditionalData() })

        if (!preview) {
          const defaultTranslation = this.getOriginalProps(formData, contentType, defaultLang)
          preview = `(missing translation) ${contentType.computePreviewText({
            ...defaultTranslation,
            ...this._getAdditionalData()
          })}`
        }

        result[lang] = preview
      }

      return result
    }, {})
  }

  async translateContentProps(botId: string, fromLang: string | undefined, toLang: string) {
    const elements = await this.listContentElements(botId, undefined, { from: 0, count: UNLIMITED_ELEMENTS })

    for (const el of elements) {
      if (!fromLang) {
        // Translating a bot content from the original props
        const translatedProps = this.getTranslatedProps(el.formData, toLang)
        await this.createOrUpdateContentElement(botId, el.contentType, translatedProps, el.id)
      } else {
        // When switching default language, we make sure that the default one has all content elements
        if (!this._hasTranslation(el.formData, toLang)) {
          const contentType = this.contentTypes.find(x => x.id === el.contentType)
          const originalProps = this.getOriginalProps(el.formData, contentType!, fromLang)
          const translatedProps = this.getTranslatedProps(originalProps, toLang)

          await this.createOrUpdateContentElement(botId, el.contentType, { ...el.formData, ...translatedProps }, el.id)
        }
      }
    }
  }

  private _hasTranslation(formData: object, lang: string) {
    return Object.keys(formData).find(x => x.endsWith(`$${lang}`))
  }

  // This methods finds the translated property and returns the original properties
  private getOriginalProps(formData: object, contentType: ContentType, lang: string, defaultLang?: string) {
    const originalProps = Object.keys(_.get(contentType, 'jsonSchema.properties'))

    // When data is accessible through a single key containing the '$' separator. e.g. { 'text$en': '...' }
    const separatorExtraction = (prop: string) =>
      formData[`${prop}$${lang}`] || (defaultLang && formData[`${prop}$${defaultLang}`])

    // When data is accessible through keys of a nested dictionary. e.g. { 'text': { 'en': '...' } }
    const nestedDictExtraction = (prop: string) =>
      formData[prop] && (formData[prop][lang] || (defaultLang && formData[prop][defaultLang]))

    if (originalProps) {
      return originalProps.reduce(
        (result, prop) => ((result[prop] = separatorExtraction(prop) || nestedDictExtraction(prop)), result),
        {}
      )
    } else {
      return formData
    }
  }

  // It takes the original properties, and returns an object with the translated properties (copied content)
  private getTranslatedProps(formData: object, lang: string) {
    return Object.keys(formData).reduce((result, key) => {
      const theKey = key.split('$')[0]
      result[`${theKey}$${lang}`] = formData[key]
      return result
    }, {})
  }

  private _getAdditionalData() {
    return { BOT_URL: process.EXTERNAL_URL }
  }

  async renderElement(contentId: string, args, eventDestination: IO.EventDestination) {
    const { botId, channel } = eventDestination
    contentId = contentId.replace(/^#?/i, '')
    let contentTypeRenderer: ContentType

    const translateFormData = async (formData: object): Promise<object> => {
      const defaultLang = (await this.configProvider.getBotConfig(eventDestination.botId)).defaultLanguage
      const userLang = _.get(args, 'event.state.user.language')

      return this.getOriginalProps(formData, contentTypeRenderer, userLang, defaultLang)
    }

    if (contentId.startsWith('!')) {
      const content = await this.getContentElement(botId, contentId.substr(1)) // TODO handle errors
      if (!content) {
        throw new Error(`Content element "${contentId}" not found`)
      }

      contentTypeRenderer = this.getContentType(content.contentType)
      content.formData = await translateFormData(content.formData)

      _.set(content, 'formData', renderRecursive(content.formData, args))

      const text = _.get(content.formData, 'text')
      const variations = _.get(content.formData, 'variations')

      const message = _.sample([text, ...(variations || [])])
      if (message) {
        _.set(content, 'formData.text', renderTemplate(message, args))
      }

      args = {
        ...args,
        ...content.formData
      }
    } else if (contentId.startsWith('@')) {
      contentTypeRenderer = this.getContentType(contentId.substr(1))
      args = {
        ...args,
        ...(await translateFormData(args))
      }
    } else {
      contentTypeRenderer = this.getContentType(contentId)
    }

    if (args.text) {
      args = {
        ...args,
        text: renderTemplate(args.text, args)
      }
    }

    let payloads = contentTypeRenderer.renderElement({ ...this._getAdditionalData(), ...args }, channel)
    if (!_.isArray(payloads)) {
      payloads = [payloads]
    }

    return payloads
  }

  /**
   * Important! Do not use directly. Needs to be broadcasted.
   */
  private async local__removeElementsFromCache(botId: string, elementIds: string[]): Promise<void> {
    await this.memDb(this.contentTable)
      .where({ botId })
      .whereIn('id', elementIds)
      .del()
  }

  /**
   * Important! Do not use directly. Needs to be broadcasted.
   */
  private async local__updateElementFromCache(
    botId: string,
    body: object,
    contentElementId: string
  ): Promise<ContentElement> {
    await this.memDb(this.contentTable)
      .update({ ...body, modifiedOn: this.memDb.date.now() })
      .where({ id: contentElementId, botId })

    return this.getContentElement(botId, contentElementId)
  }

  /**
   * Important! Do not use directly. Needs to be broadcasted.
   */
  private async local__addElementToCache(
    botId: string,
    body: object,
    elementId: string,
    contentTypeId: string
  ): Promise<void> {
    await this.memDb(this.contentTable).insert({
      ...body,
      createdBy: 'admin',
      createdOn: this.memDb.date.now(),
      modifiedOn: this.memDb.date.now(),
      id: elementId,
      contentType: contentTypeId
    })
  }

  /**
   * Important! Do not use directly. Needs to be broadcasted.
   */
  private async local__invalidateForBot(botId: string): Promise<void> {
    await this.clearElementsFromCache(botId)
    await this.loadElementsForBot(botId)
  }
}
