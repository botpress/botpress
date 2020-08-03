import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { getOnBotMount } from '../module_lifecycle/on_bot_mount'
import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import { VisuState } from './typings'

const state = {}

const onServerStarted = async (bp_sdk: typeof sdk) => {
  bp_sdk.logger.warn(
    'You are using Botpress New QNA module which is meant to be tested and released only by the botpress team'
  )
}

const onServerReady = async (bp_sdk: typeof sdk) => {
  await api(bp_sdk, state)
}

const onBotMount = getOnBotMount(state)

const onModuleUnmount = async (bp_sdk: typeof sdk) => {
  bp_sdk.events.removeMiddleware('visualisation.incoming')
  bp_sdk.http.deleteRouterForBot('visualisation')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: 'visualisation',
    menuIcon: 'assessment',
    menuText: 'Visualisation',
    fullName: 'Visualisation',
    homepage: 'https://botpress.com',
    experimental: true
  }
}
export default entryPoint
// TODO Get the sentence for the confusion matrix
