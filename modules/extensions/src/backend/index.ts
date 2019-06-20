import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('extensions')
  const config = (await bp.config.getBotpressConfig()).eventCollector

  router.get('/events/update-frequency', async (_req, res) => {
    res.send({ collectionInterval: config.collectionInterval })
  })

  router.get('/events/:eventId', async (req, res) => {
    const storedEvents = await bp.events.findEvents({
      incomingEventId: req.params.eventId,
      direction: 'incoming',
      botId: req.params.botId
    })
    if (storedEvents.length) {
      return res.send(storedEvents.map(s => s.event)[0])
    }

    res.sendStatus(404)
  })
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'extensions',
    menuIcon: 'none',
    menuText: 'Extensions',
    noInterface: true,
    fullName: 'Extensions',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
