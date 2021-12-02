import { createLoggerProvider } from 'core/app/core-loader'
import versions from 'core/migration/versions.json'
import { spawnWebWorker, startNluServer, startStudio } from 'orchestrator'
import { startMessagingServer } from './messaging-server'

/**
 * When the command migrate up or down is used, we start each process with the migration arguments.
 * They must handle all arguments and exit automatically when finished
 */
export const runMigrator = async () => {
  const loggerProvider = createLoggerProvider()
  const logger = await loggerProvider('[Migrator]')

  logger.info('Starting Messaging migrations...')
  await Promise.fromCallback(cb => startMessagingServer(logger, undefined, cb))

  // Temporary until studio migrations are updated correctly
  // logger.info('Starting Studio migrations...')
  // await Promise.fromCallback(cb => startStudio(logger, undefined, cb))

  // To enable once NLU supports the migration mechanism
  // logger.info('Starting NLU migrations...')
  // await Promise.fromCallback(cb => startNluServer(logger, undefined, cb))

  logger.info('Starting Botpress server migrations...')
  spawnWebWorker()
}

export const getMigrationArgs = (processName: string) => {
  return {
    MIGRATE_CMD: process.MIGRATE_CMD,
    MIGRATE_TARGET: versions[process.BOTPRESS_VERSION]?.[processName],
    MIGRATE_DRYRUN: process.MIGRATE_DRYRUN?.toString(),
    AUTO_MIGRATE: process.AUTO_MIGRATE?.toString()
  }
}
