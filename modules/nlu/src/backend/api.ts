import * as sdk from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'

import legacyElectionPipeline from './election/legacy-election'
import mergeSpellChecked from './election/spellcheck-handler'
import { PredictOutput } from './election/typings'
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

    const modelId = botNLU.modelsByLang[botNLU.defaultLanguage]

    try {
      // TODO: language should be a path param of route

      let nlu: sdk.IO.EventUnderstanding

      const spellChecked = await state.engine.spellCheck(value.text, modelId)
      if (spellChecked !== value.text) {
        const originalPrediction = (await state.engine.predict(value.text, value.contexts, modelId)) as PredictOutput
        const spellCheckedPrediction = (await state.engine.predict(
          spellChecked,
          value.contexts,
          modelId
        )) as PredictOutput
        nlu = mergeSpellChecked(originalPrediction, spellCheckedPrediction)
      } else {
        nlu = await state.engine.predict(value.text, value.contexts, modelId)
      }
      nlu = legacyElectionPipeline(nlu)
      res.send({ nlu })
    } catch (err) {
      res.status(500).send('Could not extract nlu data')
    }
  })

  router.post('/train', async (req, res) => {
    try {
      const { botId } = req.params

      // Is it this even necessary anymore ?
      const disableTraining = yn(process.env.BP_NLU_DISABLE_TRAINING)

      // to return as fast as possible
      // tslint:disable-next-line: no-floating-promises
      state.nluByBot[botId].trainOrLoad(disableTraining)
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
}
