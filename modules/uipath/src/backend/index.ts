import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('uipath', {
    checkAuthentication: false
  })

  router.post('/message', async (req, res) => {
    try {
      const body = req.body

      await bp.events.replyToEvent(
        {
          channel: body.channel,
          target: body.target,
          botId: body.botId,
          threadId: body.threadId
        },
        [body.message]
      )

      res.sendStatus(200)
    } catch (err) {
      res.status(400).send(err)
    }
  })
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
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
