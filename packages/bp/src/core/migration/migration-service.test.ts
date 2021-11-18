import 'reflect-metadata'
import 'bluebird-global'

jest.mock('fs-extra')

import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database/index'
import { PersistedConsoleLogger } from 'core/logger'
import { createSpyObject, MockObject } from 'core/misc/utils'
import yn from 'yn'
import fse from 'fs-extra'
import { MigrationService } from './migration-service'

// TODO: Improve these unit tests and add more of them
describe('Migration Service', () => {
  let migration: MigrationService
  let config: MockObject<ConfigProvider>,
    ghost: MockObject<GhostService>,
    database: MockObject<Database>,
    logger: MockObject<PersistedConsoleLogger>

  beforeEach(() => {
    config = createSpyObject<ConfigProvider>()
    ghost = createSpyObject<GhostService>()
    database = createSpyObject<Database>()
    logger = createSpyObject<PersistedConsoleLogger>()
    logger.attachError.mockReturnValue(logger)
    migration = new MigrationService(logger.T, database.T, config.T, ghost.T)
  })

  describe('Initialize', () => {
    beforeAll(async () => {
      if (yn(process.env.SKIP_MIGRATIONS)) {
        fail('Make sure the environment variable SKIP_MIGRATIONS is not set while running unit tests.')
      }
    })

    it('Does nothing if process.env.SKIP_MIGRATIONS is set to true', async () => {
      const original = process.env.SKIP_MIGRATIONS

      // Can't access the service's debug instance, so the best alternative here
      // is to simply make sure the first function after the guard is never called.
      const spyGetAllMigrations = jest.spyOn(migration, 'getAllMigrations')

      try {
        process.env.SKIP_MIGRATIONS = 'true'
        await migration.initialize()

        expect(spyGetAllMigrations).not.toHaveBeenCalled()
      } catch (err) {
        fail(err)
      } finally {
        process.env.SKIP_MIGRATIONS = original
      }
    })
  })

  describe('getAllMigrations', () => {
    beforeEach(() => {
      jest.resetAllMocks()
    })

    it('Returns all the migrations currently available', async () => {
      const original = process.LOADED_MODULES

      const spy = jest.spyOn(fse, 'existsSync').mockImplementation(() => {
        return true
      })

      try {
        process.LOADED_MODULES = {}
        // Makes sure that the specified paths in getAllMigrations exist.
        migration.getAllMigrations()
        expect(spy).toHaveBeenCalledTimes(1)
      } catch (err) {
        fail(err)
      } finally {
        process.LOADED_MODULES = original
      }
    })

    it('Throw an error if the core migrations folder does not exists', async () => {
      const original = process.LOADED_MODULES

      const spy = jest.spyOn(fse, 'existsSync').mockImplementation(() => {
        return false
      })

      try {
        process.LOADED_MODULES = {}
        expect(() => migration.getAllMigrations()).toThrow()
        expect(spy).toHaveBeenCalledTimes(1)
      } catch (err) {
        fail(err)
      } finally {
        process.LOADED_MODULES = original
      }
    })
  })

  describe('getDbVersion', () => {
    const OLD_ENV = process.env
    const OLD_CORE_ENV = process.core_env
    const OLD_BOTPRESS_VERSION = process.BOTPRESS_VERSION

    const mock_BOTPRESS_VERSION = 'mocked_version'

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...OLD_ENV }
      process.core_env = { ...OLD_CORE_ENV }
      process.BOTPRESS_VERSION = mock_BOTPRESS_VERSION
    })

    afterEach(() => {
      process.env = OLD_ENV
      process.core_env = OLD_CORE_ENV
      process.BOTPRESS_VERSION = OLD_BOTPRESS_VERSION
    })

    it('Returns TESTMIG_DB_VERSION if set', async () => {
      const dbVersion = 'something'
      process.env.TESTMIG_DB_VERSION = dbVersion

      expect(await migration.getDbVersion()).toEqual(dbVersion)
    })

    const testcases: [any, any, string][] = [
      ['anything', undefined, '12.0.0'],
      [undefined, 'anything', '12.0.0'],
      [undefined, 'false', '12.0.0'],
      [undefined, 'no', '12.0.0'],
      [undefined, '0', '12.0.0'],
      [undefined, 'true', mock_BOTPRESS_VERSION],
      [undefined, '1', mock_BOTPRESS_VERSION]
    ]

    test.each(testcases)(
      'TESTMIG_ALL: %s TESTMIG_NEW: %s expected: %s',
      async (TESTMIG_ALL: any, TESTMIG_NEW: any, expected: string) => {
        // @ts-ignore
        process.core_env.TESTMIG_ALL = TESTMIG_ALL
        // @ts-ignore
        process.core_env.TESTMIG_NEW = TESTMIG_NEW

        expect(await migration.getDbVersion()).toEqual(expected)
      }
    )

    it('Returns version from database otherwise', async () => {
      const dbVersion = 'something'
      let spy = jest.spyOn(migration, 'getCurrentDbVersion').mockImplementation(async () => dbVersion)

      expect(await migration.getDbVersion()).toEqual(dbVersion)

      spy.mockRestore()
    })
  })
})
