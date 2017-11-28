import path from 'path'
import fs from 'fs'

import _ from 'lodash'
import Promise from 'bluebird'
import glob from 'glob'
import uuid from 'uuid'

import helpers from '../database/helpers'

const getShortUid = () =>
  uuid
    .v4()
    .split('-')
    .join('')
    .substr(0, 6)

module.exports = ({ db, botfile, projectLocation, logger }) => {
  let categories = []

  const scanAndRegisterCategories = async () => {
    categories = []

    const formDir = path.resolve(projectLocation, botfile.formsDir || './content/forms')

    if (!fs.existsSync(formDir)) {
      return categories
    }

    const searchOptions = { cwd: formDir }

    const files = await Promise.fromCallback(callback => glob('**/*.form.js', searchOptions, callback))

    files.forEach(file => {
      try {
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

        if (_.find(categories, { id: category.id })) {
          throw new Error('There is already a form with id=' + category.id)
        }

        categories.push(category)
      } catch (err) {
        logger.warn('[Content Manager] Could not load Form: ' + file, err)
      }
    })

    return categories
  }

  const listAvailableCategories = async () => {
    const knex = await db.get()

    return await Promise.map(categories, async category => {
      const count = await knex('content_items')
        .where({ categoryId: category.id })
        .select(knex.raw('count(*) as count'))
        .then()
        .get(0)
        .then(row => (row && row.count) || 0)

      return {
        id: category.id,
        title: category.title,
        description: category.description,
        count: count
      }
    })
  }

  const getCategorySchema = async categoryId => {
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

  const createOrUpdateCategoryItem = async ({ itemId, categoryId, formData }) => {
    categoryId = categoryId && categoryId.toLowerCase()
    const category = _.find(categories, { id: categoryId })

    if (_.isNil(category)) {
      throw new Error(`Category "${categoryId}" is not a valid registered categoryId`)
    }

    if (_.isNil(formData) || !_.isObject(formData)) {
      throw new Error('"formData" must be a valid object')
    }

    const data = (category.computeFormData && (await category.computeFormData(formData))) || formData
    const metadata = (category.computeMetadata && (await category.computeMetadata(formData))) || []
    const previewText = (category.computePreviewText && (await category.computePreviewText(formData))) || 'No preview'

    if (!_.isArray(metadata)) {
      throw new Error('computeMetadata must return an array of string')
    }

    if (!_.isString(previewText)) {
      throw new Error('computePreviewText must return a string')
    }

    if (_.isNil(data) || !_.isObject(data)) {
      throw new Error('computeFormData must return a valid object')
    }

    const prefix = (category.ummBloc || categoryId).replace(/^#/, '')
    const randomId = `${prefix}-${getShortUid()}`

    const knex = await db.get()

    const body = {
      data: JSON.stringify(data),
      formData: JSON.stringify(formData),
      metadata: '|' + metadata.join('|') + '|',
      previewText: previewText,
      created_by: 'admin',
      created_on: helpers(knex).date.now()
    }

    if (itemId) {
      return await knex('content_items')
        .update(body)
        .where({ id: itemId })
    }

    return await knex('content_items').insert(
      Object.assign(
        {
          id: randomId,
          categoryId: categoryId
        },
        body
      )
    )
  }

  const transformCategoryItem = item => {
    if (!item) {
      return item
    }

    const metadata = _.filter((item.metadata || '').split('|'), i => i.length > 0)

    return {
      id: item.id,
      data: JSON.parse(item.data),
      formData: JSON.parse(item.formData),
      categoryId: item.categoryId,
      previewText: item.previewText,
      metadata: metadata,
      createdBy: item.created_by,
      createdOn: item.created_on
    }
  }

  const listCategoryItems = async (categoryId, from = 0, count = 50, searchTerm) => {
    const knex = await db.get()

    let query = knex('content_items')

    if (categoryId) {
      query = query.where({
        categoryId: categoryId
      })
    }

    if (searchTerm) {
      query = query.andWhere('metadata', 'like', `%${searchTerm}%`).orWhere('formData', 'like', `%${searchTerm}%`)
    }

    const items = await query
      .orderBy('created_on')
      .offset(from)
      .limit(count)
      .then()

    return items.map(transformCategoryItem)
  }

  const deleteCategoryItems = async ids => {
    if (!_.isArray(ids) || _.some(ids, id => !_.isString(id))) {
      throw new Error('Expected an array of Ids to delete')
    }

    const knex = await db.get()

    return knex('content_items')
      .whereIn('id', ids)
      .del()
  }

  const getItem = async itemId => {
    const knex = await db.get()

    const item = await knex('content_items')
      .where({ id: itemId })
      .then()
      .get(0)
      .then()

    return transformCategoryItem(item)
  }

  const getItemsByMetadata = async metadata => {
    const knex = await db.get()

    const items = await knex('content_items')
      .where('metadata', 'like', '%|' + metadata + '|%')
      .then()

    return transformCategoryItem(items)
  }

  const exportContent = async (ids = null) => {
    const knex = await db.get()

    let query = knex('content_items').select('*')

    if (ids) {
      query = query.whereIn('id', ids)
    }

    const items = query.then()

    return items.map(item => transformCategoryItem(item))
  }

  const importContent = async documents => {
    const knex = await db.get()

    return Promise.mapSeries(documents, doc => {
      if (!doc.id || !doc.formData || !doc.categoryId) {
        throw new Error('Invalid data')
      }

      const row = {
        data: JSON.stringify(doc.data),
        formData: JSON.stringify(doc.formData),
        metadata: '|' + doc.metadata.join('|') + '|',
        previewText: doc.previewText,
        created_by: 'admin',
        created_on: helpers(knex).date.now(),
        id: doc.id,
        categoryId: doc.categoryId
      }

      return knex('content_items')
        .insert(row)
        .then()
        .catch(err => {
          return knex('content_items')
            .where({ id: doc.id })
            .update(row)
            .then()
        })
    })
  }

  return {
    scanAndRegisterCategories,
    listAvailableCategories,
    getCategorySchema,

    createOrUpdateCategoryItem,
    listCategoryItems,
    deleteCategoryItems,

    getItem,
    getItemsByMetadata,

    exportContent,
    importContent
  }
}
