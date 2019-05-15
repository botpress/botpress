import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import api from './api'
import Editor from './editor'
import { EditorByBot } from './typings'

const editorByBot: EditorByBot = {}

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {
  await api(bp, editorByBot)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfig('code-editor')) as Config
  editorByBot[botId] = new Editor(bp, botId, config)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete editorByBot[botId]
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'code-editor',
    menuIcon: 'code',
    menuText: 'Code Editor',
    noInterface: false,
    fullName: 'Code Editor',
    homepage: 'https://botpress.io',
    experimental: true
  }
}

export default entryPoint
