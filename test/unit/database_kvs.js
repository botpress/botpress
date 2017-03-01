/* eslint-env babel-eslint, node, mocha */

const {itBoth, run} = require('./database_base')
const kvs = require('../../lib/kvs')
const expect = require('chai').expect
const Promise = require('bluebird')
const _ = require('lodash')

run('kvs', function() {

  let store = null
  let storeTable = null
  let storeTeardown = null

  const defaultStoreValues = {
    'default_key': { a: '1', b: { deep: 'deep_value' }, c: [1, 2, 3] }
  }

  const createStore = knex => {
    storeTable = 'tmp_store_' + Math.random().toString().substr(2)
    store = kvs(knex, { tableName: storeTable })

    storeTeardown = () => {
      return knex.schema.dropTable(storeTable)
      .then(() => {
        store = null
        storeTable = null
        storeTeardown = null
      })
    }

    return store.bootstrap()
    .then(() => {
      return Promise.mapSeries(_.keys(defaultStoreValues), key => {
        return store.set(key, defaultStoreValues[key])
      })
    })
  }

  afterEach(function() {
    return storeTeardown && storeTeardown()
  })

  describe('get', function() {

    itBoth('Returns null if key doesn\'t exist', function(knex) {
      return createStore(knex).then(() => {
        return store.get('hello')
        .then(value => {
          expect(value).to.equal(null)
        })
      })
    })

    itBoth('Returns value if key exists', function(knex) {
      return createStore(knex).then(() => {
        return store.get('default_key')
        .then(value => {
          expect(value).to.not.equal(null)
          expect(value.a).to.equal('1')
          expect(value.b.deep).to.equal('deep_value')
        })
      })
    })

    itBoth('Returns value at path if key exists', function(knex) {
      return createStore(knex).then(() => {
        return store.get('default_key', 'b.deep')
        .then(value => {
          expect(value).to.equal('deep_value')
        })
      })
    })

  })

  describe('set', function() {

    itBoth('Sets value if key doesn\'t exist', function(knex) {
      return createStore(knex).then(() => {
        return store.set('hello', 'world')
        .then(() => store.get('hello'))
        .then(value => {
          expect(value).to.equal('world')
        })
      })
    })

    itBoth('Overwrite existing keys', function(knex) {
      return createStore(knex).then(() => {
        return store.set('default_key', { a: '2' })
        .then(() => store.get('default_key'))
        .then(value => {
          expect(value.a).to.equal('2')
          expect(value.b).to.be.undefined
        })
      })
    })

    itBoth('Overwrite existing keys at path keeps existing values', function(knex) {
      return createStore(knex).then(() => {
        return store.set('default_key', '2', 'a')
        .then(() => store.get('default_key'))
        .then(value => {
          expect(value.a).to.equal('2')
          expect(value.b.deep).to.equal('deep_value')
        })
      })
    })

    itBoth('Deep overwrite', function(knex) {
      return createStore(knex).then(() => {
        return store.set('default_key', 'new', 'b.deep')
        .then(() => store.get('default_key'))
        .then(value => {
          expect(value.a).to.equal('1')
          expect(value.b.deep).to.equal('new')
        })
      })
    })

  })

})