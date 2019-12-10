import * as sdk from 'botpress/sdk'

import api from './api'

const onServerStarted = async (bp: typeof sdk) => {
  await api(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  definition: {
    name: 'uipath',
    menuIcon: 'none',
    menuText: 'UiPath',
    noInterface: true,
    fullName: 'UiPath',
    homepage: 'https://botpress.io',
    experimental: true
  }
}

export default entryPoint
