import { BotpressRuntime, RuntimeSetup } from './startup/embedded'
import { setupProcess } from './startup/misc'

/**
 * There are two different startups possible for the runtime:
 * - As a standalone (with the limited sdk)
 * - Started from Botpress (with the usuak sdk & module middlewares)
 */

if (!module.parent) {
  process.IS_STANDALONE = true
  require('./startup/standalone')
}

export let runtime: BotpressRuntime

export const initRuntime = async (config?: RuntimeSetup) => {
  process.runtime_env = process.env as RuntimeEnvironmentVariables

  if (!config) {
    console.error('Configuration is missing. Cannot initialize runtime.')
    return
  }

  const { start } = require('./runtime/app/bootstrap')
  runtime = await start(config)
}

export { BotpressRuntime, RuntimeSetup, setupProcess }
