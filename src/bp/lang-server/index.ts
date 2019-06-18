import _ from 'lodash'
import path from 'path'

// tslint:disable-next-line:ordered-imports
import rewire from '../sdk/rewire'
// tslint:disable-next-line:ordered-imports
global.rewire = rewire as any

import API from './api'
import LanguageService from './service'
import DownloadManager from './service/download-manager'

export interface ArgV {
  port: number
  host: string
  limit: number
  limitWindow: string
  langDir?: string
  authToken?: string
  readOnly: boolean
  metadataLocation: string
  dim: number
  domain: string
}

export default async function(options: ArgV) {
  options.langDir = options.langDir || path.join(process.APP_DATA_PATH, 'embeddings')

  console.log('Language Server', options)

  const langService = new LanguageService(options.dim, options.domain, options.langDir)
  const downloadManager = new DownloadManager(options.dim, options.domain, options.langDir, options.metadataLocation)

  const apiOptions = {
    host: options.host,
    port: options.port,
    authToken: options.authToken,
    limit: options.limit,
    limitWindow: options.limitWindow,
    readOnly: options.readOnly
  }

  await Promise.all([
    API(apiOptions, langService, downloadManager),
    downloadManager.initialize(),
    langService.initialize()
  ])
}
