import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {
  const events = []
  const router = bp.http.createRouterForBot('extensions')
  router.post('/saveIncoming', (req, res) => {
    events.push(req.body)
    res.sendStatus(200)
  })

  router.get('/events/:eventId', (req, res) => {
    res.send(events.find(x => x.id === req.params.eventId))
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
