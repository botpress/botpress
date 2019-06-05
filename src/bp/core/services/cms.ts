import { IO, Logger } from 'botpress/sdk'
import { ContentElement, ContentType, SearchParams } from 'botpress/sdk'
import { KnexExtension } from 'common/knex'
import { renderRecursive, renderTemplate } from 'core/misc/templating'
import { ModuleLoader } from 'core/module-loader'
import { inject, injectable, tagged } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import nanoid from 'nanoid'
import path from 'path'
import { VError } from 'verror'

import { ConfigProvider } from '../config/config-loader'
import { LoggerProvider } from '../logger/logger'
import { CodeFile, SafeCodeSandbox } from '../misc/code-sandbox'
import { IDisposeOnExit } from '../misc/interfaces'
import { TYPES } from '../types'

import { GhostService } from '.'
import { JobService } from './job-service'

const UNLIMITED_ELEMENTS = -1
export const DefaultSearchParams: SearchParams = {
  sortOrder: [{ column: 'createdOn' }],
  from: 0,
  count: 50
}

@injectable()
export class CMSService implements IDisposeOnExit {
  broadcastAddElement: Function = this.local__addElementToCache
  broadcastUpdateElement: Function = this.local__updateElementFromCache
  broadcastRemoveElements: Function = this.local__removeElementsFromCache

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
    @inject(TYPES.InMemoryDatabase) private memDb: Knex & KnexExtension,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
  ) {}

  disposeOnExit() {
    this.sandbox && this.sandbox.dispose()
  }

  async initialize() {
    this.broadcastAddElement = await this.jobService.broadcast<void>(this.local__addElementToCache.bind(this))
    this.broadcastRemoveElements = await this.jobService.broadcast<void>(this.local__removeElementsFromCache.bind(this))
    this.broadcastUpdateElement = await this.jobService.broadcast<ContentElement>(
      this.local__updateElementFromCache.bind(this)
    )

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

  async loadElementsForBot(botId: string): Promise<any[]> {
    const fileNames = await this.ghost.forBot(botId).directoryListing(this.elementsDir, '*.json')
    let contentElements: ContentElement[] = []

    for (const fileName of fileNames) {
      const contentType = path.basename(fileName).replace(/.json$/i, '')
      const fileContentElements = await this.ghost
        .forBot(botId)
        .readFileAsObject<ContentElement[]>(this.elementsDir, fileName)

      fileContentElements.forEach(el => Object.assign(el, { contentType }))
      contentElements = _.concat(contentElements, fileContentElements)
    }

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
      throw new Error('Invalid content type ' + fileName)
    }

    this.filesById[contentType.id] = contentType.id + '.json'
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

    filters &&
      filters.forEach(filter => {
        query = query.andWhere(filter.column, 'like', `%${filter.value}%`)
      })

    sortOrder &&
      sortOrder.forEach(sort => {
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
      .get(0)

    const deserialized = this.transformDbItemToApi(element)
    return language ? this._translateElement(deserialized, language) : deserialized
  }

  async getContentElements(botId: string, ids: string[], language?: string): Promise<ContentElement[]> {
    const elements = await this.memDb(this.contentTable).where(builder => builder.where({ botId }).whereIn('id', ids))

    const apiElements: ContentElement[] = elements.map(this.transformDbItemToApi)
    return Promise.map(apiElements, el => (language ? this._translateElement(el, language) : el))
  }

  async countContentElements(botId: string): Promise<number> {
    return this.memDb(this.contentTable)
      .where({ botId })
      .count('* as count')
      .get(0)
      .then(row => (row && Number(row.count)) || 0)
  }

  async countContentElementsForContentType(botId: string, contentType: string): Promise<number> {
    return this.memDb(this.contentTable)
      .where({ botId })
      .andWhere({ contentType })
      .count('* as count')
      .get(0)
      .then(row => (row && Number(row.count)) || 0)
  }

  async deleteContentElements(botId: string, ids: string[]): Promise<void> {
    const elements = await this.getContentElements(botId, ids)
    await Promise.map(elements, el => this.moduleLoader.onElementChanged(botId, 'delete', el))

    await this.broadcastRemoveElements(botId, ids)

    const contentTypes = _.uniq(_.map(elements, 'contentType'))
    await Promise.mapSeries(contentTypes, contentTypeId => this._writeElementsToFile(botId, contentTypeId))
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

  async getRandomContentElement(contentTypeId: string): Promise<ContentElement> {
    return this.memDb(this.contentTable)
      .where('contentType', contentTypeId)
      .orderByRaw('random()')
      .limit(1)
      .get(0)
  }

  private _generateElementId(contentTypeId: string): string {
    const prefix = contentTypeId.replace(/^#/, '')
    return `${prefix}-${nanoid(6)}`
  }

  async createOrUpdateContentElement(
    botId: string,
    contentTypeId: string,
    formData: object,
    contentElementId?: string,
    language?: string
  ): Promise<string> {
    process.ASSERT_LICENSED()
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
    process.ASSERT_LICENSED()
    const params = { ...DefaultSearchParams, count: 10000 }
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
      // @ts-ignore
      await this.memDb(this.contentTable)
        .select('id', 'formData', 'botId')
        .where('contentType', contentType.id)
        .andWhere({ botId })
        .then()
        .each(async (element: any) => {
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
    }
  }

  private async fillComputedProps(contentType: ContentType, formData: object, languages: string[], defaultLanguage) {
    if (formData == undefined) {
      throw new Error('"formData" must be a valid object')
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
        let preview = contentType.computePreviewText(translated)

        if (!preview) {
          const defaultTranslation = this.getOriginalProps(formData, contentType, defaultLang)
          preview = '(missing translation) ' + contentType.computePreviewText(defaultTranslation)
        }

        result[lang] = preview
      }

      return result
    }, {})
  }

  async translateContentProps(botId, fromLang, toLang) {
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
    return Object.keys(formData).find(x => x.endsWith('$' + lang))
  }

  // This methods finds the translated property and returns the original properties
  private getOriginalProps(formData: object, contentType: ContentType, lang: string, defaultLang?: string) {
    const originalProps = Object.keys(_.get(contentType, 'jsonSchema.properties'))

    if (originalProps) {
      return originalProps.reduce((result, key) => {
        result[key] = formData[key + '$' + lang] || (defaultLang && formData[key + '$' + defaultLang])
        return result
      }, {})
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

  async renderElement(contentId, args, eventDestination: IO.EventDestination) {
    const { botId, channel } = eventDestination
    contentId = contentId.replace(/^#?/i, '')
    let contentTypeRenderer

    if (contentId.startsWith('!')) {
      const content = await this.getContentElement(botId, contentId.substr(1)) // TODO handle errors
      if (!content) {
        throw new Error(`Content element "${contentId}" not found`)
      }

      contentTypeRenderer = this.getContentType(content.contentType)

      const defaultLang = (await this.configProvider.getBotConfig(eventDestination.botId)).defaultLanguage
      const lang = _.get(args, 'event.state.user.language')

      const translated = await this.getOriginalProps(content.formData, contentTypeRenderer, lang, defaultLang)
      content.formData = translated

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
    } else {
      contentTypeRenderer = await this.getContentType(contentId)
      if (args.text) {
        args = {
          ...args,
          text: renderTemplate(args.text, args)
        }
      }
    }

    const additionnalData = { BOT_URL: process.EXTERNAL_URL }

    let payloads = await contentTypeRenderer.renderElement({ ...additionnalData, ...args }, channel)
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
}
