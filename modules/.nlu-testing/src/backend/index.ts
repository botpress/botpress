import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'

export type SDK = typeof sdk

const onServerStarted = async (bp: SDK) => {
  bp.logger.warn(
    'You are using Botpress NLU Regression Testing module which is meant to be used only by the Botpress team.'
  )
}

const onServerReady = async (bp: SDK) => {
  await api(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('nlu-testing')
}

const botTemplates: sdk.BotTemplate[] = [
  {
    id: 'bp-nlu-regression-testing',
    name: 'BPDS - NLU regression testing ',
    desc:
      'BPDS are handcrafted datasets. Intents in each contexts are built with a specific distribution in mind, making intent classification hard to achieve.'
  },
  {
    id: 'bp-nlu-slot-extraction',
    name: 'BPDS - NLU slot extraction testing ',
    desc:
      'BPDS are handcrafted datasets. There is exactly one intent per context. Slots of each intents are built with a specific distribution in mind, making slot extraction hard to achieve.'
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  botTemplates,
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: 'nlu-testing',
    menuIcon: 'lab-test',
    menuText: 'NLU Testing',
    fullName: 'NLU Regression Testing',
    homepage: 'https://botpress.com',
    experimental: true
  }
}

export default entryPoint
