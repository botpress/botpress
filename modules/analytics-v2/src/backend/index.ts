import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'analytics-v2',
    menuIcon: 'timeline',
    menuText: 'Analytics',
    noInterface: false,
    fullName: 'Analytics',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
