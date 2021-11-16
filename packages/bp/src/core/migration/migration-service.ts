import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { BotpressAPIProvider } from 'core/app/api'
import { container } from 'core/app/inversify/app.inversify'
import { TYPES } from 'core/app/types'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { PersistedConsoleLogger, centerText } from 'core/logger'
import fse from 'fs-extra'
import glob from 'glob'
import { Container, inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { studioActions } from 'orchestrator'
import path from 'path'
import semver from 'semver'
import stripAnsi from 'strip-ansi'
import yn from 'yn'

const debug = DEBUG('migration')

export const types = {
  database: 'Database Changes',
  config: 'Config File Changes',
  content: 'Changes to Content Files (*.json)'
}
/**
 * Use a combination of these environment variables to easily test migrations.
 * TESTMIG_ALL: Runs every migration since 12.0.0
 * TESTMIG_NEW: Runs new migrations after package.json version
 * TESTMIG_BP_VERSION: Change the target version of your migration
 * TESTMIG_CONFIG_VERSION: Override the current version of the server configuration
 * TESTMIG_DB_VERSION: Override the current version of the database
 * TESTMIG_IGNORE_LIST: Comma separated list of migration filename part to ignore
 */

export interface MigrationEntry {
  initialVersion: string
  targetVersion: string
  details: string | string[]
  created_at: any
}
@injectable()
export class MigrationService {
  /** This is the version we want to migrate to (either up or down) */
  public targetVersion: string
  /** Version of the content of the data folder */
  private configVersion!: string
  /** The current version of the database tables */
  private dbVersion!: string
  public loadedMigrations: { [filename: string]: Migration | sdk.ModuleMigration } = {}

  constructor(
    @tagged('name', 'Migration')
    @inject(TYPES.Logger)
    private logger: sdk.Logger,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.GhostService) private bpfs: GhostService
  ) {
    this.targetVersion = process.MIGRATE_TARGET || process.env.TESTMIG_BP_VERSION || process.BOTPRESS_VERSION
  }

  async initialize() {
    if (yn(process.env.SKIP_MIGRATIONS)) {
      debug('Skipping Migrations')
      return
    }

    const allMigrations = this.getAllMigrations()
    await this.detectAndSetupVersions(allMigrations)

    const migrationsToExecute = this.getMigrationsToExecute(allMigrations)
    if (!migrationsToExecute.length && process.MIGRATE_CMD === undefined) {
      return
    }

    const logs: string[] = []
    const captureLogger = PersistedConsoleLogger.listenForAllLogs((level, message) => {
      logs.push(`[${level}] ${stripAnsi(message)}`)
    })

    this.displayMigrationStatus(migrationsToExecute, this.logger)

    if (process.MIGRATE_DRYRUN) {
      const dryMigs = migrationsToExecute.filter(file => {
        const content = this.loadedMigrations[file.filename]
        return content.info.canDryRun
      })

      await this.executeMigrations(dryMigs)
      process.exit(0)
    }

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

    await this.executeMigrations(migrationsToExecute)

    captureLogger.dispose()

    await this.persistMigrationStatus(logs, migrationsToExecute)

    // If the core was migrated, check if bots also need to be migrated
    await studioActions.checkBotMigrations()

    if (process.MIGRATE_CMD !== undefined) {
      process.exit(0)
    }
  }

  getMigrationsToExecute(allMigrations: MigrationFile[]): MigrationFile[] {
    const isDown = process.MIGRATE_CMD === 'down'

    const migrations = _.sortBy(
      [
        ...this.filterMigrations(allMigrations, this.dbVersion, { isDown, type: 'database' }),
        ...this.filterMigrations(allMigrations, this.configVersion, { isDown, type: 'config' }),
        ...this.filterMigrations(allMigrations, this.configVersion, { isDown, type: 'content' })
      ],
      x => x.date
    )

    return isDown ? _.reverse(migrations) : migrations
  }

  async detectAndSetupVersions(migrations: MigrationFile[]) {
    if (process.MIGRATE_TARGET && !semver.valid(process.MIGRATE_TARGET)) {
      this.logger.error('A target version was specified but the format is invalid. Valid format: 12.0.0')
      process.exit(0)
    }

    this.configVersion = process.env.TESTMIG_CONFIG_VERSION || (await this.configProvider.getBotpressConfig()).version

    if (process.core_env.TESTMIG_ALL || process.core_env.TESTMIG_NEW) {
      const versions = migrations.map(x => x.version).sort(semver.compare)

      this.targetVersion = _.last(versions)!
      this.configVersion = yn(process.core_env.TESTMIG_NEW) ? process.BOTPRESS_VERSION : '12.0.0'
    }

    this.dbVersion = await this.getDbVersion()

    debug('Migration Check: %o', { config: this.configVersion, db: this.dbVersion, target: this.targetVersion })
  }

  public async getDbVersion(): Promise<string> {
    let dbVersion: string

    if (process.env.TESTMIG_DB_VERSION) {
      dbVersion = process.env.TESTMIG_DB_VERSION
    } else if (process.core_env.TESTMIG_ALL || process.core_env.TESTMIG_NEW) {
      dbVersion = yn(process.core_env.TESTMIG_NEW) ? process.BOTPRESS_VERSION : '12.0.0'
    } else {
      dbVersion = await this.getCurrentDbVersion()
    }

    return dbVersion
  }

  async persistMigrationStatus(logs: string[], migrationsToExecute: MigrationFile[]) {
    const entry: MigrationEntry = {
      initialVersion: this.configVersion,
      targetVersion: this.targetVersion,
      details: logs,
      created_at: new Date()
    }

    // srv_migrations tracks migration of botpress config, while srv_metadata is for the database
    try {
      await this.database
        .knex('srv_migrations')
        .insert({ ...entry, details: logs.join('\n'), created_at: this.database.knex.date.now() })
    } catch (err) {
      this.logger.attachError(err).warn("Couldn't save logs to database")
    }

    if (this.dbVersion !== this.targetVersion) {
      await this.database.knex('srv_metadata').insert({ server_version: this.targetVersion })
    }
  }

  async executeMigrations(missingMigrations: MigrationFile[]) {
    const isDown = process.MIGRATE_CMD === 'down'
    const logPrefix = process.MIGRATE_DRYRUN ? '[DRY] ' : ''
    const opts = await this.getMigrationOpts({ isDryRun: process.MIGRATE_DRYRUN })

    this.logger.info(chalk`
${_.repeat(' ', 9)}========================================
{bold ${centerText(
      `${logPrefix}Executing ${missingMigrations.length} migration${missingMigrations.length === 1 ? '' : 's'}`,
      40,
      9
    )}}
${_.repeat(' ', 9)}========================================`)

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
      if (process.env.TESTMIG_IGNORE_LIST?.split(',').filter(x => filename.includes(x)).length) {
        return this.logger.info(`${logPrefix}Skipping ignored migration file "${filename}"`)
      }

      this.logger.info(`${logPrefix}Running ${filename}`)

      let result
      if (isDown && this.loadedMigrations[filename].down) {
        result = await this.loadedMigrations[filename].down!(opts)
      } else if (!isDown) {
        result = await this.loadedMigrations[filename].up(opts)
      }

      if (result.success) {
        this.logger.info(`${logPrefix}- ${result.message || 'Success'}`)
      } else {
        hasFailures = true
        this.logger.error(`${logPrefix}- ${result.message || 'Failure'}`)
      }
    })

    if (hasFailures) {
      this.logger.error(
        `${logPrefix}Some steps failed to complete. Please fix errors manually, then restart Botpress so the update process may finish.`
      )

      if (!process.IS_FAILSAFE) {
        process.exit(0)
      }
    }

    if (!process.MIGRATE_DRYRUN) {
      await this.configProvider.mergeBotpressConfig({ version: this.targetVersion })
    }
    this.logger.info(`${logPrefix}Migration${missingMigrations.length === 1 ? '' : 's'} completed successfully! `)
  }

  private displayMigrationStatus(missingMigrations: MigrationFile[], logger: sdk.Logger) {
    const isDown = process.MIGRATE_CMD === 'down'
    const migrations = missingMigrations.map(x => this.loadedMigrations[x.filename].info)

    let headerLabel = chalk`{bold ${centerText(`Migration${migrations.length === 1 ? '' : 's'} Required`, 40, 9)}}`

    if (process.MIGRATE_DRYRUN) {
      headerLabel = chalk`{bold ${centerText('DRY RUN', 40, 9)}}`
    }

    let versionLabel = chalk`{dim ${centerText(`Version ${this.configVersion} => ${this.targetVersion} `, 40, 9)}}`

    if (this.configVersion !== this.dbVersion) {
      versionLabel = chalk`{dim ${centerText(`Database Version ${this.dbVersion} => ${this.targetVersion} `, 40, 9)}}
{dim ${centerText(`Config Version ${this.configVersion} => ${this.targetVersion} `, 40, 9)}}`
    }

    logger.warn(chalk`
${_.repeat(' ', 9)}========================================
${headerLabel}
${versionLabel}
{dim ${centerText(`${migrations.length} change${migrations.length === 1 ? '' : 's'}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

    Object.keys(types).map(type => {
      logger.warn(chalk`{bold ${types[type]}}`)
      const filtered = migrations.filter(x => x.type === type)

      if (filtered.length) {
        filtered.map(x => logger.warn(`- ${isDown ? '[rollback]' : ''} ${x.description}`))
      } else {
        logger.warn('- None')
      }
    })
  }

  public async getMigrationOpts(metadata?: sdk.MigrationMetadata) {
    return {
      bp: await container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Migration', 'core'),
      configProvider: this.configProvider,
      database: this.database,
      inversify: container,
      metadata: metadata || {}
    }
  }

  public getAllMigrations(): MigrationFile[] {
    const coreMigrations = this._getMigrations(path.join(__dirname, '../../migrations'), true)
    const moduleMigrations = _.flatMap(Object.keys(process.LOADED_MODULES), module =>
      this._getMigrations(path.join(process.LOADED_MODULES[module], 'dist/migrations'))
    )

    const migrations = [...coreMigrations, ...moduleMigrations]
    migrations.map(file => {
      if (!this.loadedMigrations[file.filename]) {
        this.loadedMigrations[file.filename] = require(file.location).default
      }
    })

    return migrations
  }

  public async getCurrentDbVersion(): Promise<string> {
    const query = await this.database
      .knex('srv_metadata')
      .select('server_version')
      .orderBy('created_at', 'desc')
      .then()
      .get(0)

    return query?.server_version || this.configVersion
  }

  private _getMigrations(rootPath: string, assertExists = false): MigrationFile[] {
    if (assertExists && !fse.existsSync(rootPath)) {
      throw new Error(`The migration directory '${rootPath}' does not exists`)
    }

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

  public filterMigrations = (
    files: MigrationFile[],
    currentVersion: string,
    { isDown, type, target }: { isDown?: boolean; type?: MigrationType; target?: MigrationTarget } = {
      isDown: false,
      type: undefined,
      target: undefined
    }
  ) => {
    const comparator = isDown
      ? `>${this.targetVersion} <= ${currentVersion}`
      : `>${currentVersion} <= ${this.targetVersion}`

    const filteredFiles = files.filter(file => semver.satisfies(file.version, comparator))

    if (_.isEmpty(this.loadedMigrations)) {
      return filteredFiles
    }

    return filteredFiles.filter(file => {
      const content = this.loadedMigrations[file.filename]

      return (
        ((isDown && content?.down) || (!isDown && content?.up)) &&
        (type === undefined || type === content?.info.type) &&
        (target === undefined || target === content?.info.target)
      )
    })
  }
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

export type MigrationType = 'database' | 'config' | 'content'
export type MigrationTarget = 'core' | 'bot'

export interface Migration {
  info: {
    description: string
    target?: MigrationTarget
    type: MigrationType
    canDryRun?: boolean
  }
  up: (opts: MigrationOpts | sdk.ModuleMigrationOpts) => Promise<sdk.MigrationResult>
  down?: (opts: MigrationOpts | sdk.ModuleMigrationOpts) => Promise<sdk.MigrationResult>
}
