import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import api from './api'

export type SDK = typeof sdk

const onServerStarted = async (bp: SDK) => {
  bp.logger.warn(
    'You are using Botpress NLU Regression Testing module which meant to be used only by the botpress team.'
  )
}

const onServerReady = async (bp: SDK) => {
  await api(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('nlu-testing')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  definition: {
    name: 'nlu-testing',
    menuIcon: 'done_outline',
    menuText: 'NLU Testing',
    fullName: 'NLU Regression Testing',
    homepage: 'https://botpress.io',
    experimental: true
  }
}

export default entryPoint
