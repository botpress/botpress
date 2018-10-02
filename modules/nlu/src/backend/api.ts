import { SDK } from '.'

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('nlu')

  router.delete('/intents/:intent', async (req, res) => {
    await bp.nlu.forBot(req.params.botId).storage.deleteIntent(req.params.intent)
    res.sendStatus(200)
  })

  router.post('/intents/:intent', async (req, res) => {
    await bp.nlu.forBot(req.params.botId).storage.saveIntent(req.params.intent, req.body)
    res.sendStatus(200)
  })

  router.get('/intents', async (req, res) => {
    res.send(await bp.nlu.forBot(req.params.botId).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await bp.nlu.forBot(req.params.botId).storage.getIntent(req.params.intent))
  })

  router.get('/entities', async (req, res) => {
    res.send((await bp.nlu.forBot(req.params.botId).provider.getAvailableEntities()).map(x => x.name))
  })

  router.get('/sync/check', async (req, res) => {
    res.send(await bp.nlu.forBot(req.params.botId).provider.checkSyncNeeded())
  })

  router.get('/sync', async (req, res) => {
    try {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', { text: 'NLU Sync In Progress', type: 'info', time: 120000 })
      )

      await bp.nlu.forBot(req.params.botId).provider.sync()
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', { text: 'NLU Sync Success', type: 'success' })
      )

      res.sendStatus(200)
    } catch (e) {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', {
          text: `NLU Sync Error: ${e.name} : ${e.message}`,
          type: 'error'
        })
      )
      res.status(500).send(`${e.name} : ${e.message}`)
    }
  })
}
