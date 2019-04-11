import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import ms from 'ms'

import ConfusionEngine from './confusion-engine'
import ScopedEngine from './engine'
import { EngineByBot } from './typings'
import { EntityDefCreateSchema, IntentDefCreateSchema } from './validation'
import _ from 'lodash'

const SYNC_INTERVAL_MS = ms('15s')

export default async (bp: typeof sdk, nlus: EngineByBot) => {
  const router = bp.http.createRouterForBot('nlu')

  const syncByBots: { [key: string]: NodeJS.Timer } = {}

  const scheduleSyncNLU = (botId: string) => {
    if (syncByBots[botId]) {
      clearTimeout(syncByBots[botId])
      delete syncByBots[botId]
    }

    syncByBots[botId] = setTimeout(() => {
      delete syncByBots[botId]
      const botEngine = nlus[botId] as ScopedEngine
      syncNLU(botEngine, false)
    }, SYNC_INTERVAL_MS)
  }

  const syncNLU = async (botEngine: ScopedEngine, confusionMode: boolean = false): Promise<string> => {
    const startTraining = { type: 'nlu', name: 'train', working: true, message: 'Training model' }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', startTraining))

    if (confusionMode && botEngine instanceof ConfusionEngine) {
      botEngine.computeConfusionOnTrain = true
    }

    try {
      return await botEngine.sync(confusionMode)
    } catch (e) {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', {
          text: `NLU Sync Error: ${e.name} : ${e.message}`,
          type: 'error'
        })
      )
    } finally {
      if (confusionMode && botEngine instanceof ConfusionEngine) {
        botEngine.computeConfusionOnTrain = false
      }
      const trainingComplete = { type: 'nlu', name: 'done', working: false, message: 'Model is up-to-date' }
      bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', trainingComplete))
    }
  }

  router.get('/confusion/:modelHash', async (req, res) => {
    try {
      const matrix = await (nlus[req.params.botId] as ScopedEngine).storage.getConfusionMatrix(req.params.modelHash)
      res.send(matrix)
    } catch (err) {
      res.sendStatus(401)
    }
  })

  router.post('/confusion', async (req, res) => {
    try {
      const botEngine = nlus[req.params.botId] as ScopedEngine
      const modelHash = await syncNLU(botEngine, true)
      res.send({ modelHash })
    } catch (err) {
      res.status(400).send('Could not train confusion matrix')
    }
  })

  router.get('/intents', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntent(req.params.intent))
  })

  router.delete('/intents/:intent', async (req, res) => {
    const botEngine = nlus[req.params.botId] as ScopedEngine

    await botEngine.storage.deleteIntent(req.params.intent)
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(204)
  })

  router.post('/intents', async (req, res) => {
    try {
      const intentDef = await validate(req.body, IntentDefCreateSchema, {
        stripUnknown: true
      })

      const botEngine = nlus[req.params.botId] as ScopedEngine
      await botEngine.storage.saveIntent(intentDef.name, intentDef)
      scheduleSyncNLU(req.params.botId)

      res.sendStatus(201)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create intent, invalid schema')
      res.status(400).send('Invalid schema')
    }
  })

  router.get('/contexts', async (req, res) => {
    const botId = req.params.botId
    const filepaths = await bp.ghost.forBot(botId).directoryListing('/intents', '*.json')
    const contextsArray = await Promise.map(filepaths, async filepath => {
      const file = await bp.ghost.forBot(botId).readFileAsObject('/intents', filepath)
      return file['contexts']
    })

    // Contexts is an array of arrays that can contain duplicate values
    res.send(_.uniq(_.flatten(contextsArray)))
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
      scheduleSyncNLU(req.params.botId)

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
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(201)
  })

  router.delete('/entities/:id', async (req, res) => {
    const { botId, id } = req.params
    const botEngine = nlus[botId] as ScopedEngine
    await botEngine.storage.deleteEntity(id)
    scheduleSyncNLU(req.params.botId)

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
      const result = await nlus[req.params.botId].extract(eventText.preview)
      res.send(result)
    } catch (err) {
      res.status(500).send(`Error extracting NLU data from event: ${err}`)
    }
  })
}
