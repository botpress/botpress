import _ from 'lodash'

// tslint:disable-next-line:ordered-imports
import rewire from '../sdk/rewire'
// tslint:disable-next-line:ordered-imports
global.rewire = rewire as any

import API from './api'
import LanguageService from './service'

export type Argv = {
  port: number
  host: string
  limit: number
  limitWindow: string
  langDir?: string
  authToken?: string
}

export default async function(argv: Argv) {
  const service = new LanguageService(argv.langDir)

  await API({
    host: argv.host,
    port: argv.port,
    authToken: argv.authToken,
    limit: argv.limit,
    limitWindow: argv.limitWindow,
    service: service
  })

  await service.initialize()
}
