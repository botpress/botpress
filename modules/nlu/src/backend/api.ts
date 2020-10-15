import * as sdk from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'

import { validateLegacyIntent } from './intents/legacy-validation'
import legacyElectionPipeline from './legacy-election'
import { getTrainingSession } from './train-session-service'
import { NLUState } from './typings'

export const PredictSchema = Joi.object().keys({
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global']),
  text: Joi.string().required()
})

export default async (bp: typeof sdk, state: NLUState) => {
  const router = bp.http.createRouterForBot('nlu')

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it changed (eg: user added languages)
    const health = bp.NLU.Engine.getHealth()
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

  router.post('/predict', async (req, res) => {
    const { botId } = req.params
    const { error, value } = PredictSchema.validate(req.body)
    if (error) {
      return res.status(400).send('Predict body is invalid')
    }

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    try {
      // TODO: language should be a path param of route
      let nlu = await botNLU.engine.predict(value.text, value.contexts, botNLU.defaultLanguage)
      nlu = legacyElectionPipeline(nlu)
      res.send({ nlu })
    } catch (err) {
      res.status(500).send('Could not extract nlu data')
    }
  })

  router.post('/train', async (req, res) => {
    try {
      const { botId } = req.params
      await state.nluByBot[botId].trainOrLoad(false)
      res.sendStatus(200)
    } catch {
      res.sendStatus(500)
    }
  })

  // TODO make this language based
  router.post('/train/delete', async (req, res) => {
    try {
      const { botId } = req.params
      await state.nluByBot[botId].cancelTraining()
      res.sendStatus(200)
    } catch {
      res.sendStatus(500)
    }
  })

  router.get('/contexts', async (req, res) => {
    const { botId } = req.params

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    const contexts = await botNLU.legacyIntentService.getContexts()
    res.send(contexts)
  })

  router.get('/legacy-intents', async (req, res) => {
    const { botId } = req.params

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    const intents = await botNLU.legacyIntentService.getIntents()
    res.send(intents)
  })

  router.get(`/legacy-intents/:intentName`, async (req, res) => {
    const { botId, intentName } = req.params

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    const intents = await botNLU.legacyIntentService.getIntents()
    const intent = intents.find(i => i.name === intentName)
    if (intent) {
      return res.send(intent)
    }

    res.status(404).send(`Couldn't find intent ${intentName} in bot ${botId}`)
  })

  router.post('/legacy-intents', async (req, res) => {
    const { botId } = req.params

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    const intent = await validateLegacyIntent(req.body, await botNLU.nluService.getEntities())
    await botNLU.legacyIntentService.createIntent(intent)
    res.sendStatus(200)
  })

  router.post(`/legacy-intents/:intentName`, async (req, res) => {
    const { botId, intentName } = req.params
    const intent = req.body

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    await botNLU.legacyIntentService.updateIntent(intentName, intent)
    res.sendStatus(200)
  })

  router.post(`/legacy-intents/:intentName/delete`, async (req, res) => {
    const { botId, intentName } = req.params

    const botNLU = state.nluByBot[botId]
    if (!botNLU) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    await botNLU.legacyIntentService.deleteIntent(intentName)
    res.sendStatus(200)
  })
}
