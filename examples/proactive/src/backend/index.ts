import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'proactive-module',
    menuIcon: 'none',
    menuText: 'ProactiveModule',
    noInterface: true,
    fullName: 'ProactiveModule',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
