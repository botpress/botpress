import * as sdk from 'botpress/sdk'

import Joi, { validate } from 'joi'
import _ from 'lodash'
import yn from 'yn'
import { EntityDefCreateSchema, IntentDefCreateSchema } from './definitions/validate'

import legacyElectionPipeline from './election/legacy-election'
import mergeSpellChecked from './election/spellcheck-handler'
import { getTrainingSession } from './train-session-service'
import { NLUState } from './typings'

export const PredictSchema = Joi.object().keys({
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global']),
  text: Joi.string().required()
})

const removeSlotsFromUtterances = (utterances: { [key: string]: any }, slotNames: string[]) =>
  _.fromPairs(
    Object.entries(utterances).map(([key, val]) => {
      const regex = new RegExp(`\\[([^\\[\\]\\(\\)]+?)\\]\\((${slotNames.join('|')})\\)`, 'gi')
      return [key, val.map(u => u.replace(regex, '$1'))]
    })
  )

export default async (bp: typeof sdk, state: NLUState) => {
  const router = bp.http.createRouterForBot('nlu')
  const needsWriteTrainingMW = bp.http.needPermission('write', 'bot.training')
  const needsReadContentMW = bp.http.needPermission('read', 'bot.content')
  const needsWriteContentMW = bp.http.needPermission('write', 'bot.content')

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it changed (eg: user added languages)
    const health = state.engine.getHealth()
    res.send(health)
  })

  // TODO remove this
  router.post('/cross-validation/:lang', async (req, res) => {
    // there used to be a cross validation tool but I got rid of it when extracting standalone nlu
    // the code is somewhere in the source control
    // to find it back, juste git blame this comment
    res.sendStatus(410)
  })

  router.get('/training/:language', async (req, res) => {
    const { language, botId } = req.params
    const session = await getTrainingSession(bp, botId, language)
    res.send(session)
  })

  router.post(['/predict', '/predict/:lang'], async (req, res) => {
    const { botId, lang } = req.params
    const { error, value } = PredictSchema.validate(req.body)
    if (error) {
      return res.status(400).send('Predict body is invalid')
    }

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    const predictLang = lang ?? botNLU.defaultLanguage
    const modelId = botNLU.modelsByLang[predictLang]

    try {
      let nlu: sdk.NLU.PredictOutput

      const spellChecked = await state.engine.spellCheck(value.text, modelId)

      const t0 = Date.now()
      if (spellChecked !== value.text) {
        const originalPrediction = await state.engine.predict(value.text, modelId)
        const spellCheckedPrediction = await state.engine.predict(spellChecked, modelId)
        nlu = mergeSpellChecked(originalPrediction, spellCheckedPrediction)
      } else {
        nlu = await state.engine.predict(value.text, modelId)
      }
      const ms = Date.now() - t0

      const event: sdk.IO.EventUnderstanding = {
        ...nlu,
        includedContexts: value.contexts,
        language: predictLang,
        detectedLanguage: undefined,
        errored: false,
        ms,
        spellChecked
      }
      res.send({ nlu: legacyElectionPipeline(event) })
    } catch (err) {
      res.status(500).send('Could not extract nlu data')
    }
  })

  router.post('/train/:lang', needsWriteTrainingMW, async (req, res) => {
    try {
      const { botId, lang } = req.params

      const botNLU = state.nluByBot[botId]
      if (!botNLU) {
        return res.status(404).send(`Bot ${botId} doesn't exist`)
      }
      if (!_.isString(lang) || !botNLU.languages.includes(lang)) {
        return res.status(422).send(`Language ${lang} is either not supported by bot or by language server`)
      }

      // Is it this even necessary anymore ?
      const disableTraining = yn(process.env.BP_NLU_DISABLE_TRAINING)

      // to return as fast as possible
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      state.nluByBot[botId].trainOrLoad(lang, disableTraining)
      res.sendStatus(200)
    } catch {
      res.sendStatus(500)
    }
  })

  router.post('/train/:lang/delete', needsWriteTrainingMW, async (req, res) => {
    try {
      const { botId, lang } = req.params

      const botNLU = state.nluByBot[botId]
      if (!botNLU) {
        return res.status(404).send(`Bot ${botId} doesn't exist`)
      }
      if (!_.isString(lang) || !botNLU.languages.includes(lang)) {
        return res.status(422).send(`Language ${lang} is either not supported by bot or by language server`)
      }

      await state.nluByBot[botId].cancelTraining(lang)
      res.sendStatus(200)
    } catch {
      res.sendStatus(500)
    }
  })

  router.get('/intents', needsReadContentMW, async (req, res) => {
    const { botId } = req.params
    const intentDefs = await state.intentsRepo.getIntents(botId)
    res.send(intentDefs)
  })

  router.get('/intents/:intent', needsReadContentMW, async (req, res) => {
    const { botId, intent } = req.params
    const intentDef = await state.intentsRepo.getIntent(botId, intent)
    res.send(intentDef)
  })

  router.post('/intents/:intent/delete', needsWriteContentMW, async (req, res) => {
    const { botId, intent } = req.params
    try {
      await state.intentsRepo.deleteIntent(botId, intent)
      res.sendStatus(204)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not delete intent')
      res.status(400).send(err.message)
    }
  })

  router.post('/intents', needsWriteContentMW, async (req, res) => {
    const { botId } = req.params
    try {
      const intentDef = await validate(req.body, IntentDefCreateSchema, {
        stripUnknown: true
      })

      await state.intentsRepo.saveIntent(botId, intentDef)

      res.sendStatus(200)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .warn('Cannot create intent')
      res.status(400).send(err.message)
    }
  })

  router.post('/intents/:intentName', needsWriteContentMW, async (req, res) => {
    const { botId, intentName } = req.params
    try {
      await state.intentsRepo.updateIntent(botId, intentName, req.body)
      res.sendStatus(200)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not update intent')
      res.sendStatus(400)
    }
  })

  router.post('/condition/intentChanged', needsWriteContentMW, async (req, res) => {
    const { botId } = req.params
    const { action } = req.body
    const condition = req.body.condition as sdk.DecisionTriggerCondition

    if (action === 'delete' || action === 'create') {
      try {
        await state.intentsRepo.updateContextsFromTopics(botId, [condition!.params!.intentName])
        return res.sendStatus(200)
      } catch (err) {
        return res.status(400).send(err.message)
      }
    }

    res.sendStatus(200)
  })

  router.post('/sync/intents/topics', needsWriteContentMW, async (req, res) => {
    const { botId } = req.params
    const { intentNames } = req.body

    try {
      await state.intentsRepo.updateContextsFromTopics(botId, intentNames)
      res.sendStatus(200)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not update intent topics')
      res.status(400).send(err.message)
    }
  })

  router.get('/contexts', needsReadContentMW, async (req, res) => {
    const botId = req.params.botId
    const intents = await state.intentsRepo.getIntents(botId)
    const ctxs = _.chain(intents)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    res.send(ctxs)
  })

  router.get('/entities', needsReadContentMW, async (req, res) => {
    const { botId } = req.params
    const { ignoreSystem } = req.query

    const entities = await state.entitiesRepo.getEntities(botId)
    const mapped = entities.map(x => ({ ...x, label: `${x.type}.${x.name}` }))

    res.json(yn(ignoreSystem) ? mapped.filter(x => x.type !== 'system') : mapped)
  })

  router.get('/entities/:entityName', needsReadContentMW, async (req, res) => {
    const { botId, entityName } = req.params
    try {
      const entity = await state.entitiesRepo.getEntity(botId, entityName)
      res.send(entity)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .error(`Could not get entity ${entityName}`)
      res.send(400)
    }
  })

  router.post('/entities', needsWriteContentMW, async (req, res) => {
    const { botId } = req.params
    try {
      const entityDef = (await validate(req.body, EntityDefCreateSchema, {
        stripUnknown: true
      })) as sdk.NLU.EntityDefinition

      await state.entitiesRepo.saveEntity(botId, entityDef)

      res.sendStatus(200)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .warn('Cannot create entity')
      res.status(400).send(err.message)
    }
  })

  router.post('/entities/:id', needsWriteContentMW, async (req, res) => {
    const { botId, id } = req.params
    try {
      const entityDef = (await validate(req.body, EntityDefCreateSchema, {
        stripUnknown: true
      })) as sdk.NLU.EntityDefinition

      await state.entitiesRepo.updateEntity(botId, id, entityDef)
      res.sendStatus(200)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not update entity')
      res.status(400).send(err.message)
    }
  })

  router.post('/entities/:id/delete', needsWriteContentMW, async (req, res) => {
    const { botId, id } = req.params
    try {
      await state.entitiesRepo.deleteEntity(botId, id)

      const affectedIntents = (await state.intentsRepo.getIntents(botId)).filter(intent =>
        intent.slots.some(slot => slot.entities.includes(id))
      )

      await Promise.map(affectedIntents, intent => {
        const [affectedSlots, unaffectedSlots] = _.partition(intent.slots, slot => slot.entities.includes(id))
        const [slotsToDelete, slotsToKeep] = _.partition(affectedSlots, slot => slot.entities.length === 1)
        const updatedIntent = {
          ...intent,
          slots: [
            ...unaffectedSlots,
            ...slotsToKeep.map(slot => ({ ...slot, entities: _.without(slot.entities, id) }))
          ],
          utterances: removeSlotsFromUtterances(
            intent.utterances,
            slotsToDelete.map(slot => slot.name)
          )
        }
        return state.intentsRepo.saveIntent(botId, updatedIntent)
      })

      res.sendStatus(204)
    } catch (err) {
      bp.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not delete entity')
      res.status(404).send(err.message)
    }
  })
}
