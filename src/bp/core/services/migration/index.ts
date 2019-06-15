import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { BotpressAPIProvider } from 'core/api'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import center from 'core/logger/center'
import { TYPES } from 'core/types'
import glob from 'glob'
import { Container, inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'
import semver from 'semver'

import { container } from '../../app.inversify'

const types = {
  database: 'Database Changes',
  config: 'Config File Changes',
  content: 'Changes to Content Files (*.json)'
}

@injectable()
export class MigrationService {
  /** This is the declared version in the configuration file */
  private configVersion: string
  /** This is the actual running version (package.json) */
  private currentVersion: string
  private loadedMigrations: { [filename: string]: Migration } = {}

  constructor(
    @tagged('name', 'Migration')
    @inject(TYPES.Logger)
    private logger: sdk.Logger,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ConfigProvider) private config: ConfigProvider
  ) {
    this.configVersion = process.BOTPRESS_VERSION
    this.currentVersion = '12.2.0'
  }

  async initialize() {
    const missingMigrations = [...this._getMissingCoreMigrations(), ...this._getMissingModuleMigrations()]
    if (!missingMigrations.length) {
      return
    }

    this._loadMigrations(missingMigrations)
    this._displayStatus()

    if (!process.AUTO_MIGRATE) {
      await this.logger.error(`Please start Botpress with the flag --auto-migrate once you have a backup of your data.`)
      process.exit(1)
    } else {
      await this.execute()
    }
  }

  private _displayStatus() {
    const migrations = Object.keys(this.loadedMigrations).map(filename => {
      const details = this.loadedMigrations[filename]
      return { type: details.info.type, description: details.info.description }
    })

    this.logger.warn(chalk`========================================
{bold ${center(`Migration Required`, 40)}}
{dim ${center(`Version ${this.configVersion} => ${this.currentVersion} `, 40)}}
{dim ${center(`${migrations.length} changes`, 40)}}
========================================`)

    Object.keys(types).map(type => {
      this.logger.warn(chalk`{bold ${types[type]}}`)
      const rows = migrations.filter(x => x.type === type).map(x => this.logger.warn(`- ${x.description}`))

      if (!rows.length) {
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

    await Promise.mapSeries(Object.keys(this.loadedMigrations), async file => {
      this.logger.info(`Running ${file}`)
      const result = await this.loadedMigrations[file].up(api, this.config, this.database, container)
      result && (await this.logger.info(`- ${result}`))
    })

    this.logger.info(`Migrations completed successfully! `)
    // Upgrade version
  }

  private _loadMigrations = (fileList: MigrationFile[]) =>
    fileList.map(file => (this.loadedMigrations[file.filename] = require(file.location).default))

  private _getMissingCoreMigrations() {
    return this._getFilteredMigrations(path.join(__dirname, '../../../migrations'))
  }

  private _getMissingModuleMigrations() {
    return _.flatten(
      Object.keys(process.LOADED_MODULES).map(module =>
        this._getFilteredMigrations(path.join(process.LOADED_MODULES[module], 'dist/migrations'))
      )
    )
  }

  private _getFilteredMigrations = (rootPath: string) => this._filterMissing(this._getMigrations(rootPath))

  private _getMigrations(rootPath: string): MigrationFile[] {
    return _.orderBy(
      glob.sync('**/*.js', { cwd: rootPath }).map(filename => {
        const [rawVersion, timestamp, title] = filename.split('-')
        return {
          filename,
          version: semver.valid(rawVersion),
          title: title.replace('.js', ''),
          date: Number(timestamp),
          location: path.join(rootPath, filename)
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

export interface MigrationResult {
  success?: string
  failure?: string
}

export type MigrationType = 'database' | 'config' | 'content'
export interface Migration {
  info: {
    description: string
    type: MigrationType
  }
  up: (bp: typeof sdk, config: ConfigProvider, database: Database, inversify: Container) => Promise<MigrationResult>
  down?: (bp: typeof sdk, config: ConfigProvider, database: Database, inversify: Container) => Promise<MigrationResult>
}
