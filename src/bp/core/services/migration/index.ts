import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { BotpressAPIProvider } from 'core/api'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import center from 'core/logger/center'
import { TYPES } from 'core/types'
import fs from 'fs'
import glob from 'glob'
import { Container, inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import semver from 'semver'

import { container } from '../../app.inversify'

const debug = DEBUG('migration')

const types = {
  database: 'Database Changes',
  config: 'Config File Changes',
  content: 'Changes to Content Files (*.json)'
}

@injectable()
export class MigrationService {
  /** This is the declared version in the configuration file */
  private configVersion!: string
  /** This is the actual running version (package.json) */
  private currentVersion: string
  private loadedMigrations: { [filename: string]: Migration | sdk.ModuleMigration } = {}
  private completedMigrationsDir: string

  constructor(
    @tagged('name', 'Migration')
    @inject(TYPES.Logger)
    private logger: sdk.Logger,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {
    this.currentVersion = process.env.MIGRATION_TEST_VERSION || process.BOTPRESS_VERSION
    this.completedMigrationsDir = path.resolve(process.PROJECT_LOCATION, `data/migrations`)
    mkdirp.sync(this.completedMigrationsDir)
  }

  async initialize() {
    this.configVersion = (await this.configProvider.getBotpressConfig()).version
    debug(`Migration Check: %o`, { configVersion: this.configVersion, currentVersion: this.currentVersion })

    if (process.env.SKIP_MIGRATIONS) {
      debug(`Skipping Migrations`)
      return
    }

    const missingMigrations = [...this._getMissingCoreMigrations(), ...this._getMissingModuleMigrations()]
    if (!missingMigrations.length) {
      return
    }

    this._loadMigrations(missingMigrations)
    this._displayStatus()

    if (!process.AUTO_MIGRATE) {
      await this.logger.error(
        `Botpress needs to migrate your data. Please make a copy of your data, then start it with "./bp --auto-migrate"`
      )
      process.exit(1)
    }

    await this.execute()
  }

  private _displayStatus() {
    const migrations = Object.keys(this.loadedMigrations).map(filename => this.loadedMigrations[filename].info)

    this.logger.warn(chalk`========================================
{bold ${center(`Migration Required`, 40)}}
{dim ${center(`Version ${this.configVersion} => ${this.currentVersion} `, 40)}}
{dim ${center(`${migrations.length} changes`, 40)}}
========================================`)

    Object.keys(types).map(type => {
      this.logger.warn(chalk`{bold ${types[type]}}`)
      const filtered = migrations.filter(x => x.type === type)

      if (filtered.length) {
        filtered.map(x => this.logger.warn(`- ${x.description}`))
      } else {
        this.logger.warn(`- None`)
      }
    })
  }

  async execute() {
    const migrationCount = Object.keys(this.loadedMigrations).length
    const api = await container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Migration', 'core')

    this.logger.info(chalk`========================================
{bold ${center(`Executing ${migrationCount.toString()} migrations`, 40)}}
========================================`)

    const completed = this._getCompletedMigrations()
    let hasFailures = false

    await Promise.mapSeries(Object.keys(this.loadedMigrations), async file => {
      if (completed.includes(file)) {
        return this.logger.info(`Skipping already migrated file "${file}"`)
      }

      this.logger.info(`Running ${file}`)

      const result = await this.loadedMigrations[file].up(api, this.configProvider, this.database, container)
      if (result.success) {
        this._saveCompletedMigration(file, result)
        await this.logger.info(`- ${result.message || 'Success'}`)
      } else {
        hasFailures = true
        await this.logger.error(`- ${result.message || 'Failure'}`)
      }
    })

    if (hasFailures) {
      await this.logger.error(
        `Some steps failed to complete. Please fix errors manually, then restart Botpress so the update process may finish.`
      )
      process.exit(1)
    }

    await this.configProvider.mergeBotpressConfig({ version: this.currentVersion })
    this.logger.info(`Migrations completed successfully! `)
  }

  private _getCompletedMigrations(): string[] {
    return fs.readdirSync(this.completedMigrationsDir)
  }

  private _saveCompletedMigration(filename: string, result: sdk.MigrationResult) {
    fs.writeFileSync(path.resolve(`${this.completedMigrationsDir}/${filename}`), JSON.stringify(result, undefined, 2))
  }

  private _loadMigrations = (fileList: MigrationFile[]) =>
    fileList.map(file => (this.loadedMigrations[file.filename] = require(file.location).default))

  private _getMissingCoreMigrations() {
    return this._getFilteredMigrations(path.join(__dirname, '../../../migrations'))
  }

  private _getMissingModuleMigrations() {
    return _.flatMap(Object.keys(process.LOADED_MODULES), module =>
      this._getFilteredMigrations(path.join(process.LOADED_MODULES[module], 'dist/migrations'))
    )
  }

  private _getFilteredMigrations = (rootPath: string) => this._filterMissing(this._getMigrations(rootPath))

  private _getMigrations(rootPath: string): MigrationFile[] {
    return _.orderBy(
      glob.sync('**/*.js', { cwd: rootPath }).map(filepath => {
        const [rawVersion, timestamp, title] = path.basename(filepath).split('-')
        return {
          filename: path.basename(filepath),
          version: semver.valid(rawVersion.replace(/_/g, '.')),
          title: (title || '').replace('.js', ''),
          date: Number(timestamp),
          location: path.join(rootPath, filepath)
        }
      }),
      'date'
    )
  }

  private _filterMissing = (files: MigrationFile[]) =>
    files.filter(file => semver.satisfies(file.version, `>${this.configVersion} <= ${this.currentVersion}`))
}

interface MigrationFile {
  date: number
  version: string
  location: string
  filename: string
  title: string
}

export interface Migration {
  info: {
    description: string
    type: 'database' | 'config' | 'content'
  }
  up: (bp: typeof sdk, config: ConfigProvider, database: Database, inversify: Container) => Promise<sdk.MigrationResult>
  down?: (
    bp: typeof sdk,
    config: ConfigProvider,
    database: Database,
    inversify: Container
  ) => Promise<sdk.MigrationResult>
}
