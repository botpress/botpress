import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

import { setupRouter } from './api'
import { GoogleSpeechClient, setupMiddleware } from './client'

const MODULE_NAME = 'google-speech'

const onServerReady = async (bp: typeof sdk) => {
  const config = (await bp.config.getModuleConfig(MODULE_NAME)) as Config

  const client = new GoogleSpeechClient(config)
  await client.initialize()

  await setupMiddleware(bp, client)
  await setupRouter(bp, client, MODULE_NAME)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  definition: {
    name: 'google-speech',
    menuIcon: 'none',
    fullName: 'GoogleSpeech',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    experimental: true
  }
}

export default entryPoint
