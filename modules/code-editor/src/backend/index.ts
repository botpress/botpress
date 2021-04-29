import * as sdk from 'botpress/sdk'

import { Config } from '../config'
import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

import api from './api'
import Editor from './editor'

const onServerReady = async (bp: typeof sdk) => {
  const config = (await bp.config.getModuleConfig('code-editor')) as Config
  await api(bp, new Editor(bp, config))
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('code-editor')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onModuleUnmount,
  translations: { en, fr, es },
  definition: {
    name: 'code-editor',
    menuIcon: 'code',
    menuText: 'Code Editor',
    noInterface: false,
    fullName: 'Code Editor',
    homepage: 'https://botpress.com',
    workspaceApp: { global: true }
  }
}

export default entryPoint
