const Promise = require('bluebird')
const moment = require('moment')

let knex = null
let dbLocation = null

function getDb() {
  if (knex) { 
    return Promise.resolve(knex)
  }

  knex = require('knex')({
    client: 'sqlite3',
    connection: { filename: dbLocation },
    useNullAsDefault: true
  })

  return initializeDb()
  .then(() => knex)
}

function initializeDb() {
  if (!knex) {
    throw new Error('you must initialize the database before')
  }

  return knex.schema.createTableIfNotExists('users', function (table) {
    table.string('id').primary()
    table.string('userId')
    table.string('platform')
    table.enu('gender', ['unknown', 'male', 'female'])
    table.integer('timezone')
    table.string('locale')
    table.timestamp('created_on')
  })
}

function saveUser({ id, platform, gender, timezone, locale }) {
  const userId =  platform + ':' + id
  const userRow = {
    id: userId,
    userId: id,
    platform: platform,
    gender: gender || 'unknown',
    timezone: timezone || null,
    locale: locale || null,
    created_on: moment(new Date()).format('x')
  }

  var query = knex('users').insert(userRow)
  .where(function() {
    return this.select(knex.raw(1)).from('users').where('id', '=', userId)
  })
  query = query.toString().replace(/^insert/i, 'insert or ignore')

  return knex.raw(query)
}

module.exports = (location) => {
  dbLocation = location
  return {
    get: getDb,
    saveUser: saveUser,
    location: location
  }
}
