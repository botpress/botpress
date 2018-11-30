import * as sdk from 'botpress/sdk'

export type Extension = {}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => {}

const onServerReady = async (bp: SDK) => {}

const botTemplates: sdk.BotTemplate[] = [
  { id: 'welcome-bot', name: 'Welcome Bot', desc: `Basic bot that showcases some of the bot's functionality` },
  { id: 'small-talk', name: 'Small Talk', desc: `Includes basic smalltalk examples` }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  botTemplates,
  definition: {
    name: 'base',
    menuIcon: 'fiber_smart_record',
    fullName: 'Botpress Base',
    homepage: 'https://botpress.io',
    noInterface: true
  }
}

export default entryPoint
