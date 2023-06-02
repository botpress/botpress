import * as utils from '../utils'
import { CONFIG_ENV_KEY, configSchema } from './config'
import { ChildProcessProps, processProps } from './is-child'

export const ENTRY_POINT = __filename

const childProcessEntrypoint = async (_props: ChildProcessProps) => {
  const rawConfig = process.env[CONFIG_ENV_KEY]
  if (!rawConfig) {
    throw new Error(`Config variable ${CONFIG_ENV_KEY} was not set`)
  }
  const config = configSchema.parse(JSON.parse(rawConfig))

  if (config.type === 'code') {
    utils.require.requireJsCode(config.code)
  }
  if (config.type === 'file') {
    utils.require.requireJsFile(config.file)
  }
}

if (processProps.type === 'child') {
  // here we are in the child process
  void childProcessEntrypoint(processProps)
}
