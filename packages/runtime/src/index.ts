import { BotpressRuntime, RuntimeSetup } from './embedded'

/**
 * There are two different startups possible for the runtime:
 * - As a standalone (with the limited sdk)
 * - Started from Botpress (with the usuak sdk & module middlewares)
 *
 * The standalone
 */

/** When getos hasn't been run, start the standalone server */
if (!process.distro) {
  require('./standalone')
}

export let runtime: BotpressRuntime

export const initRuntime = async (config?: RuntimeSetup) => {
  if (!config) {
    console.error('Runtime is not initialized')
    process.exit(1)
  }

  const { start } = require('./runtime/app/bootstrap')
  runtime = await start(config)
}

export { BotpressRuntime, RuntimeSetup }
