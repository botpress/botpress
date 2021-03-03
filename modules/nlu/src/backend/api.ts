import * as sdk from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'
import { PredictOutput } from 'nlu-core'
import yn from 'yn'

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

export default async (bp: typeof sdk, state: NLUState) => {
  const router = bp.http.createRouterForBot('nlu')
  const needsWriteMW = bp.http.needPermission('write', 'bot.training')

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
      let nlu: PredictOutput

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

  router.post('/train/:lang', needsWriteMW, async (req, res) => {
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

  router.post('/train/:lang/delete', needsWriteMW, async (req, res) => {
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
}
