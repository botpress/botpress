import { SDK } from '.'
import ScopedNlu from './scopednlu'

export default async (bp: SDK, botScopedNlu: Map<string, ScopedNlu>) => {
  const router = bp.http.createRouterForBot('nlu')

  router.get('/intents', async (req, res) => {
    res.send(await botScopedNlu.get(req.params.botId).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await botScopedNlu.get(req.params.botId).storage.getIntent(req.params.intent))
  })

  router.delete('/intents/:intent', async (req, res) => {
    await botScopedNlu.get(req.params.botId).storage.deleteIntent(req.params.intent)
    res.sendStatus(200)
  })

  router.post('/intents/:intent', async (req, res) => {
    await botScopedNlu.get(req.params.botId).storage.saveIntent(req.params.intent, req.body)
    res.sendStatus(200)
  })

  router.get('/entities', async (req, res) => {
    res.send((await botScopedNlu.get(req.params.botId).provider.getAvailableEntities()).map(x => x.name))
  })

  router.get('/sync/check', async (req, res) => {
    res.send(await botScopedNlu.get(req.params.botId).provider.checkSyncNeeded())
  })

  router.get('/sync', async (req, res) => {
    try {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', { text: 'NLU Sync In Progress', type: 'info', time: 120000 })
      )

      await botScopedNlu.get(req.params.botId).provider.sync()
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

  router.post('/extract', async (req, res) => {
    const eventText = {
      preview: req.body.text,
      payload: {
        text: req.body.text
      }
    }

    try {
      const result = await botScopedNlu.get(req.params.botId).provider.extract(eventText)
      res.send(result)
    } catch (err) {
      res.status(500).send(`Error extracting NLU data from event: ${err}`)
    }
  })
}
