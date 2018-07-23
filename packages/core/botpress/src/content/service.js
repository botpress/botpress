/**
 * The Content Manager is mainly in charge of storing and retrieving
 * all the content that is stored and known by the bot. The content includes (but is not limited to)
 * the messages that the bot sends to users.
 * @see {@link https://botpress.io/docs/10.0/getting_started/trivia_content/}
 * @namespace  ContentManager
 * @example
 * bp.contentManager
 */

import path from 'path'
import fs from 'fs'

import { VError } from 'verror'

import _ from 'lodash'
import Promise from 'bluebird'
import glob from 'glob'
import mkdirp from 'mkdirp'
import nanoid from 'nanoid'
import json5 from 'json5'

import helpers from '../database/helpers'
import { getInMemoryDb } from '../util'

const getNewItemId = category => {
  const prefix = (category.renderer || category.id).replace(/^#/, '')
  return `${prefix}-${nanoid(6)}`
}

const prepareDb = async () => {
  const knex = getInMemoryDb()

  // NB! This is in-memory temprorary database
  // It is freshly created so we know there are no tables
  // We also use camelCased columns for convenience
  await knex.schema.createTable('content_items', table => {
    table.string('id').primary()
    table.text('data')
    table.text('formData')
    table.text('metadata')
    table.string('categoryId')
    table.text('previewText')
    table.string('createdBy')
    table.timestamp('createdOn')
  })

  return knex
}

const defaults = {
  contentDir: './content',
  contentDataDir: './content_data'
}

module.exports = async ({ botfile, projectLocation, logger, ghostManager }) => {
  const categories = []
  const categoryById = {}
  const fileById = {}

  const getItemProviders = {}

  const contentDir = path.resolve(projectLocation, botfile.contentDir || defaults.contentDir)
  const contentDataDir = path.resolve(projectLocation, botfile.contentDataDir || defaults.contentDataDir)

  const knex = await prepareDb()

  const transformItemDbToApi = item => {
    if (!item) {
      return item
    }

    return {
      ...item,
      data: JSON.parse(item.data),
      formData: JSON.parse(item.formData),
      metadata: (item.metadata || '').split('|').filter(i => i.length > 0)
    }
  }

  const transformItemApiToDb = item => {
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
    if ('metadata' in item) {
      result.metadata = '|' + (item.metadata || []).filter(i => !!i).join('|') + '|'
    }

    return result
  }

  /**
   * @typedef {Object} ContentManager~Element
   * @memberOf ContentManager
   */

  /**
   * @typedef {Object} ContentManager~CategorySchema
   * @memberOf ContentManager
   * @prop {Object} json The JSONSchema
   * @prop {String} ui The UI JSONSchema
   * @property {String} description
   * @property {String} renderer The name of the Content Renderer
   */

  /**
   * @typedef {Object} ContentManager~Category
   * @memberOf ContentManager
   * @prop {String} id
   * @prop {String} title
   * @property {String} description
   * @property {Number} count The number of elements in that category
   * @property {ContentManager~CategorySchema} schema
   */

  /**
   * Returns the elements of a given category
   * @param  {String} categoryId The category, for example `text` or `trivia`.
   * @param  {Number} [options.from=0] Pagination parameter (where to start)
   * @param  {Number} [options.count=50] Pagination parameter (how many elements to return)
   * @param  {String} [options.searchTerm=] Only return the elements containing this term
   * @param  {Array.<String>}  [options.orderBy=['createdOn']]    A list of properties to order the elements by.
   * @return {ContentManager~Element[]}
   * @public
   * @memberOf! ContentManager
   */
  const listCategoryItems = async (categoryId, { from = 0, count = 50, searchTerm, orderBy = ['createdOn'] } = {}) => {
    let query = knex('content_items')

    if (categoryId) {
      query = query.where({ categoryId })
    }

    if (searchTerm) {
      query = query.where(function() {
        this.where('metadata', 'like', `%${searchTerm}%`)
          .orWhere('formData', 'like', `%${searchTerm}%`)
          .orWhere('id', 'like', `%${searchTerm}%`)
      })
    }

    const items = await query
      .orderBy(...orderBy)
      .offset(from)
      .limit(count)
      .then()

    return items.map(transformItemDbToApi)
  }

  const dumpDataToFile = async categoryId => {
    // TODO Do paging here and dump *everything*
    const items = (await listCategoryItems(categoryId, { count: 10000 })).map(item =>
      _.pick(item, 'id', 'formData', 'createdBy', 'createdOn')
    )

    await ghostManager.upsertFile(contentDataDir, fileById[categoryId], JSON.stringify(items, null, 2))
  }

  const dumpAllDataToFiles = () => Promise.map(categories, ({ id }) => dumpDataToFile(id))

  /**
   * Get the schema for a given category
   * @param  {String} categoryId [description]
   * @return {ContentManager~CategorySchema}
   */
  const getCategorySchema = categoryId => {
    const category = _.find(categories, { id: categoryId })
    if (category == null) {
      return null
    }

    return {
      json: category.jsonSchema,
      ui: category.uiSchema,
      title: category.title,
      description: category.description,
      renderer: category.renderer
    }
  }

  /**
   * Returns all the categories
   * @public
   * @return {ContentManager~Category[]}
   * @memberOf! ContentManager
   */
  const listAvailableCategories = () =>
    Promise.map(categories, async category => {
      const count = await knex('content_items')
        .where({ categoryId: category.id })
        .count('* as count')
        .get(0)
        .then(row => (row && Number(row.count)) || 0)

      return {
        id: category.id,
        title: category.title,
        description: category.description,
        count,
        schema: getCategorySchema(category.id)
      }
    })

  const resolveRefs = async data => {
    if (!data) {
      return data
    }
    if (Array.isArray(data)) {
      return Promise.map(data, resolveRefs)
    }
    if (_.isObject(data)) {
      return Promise.props(_.mapValues(data, resolveRefs))
    }
    if (_.isString(data)) {
      const m = data.match(/^##ref\((.*)\)$/)
      if (!m) {
        return data
      }
      return knex('content_items')
        .select('formData')
        .where('id', m[1])
        .then(result => {
          if (!result || !result.length) {
            throw new Error(`Error resolving reference: ID ${m[1]} not found.`)
          }
          return JSON.parse(result[0].formData)
        })
        .then(resolveRefs)
    }
    return data
  }

  const computeData = async (categoryId, formData) => {
    const category = categoryById[categoryId]
    if (!category) {
      throw new Error(`Unknown category ${categoryId}`)
    }
    return !category.computeData ? formData : category.computeData(formData, computeData)
  }

  const computeMetadata = async (categoryId, formData) => {
    const category = categoryById[categoryId]
    if (!category) {
      throw new Error(`Unknown category ${categoryId}`)
    }
    return !category.computeMetadata ? [] : category.computeMetadata(formData, computeMetadata)
  }

  const computePreviewText = async (categoryId, formData) => {
    const category = categoryById[categoryId]
    if (!category) {
      throw new Error(`Unknown category ${categoryId}`)
    }
    return !category.computePreviewText ? 'No preview' : category.computePreviewText(formData, computePreviewText)
  }

  const fillComputedProps = async (category, formData) => {
    if (formData == null) {
      throw new Error('"formData" must be a valid object')
    }

    const expandedFormData = await resolveRefs(formData)

    const data = await computeData(category.id, expandedFormData)
    const metadata = await computeMetadata(category.id, expandedFormData)
    const previewText = await computePreviewText(category.id, expandedFormData)

    if (!_.isArray(metadata)) {
      throw new Error('computeMetadata must return an array of strings')
    }

    if (!_.isString(previewText)) {
      throw new Error('computePreviewText must return a string')
    }

    if (data == null) {
      throw new Error('computeData must return a valid object')
    }

    return {
      data,
      metadata,
      previewText
    }
  }

  /**
   * Creates or updates an [Element]{@link ContentManager~Element}
   * @param  {String} [options.itemId=] The id of the element to add
   * @param  {String} options.categoryId The category of the element
   * @param  {Object} options.formData The content of the element
   * @async
   * @public
   * @memberOf! ContentManager
   */
  const createOrUpdateCategoryItem = async ({ itemId, categoryId, formData }) => {
    categoryId = categoryId && categoryId.toLowerCase()
    const category = _.find(categories, { id: categoryId })

    if (category == null) {
      throw new Error(`Category "${categoryId}" is not a valid registered categoryId`)
    }

    const item = { formData, ...(await fillComputedProps(category, formData)) }
    const body = transformItemApiToDb(item)

    const isNewItemCreation = !itemId
    if (isNewItemCreation) {
      itemId = getNewItemId(category)
    }

    if (!isNewItemCreation) {
      await knex('content_items')
        .update(body)
        .where({ id: itemId })
        .then()
    } else {
      await knex('content_items').insert({
        ...body,
        createdBy: 'admin',
        createdOn: helpers(knex).date.now(),
        id: itemId,
        categoryId
      })
    }

    await dumpDataToFile(categoryId)
    return itemId
  }

  const categoryItemsCount = categoryId => {
    let q = knex('content_items')
    if (categoryId && categoryId !== 'all') {
      q = q.where({ categoryId })
    }
    return q.count('id as count').then(([res]) => Number(res.count))
  }

  const deleteCategoryItems = async ids => {
    if (!_.isArray(ids) || _.some(ids, id => !_.isString(id))) {
      throw new Error('Expected an array of Ids to delete')
    }

    await knex('content_items')
      .whereIn('id', ids)
      .del()
      .then()

    return dumpAllDataToFiles()
  }

  const getItemDefault = async id => {
    return knex('content_items')
      .where({ id })
      .get(0)
  }

  /**
   * Retrieves one item
   * @param  {String} query Usually the id of the {@link ContentManager.Element},
   * but can also be a call to a {@link ContentManager.ElementProvider}.
   * @return {ContentManager.ElementProvider}
   * @memberof! ContentManager
   * @example
   * await bp.contentManager.getItem('#!trivia-12345')
   * await bp.contentManager.getItem('#trivia-random()')
   */
  const getItem = async query => {
    const providerRegex = /-(.+)\((.*)\)$/i

    const pMatch = query.match(providerRegex)
    let item

    if (pMatch) {
      const provider = pMatch[1].toLowerCase()
      const args = pMatch[2]
      const categoryName = query.substr(0, query.length - pMatch[0].length)

      const fn = getItemProviders[provider]

      if (!fn) {
        throw new Error(`Invalid content expression "${query}", did you forget to register the "${provider}" provider?`)
      }

      item = await fn(knex, categoryName, args)

      if (_.isArray(item)) {
        throw new Error(`Provider "${provider}" returned an array instead of an object`)
      }
    } else {
      item = await getItemDefault(query)
    }

    if (!item) {
      return null
    }

    const category = _.find(categories, { id: item.categoryId })

    return {
      ...transformItemDbToApi(item),
      categoryTitle: category.title,
      categorySchema: getCategorySchema(item.categoryId)
    }
  }

  /**
   * Retrieves multiple items
   * @param  {String} query Comma-separted string where each part is
   * the same as an argument to {@link ContentManager.getItem}.
   * @return {Array<ContentManager.ElementProvider>}
   * @memberof! ContentManager
   * @example
   * await bp.contentManager.getItems('#!trivia-12345,#!trivia-12346')
   */
  const getItems = queries => Promise.map(queries.split(','), getItem)

  const getItemsByMetadata = async metadata => {
    const items = await knex('content_items')
      .where('metadata', 'like', '%|' + metadata + '|%')
      .then()

    return transformItemDbToApi(items)
  }

  /**
   * Refreshes the content categories metadata internally.
   * This must be called after using `loadCategoryFromSchema`
   * @memberOf!  ContentManager
   * @public
   */
  const recomputeCategoriesMetadata = async () => {
    for (const { id: categoryId } of categories) {
      await knex('content_items')
        .select('id', 'formData')
        .where('categoryId', categoryId)
        .then()
        .each(async ({ id, formData }) => {
          const computedProps = await fillComputedProps(categoryById[categoryId], JSON.parse(formData))
          return knex('content_items')
            .where('id', id)
            .update(transformItemApiToDb(computedProps))
        })
    }
  }

  const loadData = async category => {
    const fileName = category.id + '.json'
    fileById[category.id] = fileName

    logger.debug(`Loading data for ${category.id} from ${fileName}`)
    let data = []
    try {
      data = await readDataForFile(fileName)
    } catch (err) {
      logger.warn(`Error reading data from ${fileName}`, err)
    }

    data = await Promise.map(data, async item => ({
      ...item,
      categoryId: category.id,
      id: item.id || getNewItemId(category)
    }))

    // TODO: use transaction
    return Promise.mapSeries(data, item =>
      knex('content_items')
        .insert(transformItemApiToDb(item))
        .then()
    )
  }

  /**
   * Loads a new category from a raw schema definition.
   * *Important:* do not forget to call `ContentManager~recomputeCategoriesMetadata` after calling this
   * @param  {ContentManager~Category} schema A schema definition
   * @memberOf!  ContentManager
   * @return {Object} Returns the loaded category schema
   * @public
   */
  const loadCategoryFromSchema = async schema => {
    const requiredFields = ['id', 'title', 'jsonSchema']

    requiredFields.forEach(field => {
      if (_.isNil(schema[field])) {
        throw new Error(`"${field}" is required but missing in schema`)
      }
    })

    schema.id = schema.id.toLowerCase()

    if (categoryById[schema.id]) {
      throw new Error(`There is already a form with id "${schema.id}"`)
    }

    if (!schema.jsonSchema.title) {
      schema.jsonSchema.title = schema.title
    }

    categoryById[schema.id] = schema
    categories.push(schema)

    await loadData(schema)

    return schema
  }

  const loadCategoriesFromPath = async file => {
    const filePath = path.resolve(contentDir, './' + file)

    let schemas = null

    if (/\.json$/i.test(filePath)) {
      // Using JSON5 instead of regular JSON
      schemas = json5.parse(fs.readFileSync(filePath, 'utf8'))
    } else {
      // Allows for registering .form.js files
      schemas = require(filePath)
    }

    try {
      if (_.isArray(schemas)) {
        for (const schema of schemas) {
          await loadCategoryFromSchema(schema)
        }
      } else {
        await loadCategoryFromSchema(schemas)
      }
    } catch (err) {
      throw new VError(err, `Error registering Content Element "${file}"`)
    }
  }

  const readDataForFile = async fileName => {
    const json = await ghostManager.readFile(contentDataDir, fileName)
    if (!json) {
      return []
    }

    try {
      const data = JSON.parse(json)
      if (!Array.isArray(data)) {
        throw new Error(`${fileName} expected to contain array, contents ignored`)
      }
      logger.info(`Read ${data.length} item(s) from ${fileName}`)
      return data
    } catch (err) {
      logger.warn(`Error reading data from ${fileName}`, err)
      return []
    }
  }

  const init = async () => {
    mkdirp.sync(contentDataDir)
    await ghostManager.addRootFolder(contentDataDir, { filesGlob: '**/*.json' })

    // DEPRECATED: Files don't have to contain .form anymore
    const files = await Promise.fromCallback(cb => glob('**/*.@(form.json|form.js|json|js)', { cwd: contentDir }, cb))

    for (const file of files) {
      try {
        await loadCategoriesFromPath(file)
      } catch (err) {
        throw new VError(err, `[Content Manager] Could not register Content Element "${file}"`)
      }
    }

    await recomputeCategoriesMetadata()
  }

  /**
   * @callback ElementProvider
   * @memberOf!  ContentManager
   * @param {KnexInstance} knex An instance of Knex
   * @param {String} category The name of the category
   * @param {String} args A string with whatever was passed in the parans e.g. "random(25)"
   * @example
const randomProvider = (knex, category, args) => {
return knex('content_items')
  .where({ categoryId: category })
  .orderBy(knex.raw('random()'))
  .limit(1)
  .get(0)
}
   */

  /**
   * Register a new item provider, which is used when parsing query for {@link ContentManager~getItem}
   * @param  {String} name The name of the provider, e.g. `random`
   * @param  {ContentManager.ElementProvider} fn A content provider function
   * @memberOf ContentManager
   * @public
   * @example
// returns a random element from a given category
const randomProvider = (knex, category, args) => {
  return knex('content_items')
    .where({ categoryId: category })
    .orderBy(knex.raw('random()'))
    .limit(1)
    .get(0)
}

bp.contentManager.registerGetItemProvider('random', randomProvider)
   */
  const registerGetItemProvider = (name, fn) => {
    name = name.toLowerCase()
    getItemProviders[name] = fn
  }

  return {
    init,
    listAvailableCategories,
    getCategorySchema,

    loadCategoryFromSchema,
    recomputeCategoriesMetadata,

    createOrUpdateCategoryItem,
    listCategoryItems,
    categoryItemsCount,
    deleteCategoryItems,

    getItem,
    getItems,
    getItemsByMetadata,

    registerGetItemProvider
  }
}
