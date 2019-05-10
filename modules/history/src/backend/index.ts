import 'bluebird-global'
import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {
  console.log('on server started')

  bp.database.createTableIfNotExists('msg_history', table => {
    table.increments('id').primary()
    table.string('msg')
  })
}

const onServerReady = async (bp: typeof sdk) => {
  let allBots: Map<string, sdk.BotConfig>
  await bp.bots.getAllBots().then(v => {
    allBots = v
  })
  const keys: string[] = [...allBots.keys()]
  console.log(`on server ready was called with bots ${keys}`)

  const router = bp.http.createRouterForBot('history')

  router.get('/msg', async (req, res) => {
    const messages = await bp.database.select('*').table('msg_history')
    res.send(messages)
  })

  console.log('router instanciated')
}

const onBotMount = async (bp: typeof sdk) => {
  console.log('on bot mounted')
}

const onBotUnmount = async (bp: typeof sdk) => {
  console.log('on server unmounted')
}

const onModuleUnmount = async (bp: typeof sdk) => {
  console.log('on module unmount')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'history',
    fullName: 'History',
    homepage: 'https://botpress.io',
    menuIcon: 'timeline'
  }
}

export default entryPoint
