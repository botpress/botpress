/* eslint-env babel-eslint, node, mocha */

const { itBoth, run } = require('./database_base')
const kvs = require('../src/database/kvs')
const expect = require('chai').expect
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

  const createStore = knex => {
    storeTable = randomTableName('tmp_store_')

    store = kvs(knex, { tableName: storeTable })

    storeTeardown = () =>
      knex.schema.dropTable(storeTable).then(() => {
        store = null
        storeTable = null
        storeTeardown = null
      })

    return store
      .bootstrap()
      .then(() => Promise.mapSeries(_.keys(defaultStoreValues), key => store.set(key, defaultStoreValues[key])))
  }

  afterEach(() => storeTeardown && storeTeardown())

  describe('get', () => {
    itBoth("Returns null if key doesn't exist", knex =>
      createStore(knex).then(() =>
        store.get('hello').then(value => {
          expect(value).to.equal(null)
        })
      )
    )

    itBoth('Returns value if key exists', knex =>
      createStore(knex).then(() =>
        store.get('default_key').then(value => {
          expect(value).to.not.equal(null)
          expect(value.a).to.equal('1')
          expect(value.b.deep).to.equal('deep_value')
        })
      )
    )

    itBoth('Returns value at path if key exists', knex =>
      createStore(knex).then(() =>
        store.get('default_key', 'b.deep').then(value => {
          expect(value).to.equal('deep_value')
        })
      )
    )
  })

  describe('set', () => {
    itBoth("Sets value if key doesn't exist", knex =>
      createStore(knex).then(() =>
        store
          .set('hello', 'world')
          .then(() => store.get('hello'))
          .then(value => {
            expect(value).to.equal('world')
          })
      )
    )

    itBoth('Overwrite existing keys', knex =>
      createStore(knex).then(() =>
        store
          .set('default_key', { a: '2' })
          .then(() => store.get('default_key'))
          .then(value => {
            expect(value.a).to.equal('2')
            expect(value.b).to.be.undefined
          })
      )
    )

    itBoth('Overwrite existing keys at path keeps existing values', knex =>
      createStore(knex).then(() =>
        store
          .set('default_key', '2', 'a')
          .then(() => store.get('default_key'))
          .then(value => {
            expect(value.a).to.equal('2')
            expect(value.b.deep).to.equal('deep_value')
          })
      )
    )

    itBoth('Deep overwrite', knex =>
      createStore(knex).then(() =>
        store
          .set('default_key', 'new', 'b.deep')
          .then(() => store.get('default_key'))
          .then(value => {
            expect(value.a).to.equal('1')
            expect(value.b.deep).to.equal('new')
          })
      )
    )
  })
})
