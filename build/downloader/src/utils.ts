import axios from 'axios'
import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import xml2js from 'xml2js'

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

interface MetadataFile {
  [fileName: string]: ProcessedRelease & { installDate: Date }
}

interface S3Response {
  ListBucketResult: {
    Contents: [
      {
        Key: string[]
        ETag: string[]
        Size: string[]
      }
    ]
  }
}

const DEV_BIN_URL = 'https://botpress-dev-bins.s3.amazonaws.com/'

export const readMetadataFile = async (appData: string): Promise<MetadataFile | undefined> => {
  const metadataFile = path.resolve(appData, 'tools', 'metadata.json')

  if (await fse.pathExists(metadataFile)) {
    return fse.readJSON(metadataFile)
  }
}

export const saveMetadataFile = async (metadata: MetadataFile, appData: string) => {
  const metadataFile = path.resolve(appData, 'tools', 'metadata.json')
  await fse.writeJSON(metadataFile, metadata, { spaces: 2 })
}

export const addFileToMetadata = async (releaseInfo: ProcessedRelease, appData: string) => {
  const metadata = (await readMetadataFile(appData)) || {}

  const newContent = { ...metadata, [releaseInfo.fileName]: { ...releaseInfo, installDate: new Date() } }
  await saveMetadataFile(newContent, appData)
}

export const sanitizeBranch = (branch: string) => branch.replace(/[\W_]+/g, '_')

export const getBinaries = async (toolName: string, platform: string, version?: string) => {
  const releases = await getReleasedFiles(toolName, platform)
  const devBins = version ? await getDevBins(toolName, platform, version) : []

  return [...releases, ...devBins]
}

export const getDevBins = async (toolName: string, platform: string, branch: string): Promise<ProcessedRelease[]> => {
  const prefix = `${toolName}/${sanitizeBranch(branch)}/`
  const platformMatch = new RegExp(`.*-(${platform.replace('win32', 'win')})-x64`)

  try {
    const { data } = await axios.get(`${DEV_BIN_URL}?prefix=${prefix}`)
    const parser = new xml2js.Parser()
    const result = await Promise.fromCallback<S3Response>(cb => parser.parseString(data, cb))
    const files = result.ListBucketResult.Contents || []

    return files
      .map(file => {
        const fileName = file.Key[0].replace(prefix, '')
        const [_type, branch, _platform] = fileName.split('-')

        return {
          fileId: file.ETag[0]?.replace('"', ''),
          version: branch,
          fileName,
          fileSize: Number(file.Size[0]),
          downloadUrl: `${DEV_BIN_URL}${file.Key}`
        }
      })
      .filter(x => platformMatch.test(x.fileName))
  } catch (err) {
    logger.error(err)
    return []
  }
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
