import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import api from './api'
import Editor from './editor'

const onServerReady = async (bp: typeof sdk) => {
  const config = (await bp.config.getModuleConfig('code-editor')) as Config
  await api(bp, new Editor(bp, config))
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  definition: {
    name: 'code-editor',
    menuIcon: 'code',
    menuText: 'Code Editor',
    noInterface: false,
    fullName: 'Code Editor',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
