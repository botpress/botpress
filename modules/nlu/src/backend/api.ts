import * as sdk from 'botpress/sdk'

import ScopedEngine from './engine'
import { EngineByBot } from './typings'

export default async (bp: typeof sdk, nlus: EngineByBot) => {
  const router = bp.http.createRouterForBot('nlu')

  router.get('/intents', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntent(req.params.intent))
  })

  router.delete('/intents/:intent', async (req, res) => {
    await (nlus[req.params.botId] as ScopedEngine).storage.deleteIntent(req.params.intent)
    res.sendStatus(204)
  })

  router.post('/intents/:intent', async (req, res) => {
    await (nlus[req.params.botId] as ScopedEngine).storage.saveIntent(req.params.intent, req.body)
    res.sendStatus(201)
  })

  router.get('/entities', async (req, res) => {
    res.send([]) // TODO: Add built-in entity extractions here
  })

  router.get('/sync/check', async (req, res) => {
    res.send(await nlus[req.params.botId].checkSyncNeeded())
  })

  router.get('/sync', async (req, res) => {
    try {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', { text: 'NLU Sync In Progress', type: 'info', time: 120000 })
      )

      await nlus[req.params.botId].sync()
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
      const result = await nlus[req.params.botId].extract(eventText)
      res.send(result)
    } catch (err) {
      res.status(500).send(`Error extracting NLU data from event: ${err}`)
    }
  })
}
