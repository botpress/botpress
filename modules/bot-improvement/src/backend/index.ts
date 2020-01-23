import * as sdk from 'botpress/sdk'

import api from './api'

export type SDK = typeof sdk

const onServerStarted = async (bp: SDK) => {}

const onServerReady = async (bp: SDK) => {
  await api(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'bot-improvement',
    menuIcon: 'thumbs_up_down',
    menuText: 'Bot Improvement',
    noInterface: false,
    fullName: 'Bot Improvement',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
