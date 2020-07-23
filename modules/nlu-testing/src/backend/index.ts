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
    id: 'bp-nlu-buisness-synonyms-testing',
    name: 'BPDS - NLU synonyms testing',
    desc: 'BP Dataset with acronyms not seen at training time (e.g Can I talk to the CEO => manager)'
  },
  {
    id: 'bp-nlu-entities-encoding',
    name: 'BPDS - NLU entities encoding ',
    desc: 'BP Dataset with really closed intents that differs almost only from their slots.'
  },
  {
    id: 'bp-nlu-intents-testing',
    name: 'BPDS - NLU intents testing',
    desc: 'BP Dataset with 150 intents'
  },
  {
    id: 'bp-nlu-oos-testing',
    name: 'BPDS - NLU intents testing',
    desc: 'BP Dataset with 150 intents plus out of scope sentences'
  },
  {
    id: 'bp-nlu-regression-testing',
    name: 'BPDS - NLU regression testing ',
    desc:
      'BPDS are handcrafted datasets. Intents in each contexts are built with a specific distribution in mind, making intent classification hard to achieve.'
  },
  {
    id: 'bp-nlu-synonyms-testing',
    name: 'BPDS - NLU intents testing',
    desc:
      'BP Dataset training sentences replaced with wordNet synonyms (e.g I would treat you with love => I should manage you with passion)'
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
