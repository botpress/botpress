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
    const configVersion = (await this.configProvider.getBotpressConfig()).version
    debug(`Migration Check: %o`, { configVersion, currentVersion: this.currentVersion })

    if (process.env.SKIP_MIGRATIONS) {
      debug(`Skipping Migrations`)
      return
    }

    const missingMigrations = this.filterMissing(this.getAllMigrations(), configVersion)
    if (!missingMigrations.length) {
      return
    }

    this._loadMigrations(missingMigrations)
    this.displayMigrationStatus(configVersion, missingMigrations, this.logger)

    if (!process.AUTO_MIGRATE) {
      await this.logger.error(
        `Botpress needs to migrate your data. Please make a copy of your data, then start it with "./bp --auto-migrate"`
      )
      process.exit(1)
    }

    await this.executeMigrations(missingMigrations)
  }

  async executeMissingBotMigrations(botId: string, botVersion: string) {
    debug.forBot(botId, `Checking missing migrations for bot `, { botId, botVersion })

    const missingMigrations = this.filterBotTarget(this.filterMissing(this.getAllMigrations(), botVersion))
    if (!missingMigrations.length) {
      return
    }

    this.displayMigrationStatus(botVersion, missingMigrations, this.logger.forBot(botId))
    const opts = await this.getMigrationOpts({ botId })
    let hasFailures

    await Promise.mapSeries(missingMigrations, async ({ filename }) => {
      const result = await this.loadedMigrations[filename].up(opts)
      debug.forBot(botId, `Migration step finished`, { filename, result })
      if (result.success) {
        await this.logger.info(`- ${result.message || 'Success'}`)
      } else {
        hasFailures = true
        await this.logger.error(`- ${result.message || 'Failure'}`)
      }
    })

    if (hasFailures) {
      return this.logger.error(`Could not complete bot migration. It may behave unexpectedly.`)
    }

    await this.configProvider.mergeBotConfig(botId, { version: this.currentVersion })
  }

  private async executeMigrations(missingMigrations: MigrationFile[]) {
    const opts = await this.getMigrationOpts()

    this.logger.info(chalk`========================================
{bold ${center(`Executing ${missingMigrations.length.toString()} migrations`, 40)}}
========================================`)

    const completed = this._getCompletedMigrations()
    let hasFailures = false

    await Promise.mapSeries(missingMigrations, async ({ filename }) => {
      if (completed.includes(filename)) {
        return this.logger.info(`Skipping already migrated file "${filename}"`)
      }

      this.logger.info(`Running ${filename}`)

      const result = await this.loadedMigrations[filename].up(opts)
      if (result.success) {
        this._saveCompletedMigration(filename, result)
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

  private displayMigrationStatus(configVersion: string, missingMigrations: MigrationFile[], logger: sdk.Logger) {
    const migrations = missingMigrations.map(x => this.loadedMigrations[x.filename].info)

    logger.warn(chalk`========================================
{bold ${center(`Migration Required`, 40)}}
{dim ${center(`Version ${configVersion} => ${this.currentVersion} `, 40)}}
{dim ${center(`${migrations.length} changes`, 40)}}
========================================`)

    Object.keys(types).map(type => {
      logger.warn(chalk`{bold ${types[type]}}`)
      const filtered = migrations.filter(x => x.type === type)

      if (filtered.length) {
        filtered.map(x => logger.warn(`- ${x.description}`))
      } else {
        logger.warn(`- None`)
      }
    })
  }

  private async getMigrationOpts(metadata?: sdk.MigrationMetadata) {
    return {
      bp: await container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Migration', 'core'),
      configProvider: this.configProvider,
      database: this.database,
      inversify: container,
      metadata: metadata || {}
    }
  }

  private filterBotTarget(migrationFiles: MigrationFile[]): MigrationFile[] {
    this._loadMigrations(migrationFiles)
    return migrationFiles.filter(x => this.loadedMigrations[x.filename].info.target === 'bot')
  }

  private getAllMigrations(): MigrationFile[] {
    const coreMigrations = this._getMigrations(path.join(__dirname, '../../../migrations'))
    const moduleMigrations = _.flatMap(Object.keys(process.LOADED_MODULES), module =>
      this._getMigrations(path.join(process.LOADED_MODULES[module], 'dist/migrations'))
    )

    return [...coreMigrations, ...moduleMigrations]
  }

  private _getCompletedMigrations(): string[] {
    return fs.readdirSync(this.completedMigrationsDir)
  }

  private _saveCompletedMigration(filename: string, result: sdk.MigrationResult) {
    fs.writeFileSync(path.resolve(`${this.completedMigrationsDir}/${filename}`), JSON.stringify(result, undefined, 2))
  }

  private _loadMigrations = (fileList: MigrationFile[]) =>
    fileList.map(file => {
      if (!this.loadedMigrations[file.filename]) {
        this.loadedMigrations[file.filename] = require(file.location).default
      }
    })

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

  private filterMissing = (files: MigrationFile[], version) =>
    files.filter(file => semver.satisfies(file.version, `>${version} <= ${this.currentVersion}`))
}

export interface MigrationFile {
  date: number
  version: string
  location: string
  filename: string
  title: string
}

export interface MigrationOpts {
  bp: typeof sdk
  configProvider: ConfigProvider
  database: Database
  inversify: Container
  metadata: sdk.MigrationMetadata
}

export interface Migration {
  info: {
    description: string
    target?: 'core' | 'bot'
    type: 'database' | 'config' | 'content'
  }
  up: (opts: MigrationOpts | sdk.ModuleMigrationOpts) => Promise<sdk.MigrationResult>
  down?: (opts: MigrationOpts | sdk.ModuleMigrationOpts) => Promise<sdk.MigrationResult>
}
