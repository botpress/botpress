import * as sdk from 'botpress/sdk'

import ScopedEngine from './engine'
import { EngineByBot } from './typings'

export default async (bp: typeof sdk, nlus: EngineByBot) => {
  const router = bp.http.createRouterForBot('nlu')

  const syncNLU = async (botEngine: ScopedEngine): Promise<void> => {
    const startTraining = { type: 'nlu', name: 'train', working: true, message: 'Training model' }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', startTraining))
    try {
      await botEngine.sync()
    } catch (e) {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', {
          text: `NLU Sync Error: ${e.name} : ${e.message}`,
          type: 'error'
        })
      )
    }

    const trainingComplete = { type: 'nlu', name: 'done', working: false, message: 'Model is up-to-date' }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', trainingComplete))
  }

  router.get('/intents', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntent(req.params.intent))
  })

  router.delete('/intents/:intent', async (req, res) => {
    const botEngine = nlus[req.params.botId] as ScopedEngine

    await botEngine.storage.deleteIntent(req.params.intent)
    await syncNLU(botEngine)

    res.sendStatus(204)
  })

  router.post('/intents/:intent', async (req, res) => {
    const botEngine = nlus[req.params.botId] as ScopedEngine
    await botEngine.storage.saveIntent(req.params.intent, req.body)
    await syncNLU(botEngine)

    res.sendStatus(201)
  })

  router.get('/entities', async (req, res) => {
    const entities = await (nlus[req.params.botId] as ScopedEngine).storage.getAvailableEntities()
    res.json(entities)
  })

  router.post('/entities', async (req, res) => {
    const content = req.body
    const { botId } = req.params
    const entity = content as sdk.NLU.EntityDefinition

    const botEngine = nlus[botId] as ScopedEngine
    await botEngine.storage.saveEntity(entity)
    await syncNLU(botEngine)

    res.sendStatus(201)
  })

  router.put('/entities/:id', async (req, res) => {
    const content = req.body
    const { botId, id } = req.params
    const updatedEntity = content as sdk.NLU.EntityDefinition

    const botEngine = nlus[botId] as ScopedEngine
    await botEngine.storage.saveEntity({ ...updatedEntity, id })
    await syncNLU(botEngine)

    res.sendStatus(201)
  })

  router.delete('/entities/:id', async (req, res) => {
    const { botId, id } = req.params
    const botEngine = nlus[botId] as ScopedEngine
    await botEngine.storage.deleteEntity(id)
    await syncNLU(botEngine)

    res.sendStatus(204)
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
