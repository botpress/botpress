import sdk from 'botpress/sdk'
import fs from 'fs'
import path from 'path'

import api from './api'

export type SDK = typeof sdk

const onServerStarted = async (bp: SDK) => {}

const onServerReady = async (bp: SDK) => {
  await api(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  config: {},
  definition: {
    name: 'audience',
    menuIcon: 'people',
    menuText: 'Audience',
    fullName: 'Audience',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
