import path from 'path'
import fs from 'fs'

import _ from 'lodash'
import Promise from 'bluebird'
import glob from 'glob'
import mkdirp from 'mkdirp'
import nanoid from 'nanoid'

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

module.exports = async ({ botfile, projectLocation, logger, ghostManager }) => {
  const categories = []
  const categoryById = {}
  const fileById = {}

  const getItemProviders = {}

  const contentDir = path.resolve(projectLocation, botfile.contentDir || './content')
  const contentDataDir = path.resolve(projectLocation, botfile.contentDataDir || './content_data')

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

  const listCategoryItems = async (categoryId, { from = 0, count = 50, searchTerm, orderBy = ['createdOn'] } = {}) => {
    let query = knex('content_items')

    if (categoryId) {
      query = query.where({ categoryId })
    }

    if (searchTerm) {
      query = query.where(function() {
        this.where('metadata', 'like', `%${searchTerm}%`).orWhere('formData', 'like', `%${searchTerm}%`)
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

  const createOrUpdateCategoryItem = async ({ itemId, categoryId, formData }) => {
    categoryId = categoryId && categoryId.toLowerCase()
    const category = _.find(categories, { id: categoryId })

    if (category == null) {
      throw new Error(`Category "${categoryId}" is not a valid registered categoryId`)
    }

    const item = { formData, ...(await fillComputedProps(category, formData)) }
    const body = transformItemApiToDb(item)

    if (itemId) {
      await knex('content_items')
        .update(body)
        .where({ id: itemId })
        .then()
    } else {
      const newItemId = getNewItemId(category)
      await knex('content_items').insert({
        ...body,
        createdBy: 'admin',
        createdOn: helpers(knex).date.now(),
        id: newItemId,
        categoryId
      })
    }

    return dumpDataToFile(categoryId)
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

    return item
  }

  const getItemsByMetadata = async metadata => {
    const items = await knex('content_items')
      .where('metadata', 'like', '%|' + metadata + '|%')
      .then()

    return transformItemDbToApi(items)
  }

  const loadCategory = file => {
    const filePath = path.resolve(contentDir, './' + file)
    // eslint-disable-next-line no-eval
    const category = eval('require')(filePath) // Dynamic loading require eval for Webpack
    const requiredFields = ['id', 'title', 'jsonSchema']

    requiredFields.forEach(field => {
      if (_.isNil(category[field])) {
        throw new Error(field + ' is required but missing in Content Form file: ' + file)
      }
    })

    category.id = category.id.toLowerCase()

    if (categoryById[category.id]) {
      throw new Error('There is already a form with id=' + category.id)
    }

    categoryById[category.id] = category
    categories.push(category)

    return category
  }

  const readDataForFile = async fileName => {
    const json = await ghostManager.readFile(contentDataDir, fileName)
    if (!json) {
      logger.warn(`Form content file ${fileName} not found`)
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

  const loadData = async (category, fileName) => {
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
    return Promise.map(data, async item =>
      knex('content_items')
        .insert(transformItemApiToDb(item))
        .then()
    )
  }

  const init = async () => {
    if (!fs.existsSync(contentDir)) {
      return
    }

    mkdirp.sync(contentDataDir)
    await ghostManager.addRootFolder(contentDataDir, '**/*.json')

    const files = await Promise.fromCallback(callback => glob('**/*.form.js', { cwd: contentDir }, callback))

    // initial path, save raw props and IDs
    await Promise.map(files, async file => {
      try {
        const category = loadCategory(file)
        await loadData(category, file.replace(/\.form\.js$/, '.json'))
      } catch (err) {
        logger.warn('[Content Manager] Could not load Form: ' + file, err)
      }
    })

    // second path, resolve refs
    await Promise.map(categories, ({ id: categoryId }) =>
      knex('content_items')
        .select('id', 'formData')
        .where('categoryId', categoryId)
        .then()
        .each(async ({ id, formData }) => {
          const computedProps = await fillComputedProps(categoryById[categoryId], JSON.parse(formData))
          return knex('content_items')
            .where('id', id)
            .update(transformItemApiToDb(computedProps))
        })
    )
  }

  const registerGetItemProvider = (name, fn) => {
    name = name.toLowerCase()
    getItemProviders[name] = fn
  }

  return {
    init,
    listAvailableCategories,
    getCategorySchema,

    createOrUpdateCategoryItem,
    listCategoryItems,
    categoryItemsCount,
    deleteCategoryItems,

    getItem,
    getItemsByMetadata,

    registerGetItemProvider
  }
}
