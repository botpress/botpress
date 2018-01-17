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
  const prefix = (category.ummBloc || category.id).replace(/^#/, '')
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

  const formDir = path.resolve(projectLocation, botfile.formsDir || './forms')
  const formDataDir = path.resolve(projectLocation, botfile.formsDataDir || './forms_data')

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

    return {
      ...item,
      data: JSON.stringify(item.data),
      formData: JSON.stringify(item.formData),
      metadata: '|' + (item.metadata || []).filter(i => !!i).join('|') + '|'
    }
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
    const items = (await listCategoryItems(categoryId)).map(item =>
      _.pick(item, 'id', 'formData', 'createdBy', 'createdOn')
    )
    await ghostManager.upsertFile(formDataDir, fileById[categoryId], JSON.stringify(items, null, 2))
  }

  const dumpAllDataToFiles = () => Promise.map(categories, ({ id }) => dumpDataToFile(id))

  const getCategorySchema = categoryId => {
    const category = _.find(categories, { id: categoryId })
    if (_.isNil(category)) {
      return null
    }

    return {
      json: category.jsonSchema,
      ui: category.uiSchema,
      title: category.title,
      description: category.description,
      ummBloc: category.ummBloc
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
        schema: await getCategorySchema(category.id)
      }
    })

  const fillComputedProps = async (category, formData) => {
    if (_.isNil(formData) || !_.isObject(formData)) {
      throw new Error('"formData" must be a valid object')
    }

    const data = (category.computeFormData && (await category.computeFormData(formData))) || formData
    const metadata = (category.computeMetadata && (await category.computeMetadata(formData))) || []
    const previewText = (category.computePreviewText && (await category.computePreviewText(formData))) || 'No preview'

    if (!_.isArray(metadata)) {
      throw new Error('computeMetadata must return an array of strings')
    }

    if (!_.isString(previewText)) {
      throw new Error('computePreviewText must return a string')
    }

    if (_.isNil(data) || !_.isObject(data)) {
      throw new Error('computeFormData must return a valid object')
    }

    return {
      formData,
      data,
      metadata,
      previewText
    }
  }

  const createOrUpdateCategoryItem = async ({ itemId, categoryId, formData }) => {
    categoryId = categoryId && categoryId.toLowerCase()
    const category = _.find(categories, { id: categoryId })

    if (_.isNil(category)) {
      throw new Error(`Category "${categoryId}" is not a valid registered categoryId`)
    }

    const item = await fillComputedProps(category, formData)
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

  const categoryItemsCount = () => {
    return knex('content_items')
      .count('id as count')
      .then(([res]) => Number(res.count))
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

  const getItem = async id => {
    const item = await knex('content_items')
      .where({ id })
      .get(0)

    if (!item) {
      return null
    }

    const category = _.find(categories, { id: item.categoryId })
    return {
      ...transformItemDbToApi(item),
      categoryTitle: category.title,
      categorySchema: await getCategorySchema(item.categoryId)
    }
  }

  const getItemsByMetadata = async metadata => {
    const items = await knex('content_items')
      .where('metadata', 'like', '%|' + metadata + '|%')
      .then()

    return transformItemDbToApi(items)
  }

  const loadCategory = file => {
    const filePath = path.resolve(formDir, './' + file)
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
    const json = await ghostManager.readFile(formDataDir, fileName)
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
      ...(await fillComputedProps(category, item.formData)),
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
    if (!fs.existsSync(formDir)) {
      return
    }

    mkdirp.sync(formDataDir)
    await ghostManager.addRootFolder(formDataDir, '**/*.json')

    const files = await Promise.fromCallback(callback => glob('**/*.form.js', { cwd: formDir }, callback))

    return Promise.map(files, async file => {
      try {
        const category = loadCategory(file)
        await loadData(category, file.replace(/\.form\.js$/, '.json'))
      } catch (err) {
        logger.warn('[Content Manager] Could not load Form: ' + file, err)
      }
    })
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
    getItemsByMetadata
  }
}
