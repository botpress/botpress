import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import yn from 'yn'

import { E2ByBot } from './engine2/engine2'
import { getOnBotMount } from './module-lifecycle/on-bot-mount'
import { getOnBotUnmount } from './module-lifecycle/on-bot-unmount'
import { getOnServerReady } from './module-lifecycle/on-server-ready'
import { getOnSeverStarted } from './module-lifecycle/on-server-started'
import { EngineByBot, LanguageProvider, NLUHealth } from './typings'

const USE_E1 = yn(process.env.USE_LEGACY_NLU)

// TODO group the "by bot" stuff
export interface NLUState {
  nluByBot: EngineByBot // deprecated
  e2ByBot: E2ByBot
  watchersByBot: _.Dictionary<sdk.ListenHandle>
  trainIntervalByBot: _.Dictionary<NodeJS.Timer>
  languageProvider?: LanguageProvider
  health?: NLUHealth
  broadcastLoadModel?: Function
}

const state: NLUState = {
  nluByBot: {},
  e2ByBot: {},
  trainIntervalByBot: {},
  watchersByBot: {}
}

// 2- bring back "nlu-fixes"

const onServerStarted = getOnSeverStarted(state)
const onServerReady = getOnServerReady(state)
const onBotMount = getOnBotMount(state)
const onBotUnmount = getOnBotUnmount(state)
const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('nlu.incoming')
  bp.http.deleteRouterForBot('nlu')
  // if module gets deactivated but server keeps running, we want to destroy bot state
  if (!USE_E1) {
    Object.keys(state.e2ByBot).forEach(botID => () => onBotUnmount(bp, botID))
  }
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'nlu',
    moduleView: {
      stretched: true
    },
    menuIcon: 'translate',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
