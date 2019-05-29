import 'bluebird-global'
import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  definition: {
    name: 'token-action',
    fullName: 'token-action',
    homepage: 'https://botpress.io',
    menuIcon: 'none',
    noInterface: true
  }
}

export default entryPoint
