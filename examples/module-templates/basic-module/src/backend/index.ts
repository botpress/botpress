import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'basic-module',
    menuIcon: 'dot',
    menuText: 'BasicExample',
    noInterface: false,
    fullName: 'BasicExample',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
