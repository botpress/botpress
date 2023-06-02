import { Logger } from '@bpinternal/log4bot'
import chalk from 'chalk'
import { checkAll } from './check'
import { getConfig } from './config'
import { startServer } from './server'

void main()

async function main() {
  const logger = new Logger()
  let ready = false

  const config = getConfig()

  const readinessMap = Object.fromEntries(config.map((c) => [c.name, false]))

  void checkAll(logger, config, (name: string, isReady: boolean) => {
    readinessMap[name] = isReady

    const allReady = Object.values(readinessMap).every((r) => r)

    if (allReady && !ready) {
      logger.info(chalk.green('All checks passed!'))
      ready = true
    } else if (ready && !allReady) {
      logger.info(chalk.red('Some checks failed!'))
      ready = false
    }
  })

  await startServer(logger, (_, res) => {
    if (ready) {
      logger.debug(`Received readiness probe ${chalk.green('OK')}`)
      res.sendStatus(200)
    } else {
      logger.info(`Received readiness probe ${chalk.red('NOT READY')}`)
      res.sendStatus(400)
    }
  })
}
