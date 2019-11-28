import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'uipath',
    menuIcon: 'none',
    menuText: 'UiPath',
    noInterface: true,
    fullName: 'UiPath',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
