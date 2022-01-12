import {
  ContentElement,
  ContentType,
  CustomContentType,
  IO,
  KnexExtended,
  Logger,
  SearchParams
} from 'botpress/runtime-sdk'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import { IDisposeOnExit } from '../../common/typings'
import { GhostService } from '../bpfs'
import { ConfigProvider } from '../config'
import { LoggerProvider } from '../logger'
import { TYPES } from '../types'

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

const extractPayload = (type: string, data) => {
  return { type, ..._.pickBy(_.omit(data, 'event', 'temp', 'user', 'session', 'bot', 'BOT_URL'), v => v !== undefined) }
}

@injectable()
export class CMSService implements IDisposeOnExit {
  private readonly contentTable = 'content_elements'
  private readonly typesDir = 'content-types'
  private readonly elementsDir = 'content-elements'

  private contentTypesByBot: { [botId: string]: ContentType[] } = {}
  private filesByBotAndId: { [botId: string]: any } = {}
  private sandboxByBot: { [botId: string]: SafeCodeSandbox } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'CMS')
    private logger: Logger,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.InMemoryDatabase) private memDb: KnexExtended
  ) {}

  disposeOnExit() {
    Object.keys(this.sandboxByBot).forEach(botId => this.sandboxByBot[botId]?.dispose())
  }

  async initialize() {
    await this.prepareDb()
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

  async refreshElements(botId: string) {
    await this.clearElementsFromCache(botId)
    await this.loadElementsForBot(botId)
  }

  async clearElementsFromCache(botId: string) {
    await this.memDb(this.contentTable)
      .where({ botId })
      .delete()
  }

  public async loadContentTypesFromFiles(botId: string): Promise<void> {
    const fileNames = await this.ghost.forBot(botId).directoryListing(this.typesDir, '*.js')

    const codeFiles = await Promise.map(fileNames, async filename => {
      const content = <string>await this.ghost.forBot(botId).readFileAsString(this.typesDir, filename)
      const folder = botId
      return <CodeFile>{ code: content, folder, relativePath: path.basename(filename) }
    })

    this.sandboxByBot[botId] = new SafeCodeSandbox(botId, await this.loggerProvider('CMS[Render]'))
    await this.sandboxByBot[botId].addFiles(codeFiles)

    this.contentTypesByBot[botId] = []
    this.filesByBotAndId[botId] = {}

    for (const file of this.sandboxByBot[botId].ls()) {
      try {
        const filename = path.basename(file)
        if (filename.startsWith('_')) {
          // File to exclude
          continue
        }

        await this._loadContentTypeFromFile(file, botId, this.sandboxByBot[botId])
      } catch (err) {
        this.logger.attachError(err).error(`Could not load Content Type "${file}"`)
      }
    }
  }

  private async _loadContentTypeFromFile(fileName: string, botId: string, sandbox): Promise<void> {
    const contentTypeParsed = await sandbox.run(fileName)
    const contentType: ContentType = contentTypeParsed?.default ?? contentTypeParsed

    if (!contentType || !contentType.id) {
      throw new Error(`Invalid content type ${fileName}`)
    }

    this.filesByBotAndId[botId][contentType.id] = `${contentType.id}.json`
    this.contentTypesByBot[botId].push(contentType)
  }

  public async addBotContentType(botId: string, name: string, content: string) {
    const codeFile: CodeFile = { code: content, relativePath: `${name}.js` }

    await this.sandboxByBot[botId].addFile(codeFile)

    const contentTypeParsed = await this.sandboxByBot[botId].run(codeFile.relativePath)
    const customType: CustomContentType = contentTypeParsed.default || contentTypeParsed

    if (!customType.extends) {
      return this.logger.error('A custom component must extend a built-in type')
    }

    const baseType = this.contentTypesByBot[botId].find(x => x.id === customType.extends)
    const customRenderer = (data: any, channel): any => {
      if (channel !== 'web') {
        return extractPayload(baseType!.id.replace('builtin_', ''), data)
      }

      return {
        module: name,
        subType: 'component',
        component: 'default',
        botId: data.event.botId,
        wrapped: extractPayload(baseType!.id.replace('builtin_', ''), data),
        ...extractPayload('custom', data)
      }
    }

    const contentType = _.merge({}, baseType, { renderElement: customRenderer }, customType, { id: name })

    this.filesByBotAndId[botId][contentType.id] = `${contentType.id}.json`
    this.contentTypesByBot[botId].push(contentType)
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

    return Promise.map(elements, el => (language ? this._translateElement(el, language, botId) : el))
  }

  async getContentElement(botId: string, id: string, language?: string): Promise<ContentElement> {
    const element = await this.memDb(this.contentTable)
      .where({ botId, id })
      .first()

    const deserialized = this.transformDbItemToApi(element)
    return language ? this._translateElement(deserialized, language, botId) : deserialized
  }

  async getContentElements(botId: string, ids: string[], language?: string): Promise<ContentElement[]> {
    const elements = await this.memDb(this.contentTable).where(builder => builder.where({ botId }).whereIn('id', ids))

    const apiElements: ContentElement[] = elements.map(this.transformDbItemToApi)
    return Promise.map(apiElements, el => (language ? this._translateElement(el, language, botId) : el))
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

  async getAllContentTypes(botId: string): Promise<ContentType[]> {
    const botConfig = await this.configProvider.getBotConfig(botId)
    const enabledTypes = botConfig.imports.contentTypes || this.contentTypesByBot[botId]
    return Promise.map(enabledTypes, x => this.getContentType(x, botId))
  }

  getContentType(contentTypeId: string, botId: string): ContentType {
    const type = this.contentTypesByBot[botId].find(x => x.id === contentTypeId)
    if (!type) {
      throw new Error(`Content type "${contentTypeId}" is not a valid registered content type ID`)
    }
    return type
  }

  async elementIdExists(botId: string, id: string): Promise<boolean> {
    const element = await this.memDb(this.contentTable)
      .where({ botId, id })
      .first()

    return !!element
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

  private _translateElement(element: ContentElement, language: string, botId: string) {
    return {
      ...element,
      formData: this.getOriginalProps(element.formData, this.getContentType(element.contentType, botId), language)
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

    for (const contentType of this.contentTypesByBot[botId]) {
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
              defaultLanguage,
              botId
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

  private async fillComputedProps(
    contentType: ContentType,
    formData: object,
    languages: string[],
    defaultLanguage: string,
    botId: string
  ) {
    if (formData == null) {
      throw new Error(`"formData" must be a valid object (content type: ${contentType.id})`)
    }

    const expandedFormData = await this.resolveRefs(formData)
    const previews = this.computePreviews(contentType.id, expandedFormData, languages, defaultLanguage, botId)

    return { previews }
  }

  private computePreviews(contentTypeId, formData, languages, defaultLang, botId: string) {
    const contentType = this.contentTypesByBot[botId].find(x => x.id === contentTypeId)

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

      contentTypeRenderer = this.getContentType(content.contentType, botId)
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
      contentTypeRenderer = this.getContentType(contentId.substr(1), botId)
      args = {
        ...args,
        ...(await translateFormData(args))
      }
    } else {
      contentTypeRenderer = this.getContentType(contentId, botId)
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
  private async local__invalidateForBot(botId: string): Promise<void> {
    await this.clearElementsFromCache(botId)
    await this.loadElementsForBot(botId)
  }
}
