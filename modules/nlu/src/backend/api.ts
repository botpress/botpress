import * as sdk from 'botpress/sdk'
import { validate } from 'joi'

import ScopedEngine from './engine'
import { EngineByBot } from './typings'
import { EntityDefCreateSchema, IntentDefCreateSchema } from './validation'

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

  router.post('/intents', async (req, res) => {
    try {
      const intentDef = await validate(req.body, IntentDefCreateSchema, {
        stripUnknown: true
      })

      const botEngine = nlus[req.params.botId] as ScopedEngine
      await botEngine.storage.saveIntent(intentDef.name, intentDef)
      await syncNLU(botEngine)

      res.sendStatus(201)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create intent, invalid schema')
      res.status(400).send('Invalid schema')
    }
  })

  router.get('/entities', async (req, res) => {
    const entities = await (nlus[req.params.botId] as ScopedEngine).storage.getAvailableEntities()
    res.json(entities)
  })

  router.post('/entities', async (req, res) => {
    const { botId } = req.params
    try {
      const entityDef = (await validate(req.body, EntityDefCreateSchema, {
        stripUnknown: true
      })) as sdk.NLU.EntityDefinition

      const botEngine = nlus[botId] as ScopedEngine
      await botEngine.storage.saveEntity(entityDef)
      await syncNLU(botEngine)

      res.sendStatus(201)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create entity, imvalid schema')
      res.status(400).send('Invalid schema')
    }
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
