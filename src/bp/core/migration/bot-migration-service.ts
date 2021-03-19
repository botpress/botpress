import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { PersistedConsoleLogger, centerText } from 'core/logger'
import _ from 'lodash'
import path from 'path'
import stripAnsi from 'strip-ansi'

import { MigrationEntry, MigrationFile, MigrationService, types } from '.'

const debug = DEBUG('migration')

export class BotMigrationService {
  constructor(
    private migService: MigrationService,
    private logger: sdk.Logger,
    private configProvider: ConfigProvider,
    private bpfs: GhostService
  ) {}

  async executeMissingBotMigrations(botId: string, currentVersion: string, isDown?: boolean) {
    debug.forBot(botId, 'Checking missing migrations for bot ', { botId, currentVersion, isDown })

    const missingMigrations = this.migService.filterMigrations(this.migService.getAllMigrations(), currentVersion, {
      isDown,
      target: 'bot'
    })

    if (!missingMigrations.length) {
      return
    }

    const logs: string[] = []
    const captureLogger = PersistedConsoleLogger.listenForAllLogs((level, message) => {
      logs.push(`[${level}] ${stripAnsi(message)}`)
    }, botId)

    try {
      this.displayMigrationStatus(currentVersion, missingMigrations, this.logger.forBot(botId))
      await this.executeBotMigrations(botId, missingMigrations)
    } finally {
      captureLogger.dispose()

      await this.saveBotMigrationLog(botId, {
        initialVersion: currentVersion,
        targetVersion: this.migService.targetVersion,
        created_at: new Date(),
        details: logs
      })
    }
  }

  async coreMigrationCompleted(entry: MigrationEntry, migrations: MigrationFile[]) {
    const hasBotMigrations = !!migrations.find(x => this.migService.loadedMigrations[x.filename].info.target === 'bot')
    if (!hasBotMigrations) {
      return
    }

    const botIds = (await this.bpfs.bots().directoryListing('/', 'bot.config.json')).map(path.dirname)

    for (const id of botIds) {
      await this.saveBotMigrationLog(id, entry)
      await this.configProvider.mergeBotConfig(id, { version: this.migService.targetVersion }, true)
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

  private displayMigrationStatus(configVersion: string, missingMigrations: MigrationFile[], logger: sdk.Logger) {
    const migrations = missingMigrations.map(x => this.migService.loadedMigrations[x.filename].info)

    logger.warn(chalk`
${_.repeat(' ', 9)}========================================
{bold ${centerText(`Migration${migrations.length === 1 ? '' : 's'} Required`, 40, 9)}}
{dim ${centerText(`Version ${configVersion} => ${this.migService.targetVersion} `, 40, 9)}}
{dim ${centerText(`${migrations.length} change${migrations.length === 1 ? '' : 's'}`, 40, 9)}}
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

  private async executeBotMigrations(botId: string, missingMigrations: MigrationFile[]) {
    this.logger.info(chalk`
${_.repeat(' ', 9)}========================================
{bold ${centerText(
      `Executing ${missingMigrations.length} migration${missingMigrations.length === 1 ? '' : 's'}`,
      40,
      9
    )}}
${_.repeat(' ', 9)}========================================`)

    const opts = await this.migService.getMigrationOpts({ botId })
    let hasFailures = false

    await Promise.mapSeries(missingMigrations, async ({ filename }) => {
      const result = await this.migService.loadedMigrations[filename].up(opts)
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

    await this.configProvider.mergeBotConfig(botId, { version: this.migService.targetVersion })

    this.logger.info(`Migration${missingMigrations.length === 1 ? '' : 's'} completed successfully! `)
  }
}
