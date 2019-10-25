import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import yn from 'yn'

import api from './api'
import { E2ByBot } from './engine2/engine2'
import { registerOnBotMount as getOnBotMount } from './module-lifecycle/on-bot-mount'
import { registerOnServerStarted as getOnSeverStarted } from './module-lifecycle/on-server-started'
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
}

const state: NLUState = {
  nluByBot: {},
  e2ByBot: {},
  trainIntervalByBot: {},
  watchersByBot: {}
}

// let distributedLoadModel: Function

// const loadModel = async (botId: string, hash: string, language: string) => {
//   const ghost = bp.ghost.forBot(botId)
//   const model = await getModel(ghost, hash, language)
//   if (model) {
//     await e2ByBot[botId].loadModel(model)
//   }
// }

// distributedLoadModel = await bp.distributed.broadcast(loadModel)
// await api(bp, nluByBot)
// }

// await Promise.mapSeries(languages, async languageCode => {
//   const model = await getModel(ghost, hash, languageCode)
//   if (model) {
//     await e2.loadModel(model)
//   } else {
//     const trainLock = await bp.distributed.acquireLock(`train:${botId}:${languageCode}`, ms('5m'))
//     if (!trainLock) {
//       return
//     }
//     const input: TrainInput = {
//       languageCode,
//       list_entities,
//       pattern_entities,
//       contexts,
//       intents: intents.map(x => ({
//         name: x.name,
//         contexts: x.contexts,
//         utterances: x.utterances[languageCode],
//         slot_definitions: x.slots
//       }))
//     }
//     const model = await e2.train(input)
//     await trainLock.unlock()
//     if (model.success) {
//       await saveModel(ghost, model, hash)
//       await distributedLoadModel(botId, hash, languageCode)
//     }
//   }
// })

const onServerStarted = getOnSeverStarted(state)

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, state)
}

const onBotMount = getOnBotMount(state)

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete state.nluByBot[botId]
  if (USE_E1) {
    return
  }
  //  TODOD use state instead
  // delete e2ByBot[botId]
  // watchersByBot[botId].remove()
  // delete watchersByBot[botId]
}

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
