import axios from 'axios'
import chalk from 'chalk'
import path from 'path'
import { toolsList } from './cli'

interface GithubRelease {
  tag_name: string
  assets: {
    id: string
    name: string
    size: number
    browser_download_url: string
  }[]
}

export interface ProcessedRelease {
  fileId: string
  version: string
  fileName: string
  fileSize: number
  downloadUrl: string
}

export const getReleasedFiles = async (toolName: string, platform: string): Promise<ProcessedRelease[]> => {
  try {
    const platformMatch = new RegExp(`.*-(${platform.replace('win32', 'win')})-x64`)

    const { data } = await axios.get<GithubRelease[]>(toolsList[toolName].url)
    const files = data.map(x => {
      const platformFile = x.assets.find(asset => platformMatch.test(asset.name))

      return {
        fileId: platformFile?.id || '',
        version: x.tag_name,
        fileName: platformFile?.name || '',
        fileSize: platformFile?.size || -1,
        downloadUrl: platformFile?.browser_download_url || ''
      }
    })

    return files.filter(x => x.fileName)
  } catch (err) {
    logger.error(err)
    return []
  }
}

export const getAppDataPath = () => {
  const homeDir = process.env.HOME || process.env.APPDATA
  if (homeDir) {
    if (process.platform === 'darwin') {
      return path.join(homeDir, 'Library', 'Application Support', 'botpress')
    }

    return path.join(homeDir, 'botpress')
  }

  logger.error(
    chalk.red(`Could not determine your HOME directory.
Please set the environment variable "APP_DATA_PATH", then start Botpress`)
  )
  process.exit()
}

export const APP_PREFIX = '[BP Downloader]'
export const logger = {
  info: (log: string) => {
    console.info(chalk.green(APP_PREFIX), log)
  },
  error: (log: string) => {
    console.error(chalk.red(APP_PREFIX), log)
  }
}
