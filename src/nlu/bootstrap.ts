import chalk from 'chalk'
import path from 'path'

process.core_env = process.env as BotpressEnvironmentVariables
global['NativePromise'] = global.Promise

if (process.env.APP_DATA_PATH) {
  process.APP_DATA_PATH = process.env.APP_DATA_PATH
} else {
  process.APP_DATA_PATH = getAppDataPath()
}

export function getAppDataPath() {
  const homeDir = process.env.HOME || process.env.APPDATA
  if (homeDir) {
    if (process.platform === 'darwin') {
      return path.join(homeDir, 'Library', 'Application Support', 'botpress')
    }

    return path.join(homeDir, 'botpress')
  }

  console.error(
    chalk.red(`Could not determine your HOME directory.
Please set the environment variable "APP_DATA_PATH", then start Botpress`)
  )
  process.exit()
}
