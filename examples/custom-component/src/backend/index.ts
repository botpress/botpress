import * as sdk from 'botpress/sdk'

// These are required even if they aren't used
const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {}

// This is not required for the custom component, but it makes it easier to test this example
const botTemplates: sdk.BotTemplate[] = [
  {
    id: 'custom-component-demo',
    name: 'Demo - Custom Components',
    desc: `This module shows how to implement custom components on channel web`
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  botTemplates,
  definition: {
    name: 'custom-component',
    menuIcon: 'none',
    menuText: 'Custom Component',
    fullName: 'My Custom Component',
    noInterface: true, // This prevents your module from being displayed in the menu, since we only add custom components here
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
