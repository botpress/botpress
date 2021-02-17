import 'bluebird-global'

import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'

import 'jest-extended'
import 'reflect-metadata'
import { MigrationService } from '.'

import { PersistedConsoleLogger } from '../../logger'
import { createSpyObject, MockObject } from '../../misc/utils'
import { GhostService } from '../ghost/service'

describe('Migration Service', () => {
  let service: MigrationService

  let database: MockObject<Database>,
    configProvider: MockObject<ConfigProvider>,
    bpfs: MockObject<GhostService>,
    logger: MockObject<PersistedConsoleLogger>

  beforeEach(() => {
    database = createSpyObject<Database>()
    configProvider = createSpyObject<ConfigProvider>()
    bpfs = createSpyObject<GhostService>()
    logger = createSpyObject<PersistedConsoleLogger>()
    logger.attachError.mockReturnValue(logger)
    service = new MigrationService(logger.T, database.T, configProvider.T, bpfs.T)
  })

  it('Test dry run', async () => {
    process.env.TESTMIG_BP_VERSION = '12.0.0'
    process.env.TESTMIG_CONFIG_VERSION = '12.5.0'
    process.MIGRATE_DRYRUN = true
    service.initialize()
    expect(service.executeMigrations).not.toHaveBeenCalled()
  })
})
