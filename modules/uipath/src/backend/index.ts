import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('uipath', {
    checkAuthentication: false
  })

  router.post('/message', async (req, res) => {
    try {
      const { channel, target, botId, threadId, message } = req.body

      await bp.events.replyToEvent(
        {
          channel,
          target,
          botId,
          threadId
        },
        [message]
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
