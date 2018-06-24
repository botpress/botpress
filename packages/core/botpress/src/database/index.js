/**
 * The db (database) namespace lets you control the database directly via [Knex]{@link http://knexjs.org/}
 * @public
 * @namespace Database
 * @example
 * await knex = bp.db.get()
 */

import Promise from 'bluebird'
import moment from 'moment'
import knex from 'knex'
import pick from 'lodash/pick'

import tables from './tables'
import kvs from './kvs'
import path from 'path'

const initializeCoreDatabase = (knex, botpressPath) => {
  if (!knex) {
    throw new Error('You must initialize the database before')
  }

  const directory = path.join(botpressPath, './migrations/')
  return Promise.mapSeries(tables, fn => fn(knex)).then(() => knex.migrate.latest({ directory }))
}

const createKnex = async ({ sqlite, postgres, botpressPath, logger }) => {
  const commonConfig = {
    useNullAsDefault: true
  }
  const dbConfig = postgres.enabled
    ? {
        client: 'pg',
        connection: postgres.connection || pick(postgres, ['host', 'port', 'user', 'password', 'database', 'ssl'])
      }
    : {
        client: 'sqlite3',
        connection: { filename: sqlite.location },
        pool: {
          afterCreate: (conn, cb) => {
            conn.run('PRAGMA foreign_keys = ON', cb)
          }
        }
      }

  const _knex = knex(Object.assign(commonConfig, dbConfig))

  await initializeCoreDatabase(_knex, botpressPath)
  return _knex
}

module.exports = ({ sqlite, postgres, logger, botpressPath }) => {
  let knex = null

  const getDb = async () => {
    if (!knex) {
      knex = await createKnex({ sqlite, postgres, botpressPath, logger })
    }

    return knex
  }

  const saveUser = ({
    id,
    platform,
    gender = 'unknown',
    timezone = null,
    locale = null,
    picture_url,
    first_name,
    last_name
  }) => {
    const userId = platform + ':' + id
    const userRow = {
      id: userId,
      userId: id,
      platform,
      gender,
      timezone,
      locale,
      created_on: moment(new Date()).toISOString(),
      picture_url: picture_url,
      last_name: last_name,
      first_name: first_name
    }

    return getDb().then(knex => {
      let query = knex('users')
        .insert(userRow)
        .where(function() {
          return this.select(knex.raw(1))
            .from('users')
            .where('id', '=', userId)
        })

      if (postgres.enabled) {
        query = `${query} on conflict (id) do nothing`
      } else {
        // SQLite
        query = query.toString().replace(/^insert/i, 'insert or ignore')
      }

      return knex.raw(query)
    })
  }

  let kvsInstance = null

  const createKvs = async () => {
    const knex = await getDb()
    const _kvs = kvs(knex)
    await _kvs.bootstrap()
    return _kvs
  }

  const getKvs = async () => {
    if (!kvsInstance) {
      kvsInstance = createKvs()
    }

    return kvsInstance
  }

  const kvsGet = (...args) => getKvs().then(instance => instance.get(...args))
  const kvsSet = (...args) => getKvs().then(instance => instance.set(...args))

  const kvsWrapper = { get: kvsGet, set: kvsSet }

  return {
    /**
     * Returns an initialized and connected instance of [Knex]{@link http://knexjs.org/}.
     * Knex is a SQL Query Builder and database abstractor that Botpress (and every Botpress modules) use internally.
     * [Knex Documentation]{@link http://knexjs.org/#Builder}
     * @func
     * @async
     * @memberOf! Database
     * @return {KnexQueryBuilder}
     */
    get: getDb,
    saveUser,
    location: postgres.enabled ? 'postgres' : sqlite.location,
    get kvs() {
      logger &&
        logger.warn(
          '[Deprecation Notice] `bp.db.kvs` is deprecated and will be removed in Botpress 11. Please use `bp.kvs` directly instead.'
        )
      return kvsWrapper
    },
    _kvs: kvsWrapper
  }
}
