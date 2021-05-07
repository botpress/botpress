import 'bluebird-global'
import 'reflect-metadata'
import { PersistedConsoleLogger } from 'core/logger'
import tmp from 'tmp'

import { createSpyObject, MockObject } from '../misc/utils'

import Database from '.'

const TEST_DATABASE = 'botpress_tests'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

export type DatabaseTestSuite = (database: Database) => void

export function createDatabaseSuite(suiteName: string, suite: DatabaseTestSuite) {
  const sqlitePath = tmp.fileSync().name
  const sqlite = new Database(logger.T)
  const postgres = new Database(logger.T)

  describe(`DB[SQLite] ${suiteName}`, () => {
    beforeAll(async () => {
      await sqlite.initialize('sqlite', sqlitePath)

      await sqlite.bootstrap()
      await sqlite.seedForTests()
    })

    afterAll(async () => {
      await sqlite.teardownTables()
      await sqlite.knex.destroy()
    })

    afterEach(async () => {
      await sqlite.teardownTables()
      await sqlite.bootstrap()
      await sqlite.seedForTests()
    })

    suite(sqlite)
  })

  describe(`DB[Postgres] ${suiteName}`, () => {
    beforeAll(async () => {
      const config = {
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT || 5432),
        database: process.env.PG_DB || TEST_DATABASE,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || ''
      }
      const dbUrl = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`

      await postgres.initialize('postgres', process.env.DATABASE_URL || dbUrl)

      await postgres.bootstrap()
      await postgres.seedForTests()
    })

    afterAll(async () => {
      await postgres.teardownTables()
      await postgres.knex.destroy()
    })

    afterEach(async () => {
      await postgres.teardownTables()
      await postgres.bootstrap()
      await postgres.seedForTests()
    })

    suite(postgres)
  })
}
