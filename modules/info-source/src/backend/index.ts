import * as sdk from 'botpress/sdk'

async function onBotMount(bp: typeof sdk, botId: string) {}
async function onBotUnmount(bp: typeof sdk, botId: string) {}

async function onServerStarted(bp: typeof sdk) {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'info-source',
    fullName: 'MSSS Info Covid-19',
    noInterface: true, // This prevents your module from being displayed in the menu, since we only add custom components here
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
