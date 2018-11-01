import 'bluebird-global'
import 'reflect-metadata'
import tmp from 'tmp'

import { PersistedConsoleLogger } from '../logger'
import { createSpyObject, MockObject } from '../misc/utils'

import Database from '.'

const TEST_DATABASE = 'botpress_tests'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

export type DatabaseTestSuite = ((database: Database) => void)

export function createDatabaseSuite(suiteName: string, suite: DatabaseTestSuite) {
  const sqlitePath = tmp.fileSync().name
  const sqlite = new Database(logger.T)
  const postgres = new Database(logger.T)

  describe(`DB[SQLite] ${suiteName}`, () => {
    beforeAll(async () => {
      await sqlite.initialize({
        location: sqlitePath,
        type: 'sqlite'
      })
    })

    afterAll(async () => {
      await sqlite.knex.destroy()
    })

    afterEach(async () => {
      await sqlite.teardownTables()
      await sqlite.bootstrap()
    })

    suite(sqlite)
  })

  describe(`DB[Postgres] ${suiteName}`, () => {
    beforeAll(async () => {
      await postgres.initialize({
        type: 'postgres',
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT || 5432),
        database: process.env.PG_DB || TEST_DATABASE,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || ''
      })
    })

    afterAll(async () => {
      await postgres.knex.destroy()
    })

    afterEach(async () => {
      await postgres.teardownTables()
      await postgres.bootstrap()
    })

    suite(postgres)
  })
}
