import * as sdk from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'

import { isOn as isAutoTrainOn, set as setAutoTrain } from './autoTrain'
import recommendations from './intents/recommendations'
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
    if (!state.nluByBot[botId]) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    try {
      let nlu = await state.nluByBot[botId].engine.predict(value.text, value.contexts)
      nlu = legacyElectionPipeline(nlu)
      res.send({ nlu })
    } catch (err) {
      res.status(500).send('Could not extract nlu data')
    }
  })

  router.get('/train', async (req, res) => {
    try {
      const { botId } = req.params
      const isTraining = await state.nluByBot[botId].isTraining()
      res.send({ isTraining })
    } catch {
      res.sendStatus(500)
    }
  })

  router.post('/train', async (req, res) => {
    try {
      const { botId } = req.params
      const isAuto = await isAutoTrainOn(bp, botId)
      await state.nluByBot[botId].trainOrLoad(isAuto)
      res.sendStatus(200)
    } catch {
      res.sendStatus(500)
    }
  })

  router.post('/train/delete', async (req, res) => {
    try {
      const { botId } = req.params
      await state.nluByBot[botId].cancelTraining()
      res.sendStatus(200)
    } catch {
      res.sendStatus(500)
    }
  })

  router.get('/ml-recommendations', async (req, res) => {
    res.send(recommendations)
  })

  router.post('/autoTrain', async (req, res) => {
    const { botId } = req.params
    const { autoTrain } = req.body

    await setAutoTrain(bp, botId, autoTrain)

    res.sendStatus(200)
  })

  router.get('/autoTrain', async (req, res) => {
    const { botId } = req.params

    const isOn = await isAutoTrainOn(bp, botId)

    res.send({ isOn })
  })
}
