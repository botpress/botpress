import Promise from 'bluebird'
import moment from 'moment'

import tables from './tables'
import kvs from './kvs'

const initializeCoreDatabase = knex => {
  if (!knex) {
    throw new Error('You must initialize the database before')
  }

  return Promise.mapSeries(tables, fn => fn(knex))
}

module.exports = ({ sqlite, postgres }) => {

  let knex = null

  const getDb = () => {
    if (knex) {
      return Promise.resolve(knex)
    }

    let _knex = null

    if (postgres.enabled) {

      // If we're passing in a postgres connection string, 
      // use that instead of the other params
      if (postgres.connection) {
        _knex = require('knex')({
          client: 'pg',
          connection: postgres.connection,
          useNullAsDefault: true
        })
      } else {
        _knex = require('knex')({
          client: 'pg',
          connection: {
            host: postgres.host,
            port: postgres.port,
            user: postgres.user,
            password: postgres.password,
            database: postgres.database,
            ssl: postgres.ssl
          },
          useNullAsDefault: true
        })
      }
      
    } else {
      _knex = require('knex')({
        client: 'sqlite3',
        connection: { filename: sqlite.location },
        useNullAsDefault: true,
        pool: { 
          afterCreate: (conn, cb) => {
            conn.run('PRAGMA foreign_keys = ON', cb)
          }
        }
      })
    }

    return initializeCoreDatabase(_knex)
    .then(() => {
      knex = _knex
      return knex
    })
  }

  const saveUser = ({ id, platform, gender, timezone, locale, picture_url, first_name, last_name }) => {
    const userId = platform + ':' + id
    const userRow = {
      id: userId,
      userId: id,
      platform: platform,
      gender: gender || 'unknown',
      timezone: timezone || null,
      locale: locale || null,
      created_on: moment(new Date()).toISOString(),
      picture_url: picture_url,
      last_name: last_name,
      first_name: first_name
    }

    return getDb()
    .then(knex => {
      var query = knex('users').insert(userRow)
      .where(function() {
        return this
          .select(knex.raw(1))
          .from('users')
          .where('id', '=', userId)
      })

      if (postgres.enabled) {
        query = `${query} on conflict (id) do nothing`
      } else { // SQLite
        query = query.toString().replace(/^insert/i, 'insert or ignore')
      }

      return knex.raw(query)
    })
  }

  let kvs_instance = null
  const getKvs = () => {
    if (!kvs_instance) {
      return getDb()
      .then(knex => {
        let _kvs = new kvs(knex)
        return _kvs.bootstrap()
        .then(() => {
          kvs_instance = _kvs
          return kvs_instance
        })
      })
    } else {
      return Promise.resolve(kvs_instance)
    }
  }

  const kvsGet = function() {
    const args = arguments
    return getKvs()
    .then(instance => instance.get.apply(null, args))
  }

  const kvsSet = function() {
    const args = arguments
    return getKvs()
    .then(instance => instance.set.apply(null, args))
  }

  return {
    get: getDb,
    saveUser,
    location: postgres.enabled ? 'postgres' : sqlite.location,
    kvs: { get: kvsGet, set: kvsSet }
  }
}
