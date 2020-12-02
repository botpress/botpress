import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { BotpressAPIProvider } from 'core/api'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { PersistedConsoleLogger } from 'core/logger'
import center from 'core/logger/center'
import { stringify } from 'core/misc/utils'
import { TYPES } from 'core/types'
import fse from 'fs-extra'
import glob from 'glob'
import { Container, inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import semver from 'semver'
import stripAnsi from 'strip-ansi'
import yn from 'yn'

import { container } from '../../app.inversify'
import { GhostService } from '../ghost/service'

const debug = DEBUG('migration')

const types = {
  database: 'Database Changes',
  config: 'Config File Changes',
  content: 'Changes to Content Files (*.json)'
}
/**
 * Use a combination of these environment variables to easily test migrations.
 * TESTMIG_ALL: Runs every migration since 12.0.0
 * TESTMIG_NEW: Runs new migrations after package.json version
 * TESTMIG_BP_VERSION: Change the target version of your migration
 * TESTMIG_CONFIG_VERSION: Override the current version of the server
 * TESTMIG_IGNORE_COMPLETED: Ignore completed migrations (so they can be run again and again)
 * TESTMIG_IGNORE_LIST: Comma separated list of migration filename part to ignore
 */

interface MigrationEntry {
  initialVersion: string
  targetVersion: string
  details: string | string[]
  created_at: any
}

@injectable()
export class MigrationService {
  /** This is the actual running version (package.json) */
  private currentVersion: string
  private configVersion?: string
  private loadedMigrations: { [filename: string]: Migration | sdk.ModuleMigration } = {}

  constructor(
    @tagged('name', 'Migration')
    @inject(TYPES.Logger)
    private logger: sdk.Logger,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.GhostService) private bpfs: GhostService
  ) {
    this.currentVersion = process.env.TESTMIG_BP_VERSION || process.BOTPRESS_VERSION
  }

  async initialize() {
    this.configVersion = process.env.TESTMIG_CONFIG_VERSION || (await this.configProvider.getBotpressConfig()).version

    debug('Migration Check: %o', { configVersion: this.configVersion, currentVersion: this.currentVersion })

    if (yn(process.env.SKIP_MIGRATIONS)) {
      debug('Skipping Migrations')
      return
    }

    const allMigrations = this.getAllMigrations()

    if (process.core_env.TESTMIG_ALL || process.core_env.TESTMIG_NEW) {
      const versions = allMigrations.map(x => x.version).sort(semver.compare)

      this.currentVersion = _.last(versions)!
      this.configVersion = yn(process.core_env.TESTMIG_NEW) ? process.BOTPRESS_VERSION : '12.0.0'
    }

    const missingMigrations = this.filterMissing(allMigrations, this.configVersion)
    if (!missingMigrations.length) {
      return
    }

    this._loadMigrations(missingMigrations)

    const logs: string[] = []
    const captureLogger = PersistedConsoleLogger.listenForAllLogs((level, message) => {
      logs.push(`[${level}] ${stripAnsi(message)}`)
    })

    this.displayMigrationStatus(this.configVersion, missingMigrations, this.logger)

    if (!process.AUTO_MIGRATE) {
      this.logger.error(
        'Botpress needs to migrate your data. Please make a copy of your data, then start it with "./bp --auto-migrate"'
      )

      // When failsafe is enabled, simply stop executing migrations
      if (!process.IS_FAILSAFE) {
        process.exit(0)
      } else {
        return
      }
    }

    await this.executeMigrations(missingMigrations)

    captureLogger.dispose()

    const entry: Partial<MigrationEntry> = {
      initialVersion: this.configVersion,
      targetVersion: this.currentVersion
    }

    await this.database
      .knex('srv_migrations')
      .insert({ ...entry, details: logs.join('\n'), created_at: this.database.knex.date.now() })

    const hasBotMigrations = !!missingMigrations.find(x => this.loadedMigrations[x.filename].info.target === 'bot')
    if (hasBotMigrations) {
      const botIds = (await this.bpfs.bots().directoryListing('/', 'bot.config.json')).map(path.dirname)

      for (const id of botIds) {
        await this.saveBotMigrationLog(id, { ...entry, details: logs, created_at: new Date() } as MigrationEntry)
      }
    }
  }

  async saveBotMigrationLog(botId: string, entry: MigrationEntry) {
    const entries: MigrationEntry[] = [entry]

    if (await this.bpfs.forBot(botId).fileExists('/', 'migrations.json')) {
      const pastMigrations = await this.bpfs.forBot(botId).readFileAsObject<MigrationEntry[]>('/', 'migrations.json')
      entries.push(...pastMigrations)
    }

    await this.bpfs.forBot(botId).upsertFile('/', 'migrations.json', JSON.stringify(entries, undefined, 2))
  }

  async executeMissingBotMigrations(botId: string, botVersion: string) {
    debug.forBot(botId, 'Checking missing migrations for bot ', { botId, botVersion })

    const missingMigrations = this.filterBotTarget(this.filterMissing(this.getAllMigrations(), botVersion))
    if (!missingMigrations.length) {
      return
    }

    const logs: string[] = []
    const captureLogger = PersistedConsoleLogger.listenForAllLogs((level, message) => {
      logs.push(`[${level}] ${stripAnsi(message)}`)
    }, botId)

    try {
      this.displayMigrationStatus(botVersion, missingMigrations, this.logger.forBot(botId))
      await this.executeBotMigrations(botId, missingMigrations)
    } finally {
      captureLogger.dispose()

      await this.saveBotMigrationLog(botId, {
        initialVersion: botVersion,
        targetVersion: this.currentVersion,
        created_at: new Date(),
        details: logs
      })
    }
  }

  private async executeBotMigrations(botId: string, missingMigrations: MigrationFile[]) {
    this.logger.info(chalk`
${_.repeat(' ', 9)}========================================
{bold ${center(`Executing ${missingMigrations.length} migration${missingMigrations.length === 1 ? '' : 's'}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

    const opts = await this.getMigrationOpts({ botId })
    let hasFailures = false

    await Promise.mapSeries(missingMigrations, async ({ filename }) => {
      const result = await this.loadedMigrations[filename].up(opts)
      debug.forBot(botId, 'Migration step finished', { filename, result })
      if (result.success) {
        this.logger.forBot(botId).info(`- ${result.message || 'Success'}`)
      } else {
        hasFailures = true
        this.logger.forBot(botId).error(`- ${result.message || 'Failure'}`)
      }
    })

    if (hasFailures) {
      return this.logger.error('Could not complete bot migration. It may behave unexpectedly.')
    }

    await this.configProvider.mergeBotConfig(botId, { version: this.currentVersion })

    this.logger.info(`Migration${missingMigrations.length === 1 ? '' : 's'} completed successfully! `)
  }

  private async executeMigrations(missingMigrations: MigrationFile[]) {
    const opts = await this.getMigrationOpts()

    this.logger.info(chalk`
${_.repeat(' ', 9)}========================================
{bold ${center(`Executing ${missingMigrations.length} migration${missingMigrations.length === 1 ? '' : 's'}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

    const completed = await this._getCompletedMigrations()
    let hasFailures = false

    // Clear the Botpress cache before executing any migrations
    try {
      const cachePath = path.join(process.APP_DATA_PATH, 'cache')
      if (process.APP_DATA_PATH && fse.pathExistsSync(cachePath)) {
        fse.removeSync(cachePath)
        this.logger.info('Cleared cache')
      }
    } catch (err) {
      this.logger.attachError(err).warn('Could not clear cache')
    }

    await Promise.mapSeries(missingMigrations, async ({ filename }) => {
      if (completed.includes(filename)) {
        return this.logger.info(`Skipping already migrated file "${filename}"`)
      }

      if (process.env.TESTMIG_IGNORE_LIST?.split(',').filter(x => filename.includes(x)).length) {
        return this.logger.info(`Skipping ignored migration file "${filename}"`)
      }

      this.logger.info(`Running ${filename}`)

      const result = await this.loadedMigrations[filename].up(opts)
      if (result.success) {
        await this._saveCompletedMigration(filename, result)
        this.logger.info(`- ${result.message || 'Success'}`)
      } else {
        hasFailures = true
        this.logger.error(`- ${result.message || 'Failure'}`)
      }
    })

    if (hasFailures) {
      this.logger.error(
        'Some steps failed to complete. Please fix errors manually, then restart Botpress so the update process may finish.'
      )

      if (!process.IS_FAILSAFE) {
        process.exit(0)
      }
    }

    await this.updateAllVersions()
    this.logger.info(`Migration${missingMigrations.length === 1 ? '' : 's'} completed successfully! `)
  }

  private async updateAllVersions() {
    await this.configProvider.mergeBotpressConfig({ version: this.currentVersion })

    const botIds = (await this.bpfs.bots().directoryListing('/', 'bot.config.json')).map(path.dirname)
    for (const botId of botIds) {
      await this.configProvider.mergeBotConfig(botId, { version: this.currentVersion }, true)
    }
  }

  private displayMigrationStatus(configVersion: string, missingMigrations: MigrationFile[], logger: sdk.Logger) {
    const migrations = missingMigrations.map(x => this.loadedMigrations[x.filename].info)

    logger.warn(chalk`
${_.repeat(' ', 9)}========================================
{bold ${center(`Migration${migrations.length === 1 ? '' : 's'} Required`, 40, 9)}}
{dim ${center(`Version ${configVersion} => ${this.currentVersion} `, 40, 9)}}
{dim ${center(`${migrations.length} change${migrations.length === 1 ? '' : 's'}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

    Object.keys(types).map(type => {
      logger.warn(chalk`{bold ${types[type]}}`)
      const filtered = migrations.filter(x => x.type === type)

      if (filtered.length) {
        filtered.map(x => logger.warn(`- ${x.description}`))
      } else {
        logger.warn('- None')
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

  private async _getCompletedMigrations(): Promise<string[]> {
    if (
      yn(process.core_env.TESTMIG_IGNORE_COMPLETED) ||
      yn(process.core_env.TESTMIG_ALL) ||
      yn(process.core_env.TESTMIG_NEW)
    ) {
      return []
    }

    return this.bpfs.root().directoryListing('migrations')
  }

  private _saveCompletedMigration(filename: string, result: sdk.MigrationResult): Promise<void> {
    return this.bpfs.root().upsertFile('migrations', filename, stringify(result))
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
          version: semver.valid(rawVersion.replace(/_/g, '.')) as string,
          title: (title || '').replace(/\.js$/i, ''),
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
