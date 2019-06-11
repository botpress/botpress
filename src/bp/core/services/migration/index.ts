import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { ModuleLoader } from 'core/module-loader'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import Database from '../../database'
import { TYPES } from '../../types'
import { BotService } from '../bot-service'
import { WorkspaceService } from '../workspace-service'

import Migration11_9_2 from './migration_11_9_2'
import Migration12_0_0 from './migration_12_0_0'

export interface MigrationStep {
  execute(dryRun?: boolean): Promise<sdk.MigrationStatus>
}

@injectable()
export class MigrationService {
  private migration12_0_0: Migration12_0_0
  private migration11_9_2: Migration11_9_2

  private _migrationPipeline: MigrationStep[] = []

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'MigrationService')
    private logger: sdk.Logger,
    @inject(TYPES.ConfigProvider) configProvider: ConfigProvider,
    @inject(TYPES.BotService) botService: BotService,
    @inject(TYPES.WorkspaceService) workspaceService: WorkspaceService,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
  ) {
    this.migration12_0_0 = new Migration12_0_0(configProvider)
    this.migration11_9_2 = new Migration11_9_2(logger, configProvider, botService, workspaceService)

    this._migrationPipeline = [this.migration11_9_2, this.migration12_0_0]
  }

  public async executeMigrations(isFirstRun?: boolean) {
    if (!process.AUTO_MIGRATE && !isFirstRun) {
      await this._checkRequiredMigrations()
    }

    await this.database.runCoreMigrations()
    if (this.moduleLoader.dbMigrationDirs.length) {
      await this.database.runModuleMigrations(this.moduleLoader.dbMigrationDirs)
    }

    await Promise.map(this._migrationPipeline, step => step.execute())
    await this.moduleLoader.modulesMigrationRequest()
  }

  private async _checkRequiredMigrations() {
    const migrations: string[] = []
    if (await this._hasDbMigrations()) {
      migrations.push('Database Structure')
    }

    const moduleMigrations = await this.moduleLoader.modulesMigrationRequest(true)
    const coreMigrations = await Promise.map(this._migrationPipeline, step => step.execute(true))

    const migrationStatus = [...coreMigrations, ...moduleMigrations]
    if (_.find(migrationStatus, 'hasConfigChanges')) {
      migrations.push('Configuration')
    }

    if (_.find(migrationStatus, 'hasFileChanges')) {
      migrations.push('Content Files')
    }

    if (!migrations.length) {
      return
    }

    await this.logger.error(
      `
        MIGRATION WARNING
        ------------------
        Botpress needs to update some files to work proprely.
        We recommend backing up your data before proceeding.

        When it's done, start Botpress with the flag --auto-migrate

        Migration required for ${migrations.join(', ')}`
    )

    process.exit(1)
  }

  private async _hasDbMigrations() {
    if (await this.database.runCoreMigrations(true)) {
      return true
    }

    const migrationDirs = this.moduleLoader.dbMigrationDirs
    if (migrationDirs.length && (await this.database.runModuleMigrations(migrationDirs, true))) {
      return true
    }

    return false
  }
}
