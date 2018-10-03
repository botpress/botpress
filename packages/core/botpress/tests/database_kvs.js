/* eslint-env babel-eslint, node, mocha */

const { itBoth, run } = require('./database_base')
const kvs = require('../src/database/kvs')
const { expect } = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { randomTableName } = require('./_util')

run('kvs', () => {
  let store = null
  let storeTable = null
  let storeTeardown = null

  const defaultStoreValues = {
    default_key: { a: '1', b: { deep: 'deep_value' }, c: [1, 2, 3] }
  }

  const createStore = async knex => {
    storeTable = randomTableName('tmp_store_')

    store = kvs(knex, { tableName: storeTable })

    storeTeardown = async () => {
      await knex.schema.dropTable(storeTable)
      store = null
      storeTable = null
      storeTeardown = null
    }

    await store.bootstrap()
    await Promise.mapSeries(_.keys(defaultStoreValues), key => store.set(key, defaultStoreValues[key]))
  }

  afterEach(() => storeTeardown && storeTeardown())

  describe('get', () => {
    itBoth("Returns null if key doesn't exist", async knex => {
      await createStore(knex)
      const value = await store.get('hello')
      expect(value).to.equal(null)
    })

    itBoth('Returns value if key exists', async knex => {
      await createStore(knex)
      const value = await store.get('default_key')
      expect(value).to.not.equal(null)
      expect(value.a).to.equal('1')
      expect(value.b.deep).to.equal('deep_value')
    })

    itBoth('Returns value at path if key exists', async knex => {
      await createStore(knex)
      const value = await store.get('default_key', 'b.deep')
      expect(value).to.equal('deep_value')
    })
  })

  describe('set', () => {
    itBoth("Sets value if key doesn't exist", async knex => {
      await createStore(knex)
      await store.set('hello', 'world')
      const value = await store.get('hello')
      expect(value).to.equal('world')
    })

    itBoth('Overwrite existing keys', async knex => {
      await createStore(knex)
      await store.set('default_key', { a: '2' })
      const value = await store.get('default_key')
      expect(value.a).to.equal('2')
      expect(value.b).to.be.undefined
    })

    itBoth('Overwrite existing keys at path keeps existing values', async knex => {
      await createStore(knex)
      await store.set('default_key', '2', 'a')
      const value = await store.get('default_key')
      expect(value.a).to.equal('2')
      expect(value.b.deep).to.equal('deep_value')
    })

    itBoth('Deep overwrite', async knex => {
      await createStore(knex)
      await store.set('default_key', 'new', 'b.deep')
      const value = await store.get('default_key')
      expect(value.a).to.equal('1')
      expect(value.b.deep).to.equal('new')
    })
  })
})
