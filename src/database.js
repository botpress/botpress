import Promise from 'bluebird'
import moment from 'moment'
import helpers from './database_helpers'

const initializeCoreDatabase = knex => {
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  helpers(knex).date.now()

  return helpers(knex).createTableIfNotExists('users', function (table) {
    table.string('id').primary()
    table.string('userId')
    table.string('platform')
    table.enu('gender', ['unknown', 'male', 'female'])
    table.integer('timezone')
    table.string('picture_url')
    table.string('first_name')
    table.string('last_name')
    table.string('locale')
    table.timestamp('created_on')
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

    return initializeCoreDatabase(knex)
    .then(() => knex)
  }

  const saveUser = ({ id, platform, gender, timezone, locale, picture_url, first_name, last_name }) => {
    const userId =  platform + ':' + id
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
