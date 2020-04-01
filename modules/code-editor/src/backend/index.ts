import * as sdk from 'botpress/sdk'

import { Config } from '../config'
import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import Editor from './editor'

const onServerReady = async (bp: typeof sdk) => {
  const config = (await bp.config.getModuleConfig('code-editor')) as Config
  await api(bp, new Editor(bp, config))
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  translations: { en, fr },
  definition: {
    name: 'code-editor',
    menuIcon: 'code',
    menuText: 'Code Editor',
    noInterface: false,
    fullName: 'Code Editor',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
