import * as sdk from 'botpress/sdk'

const botTemplates: sdk.BotTemplate[] = [
  { id: 'proactive-bot', name: 'Proactive Bot', desc: `An bot used to show proactive examples` }
]

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  botTemplates,
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
