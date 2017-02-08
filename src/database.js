import Promise from 'bluebird'
import moment from 'moment'

const initializeDb = knex => {
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  return knex.schema.hasTable('users')
  .then(exists => {
    if (exists) return

    // We can't use createTableIfNotExists with postgres
    // https://github.com/tgriesser/knex/issues/1303
    return knex.schema.createTableIfNotExists('users', function (table) {
      table.string('id').primary()
      table.string('userId')
      table.string('platform')
      table.enu('gender', ['unknown', 'male', 'female'])
      table.integer('timezone')
      table.string('picture_url')
      table.string('locale')
      table.timestamp('created_on')
    })
  })
}

module.exports = ({ sqlite, postgres }) => {

  let knex = null

  const getDb = () => {
    if (knex) {
      return Promise.resolve(knex)
    }

    if (postgres.enabled) {
      knex = require('knex')({
        client: 'pg',
        connection: {
          host: postgres.host,
          port: postgres.port,
          user: postgres.user,
          password: postgres.password,
          database: postgres.database
        },
        useNullAsDefault: true
      })
    } else {
      knex = require('knex')({
        client: 'sqlite3',
        connection: { filename: sqlite.location },
        useNullAsDefault: true
      })
    }

    return initializeDb(knex)
    .then(() => knex)
  }

  const saveUser = ({ id, platform, gender, timezone, locale }) => {
    const userId =  platform + ':' + id
    const userRow = {
      id: userId,
      userId: id,
      platform: platform,
      gender: gender || 'unknown',
      timezone: timezone || null,
      locale: locale || null,
      created_on: moment(new Date()).toISOString()
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
        query = query + ' on conflict (id) do nothing'
      } else { // SQLite
        query = query.toString().replace(/^insert/i, 'insert or ignore')
      }

      return knex.raw(query)
    })
  }

  return {
    get: getDb,
    saveUser,
    location: postgres.enabled ? 'postgres' : sqlite.location
  }
}
