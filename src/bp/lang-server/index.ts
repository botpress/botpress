import _ from 'lodash'
import path from 'path'

// tslint:disable-next-line:ordered-imports
import rewire from '../sdk/rewire'
// tslint:disable-next-line:ordered-imports
global.rewire = rewire as any

import API from './api'
import LanguageService from './service'
import DownloadManager from './service/download-manager'

export type Argv = {
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

export default async function(argv: Argv) {
  argv.langDir = argv.langDir || path.join(process.APP_DATA_PATH, 'embeddings')

  console.log('Language Server', argv)

  const service = new LanguageService(argv.dim, argv.domain, argv.langDir)
  const dlManager = new DownloadManager(argv.dim, argv.domain, argv.langDir, argv.metadataLocation)

  await API({
    host: argv.host,
    port: argv.port,
    authToken: argv.authToken,
    limit: argv.limit,
    limitWindow: argv.limitWindow,
    readOnly: argv.readOnly,
    service: service
  })

  await dlManager.init()
  await service.initialize()
}
