/* eslint-env babel-eslint, node, mocha */

const knex = require('knex')
const tmp = require('tmp')
const dotenv = require('dotenv')
const { expect } = require('chai')
const { randomTableName } = require('./_util')

// Loads .env file and sets environement variable
dotenv.config()

// Clean files even on unhandled exceptions
tmp.setGracefulCleanup()

// Temporary sqlite3 database file
const sqlite_db = tmp.fileSync()

const postgres = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DB || '',
    user: process.env.PG_USER || '',
    password: process.env.PG_PASSWORD || ''
  },
  useNullAsDefault: true
})

const sqlite = knex({
  client: 'sqlite3',
  connection: {
    filename: process.env.SQLITE_FILE || sqlite_db.name
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb)
    }
  }
})

const createSampleTable = async () => {
  const name = randomTableName()

  const tableCb = table => {
    table.increments('tId').primary()
    table.string('tString')
    table.timestamp('tTimestamp')
    table.enu('tEnu', ['a', 'b', 'c'])
  }

  await postgres.schema.createTable(name, tableCb)
  await sqlite.schema.createTable(name, tableCb)

  return name
}

const itBoth = sampleTableGetter => (name, fn) => {
  it(`${name} (postgres)`, () => fn(postgres, sampleTableGetter()))
  it(`${name} (sqlite)`, () => fn(sqlite, sampleTableGetter()))
}

let emptyTable = null

module.exports = {
  sqlite: sqlite,
  postgres: postgres,
  createSampleTable: createSampleTable,
  doBoth: fn => async () => {
    if (!fn) {
      return
    }

    await fn(postgres)
    await fn(sqlite)
  },
  itBoth: itBoth(() => emptyTable),
  run: (name, cb) => {
    describe('Setup', () => {
      before(() => postgres.raw('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'))

      beforeEach(async () => {
        emptyTable = await createSampleTable()
      })

      itBoth('Tables created', async knex => {
        expect(await knex.schema.hasTable(emptyTable)).to.equal(true)
      })

      describe(name, cb)
    })
  }
}
