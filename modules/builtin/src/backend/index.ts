import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

const botTemplates: sdk.BotTemplate[] = [
  { id: 'welcome-bot', name: 'Welcome Bot', desc: `Basic bot that showcases some of the bot's functionality` },
  { id: 'small-talk', name: 'Small Talk', desc: `Includes basic smalltalk examples` },
  { id: 'empty-bot', name: 'Empty Bot', desc: `Start fresh with a clean flow` }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  botTemplates,
  definition: {
    name: 'builtin',
    menuIcon: 'fiber_smart_record',
    fullName: 'Botpress Builtins',
    homepage: 'https://botpress.io',
    noInterface: true
  }
}

export default entryPoint
