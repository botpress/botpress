import * as sdk from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'

import legacyElectionPipeline from './election/legacy-election'
import { BotDoesntSpeakLanguageError, BotNotMountedError } from './errors'
import { NLUState } from './typings'

const ROUTER_ID = 'nlu'

export const PredictSchema = Joi.object().keys({
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global']),
  text: Joi.string().required()
})

export const registerRouter = async (bp: typeof sdk, state: NLUState) => {
  const { application, engine, trainSessionService } = state
  const router = bp.http.createRouterForBot(ROUTER_ID)

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it has changed (eg: user added languages)
    const health = engine.getHealth()
    res.send(health)
  })

  router.get('/training/:language', async (req, res) => {
    const { language, botId } = req.params
    const session = await trainSessionService.getTrainingSession(botId, language)
    res.send(session)
  })

  router.post(['/predict', '/predict/:lang'], async (req, res) => {
    const { botId, lang } = req.params
    const { error, value } = PredictSchema.validate(req.body)
    if (error) {
      return res.status(400).send('Predict body is invalid')
    }

    try {
      const nlu = await application.predict(botId, value.text, lang)
      const event: sdk.IO.EventUnderstanding = {
        ...nlu,
        includedContexts: value.contexts
      }
      res.send({ nlu: legacyElectionPipeline(event) })
    } catch (err) {
      res.status(500).send('Could not extract nlu data')
    }
  })

  router.post('/train/:lang', async (req, res) => {
    const { botId, lang } = req.params
    try {
      const disableTraining = yn(process.env.BP_NLU_DISABLE_TRAINING)

      // to return as fast as possible
      // tslint:disable-next-line: no-floating-promises
      application.trainOrLoad(botId, lang, disableTraining)
      res.sendStatus(200)
    } catch (err) {
      if (err instanceof BotNotMountedError) {
        return res.status(404).send(`Bot ${botId} doesn't exist`)
      }

      if (err instanceof BotDoesntSpeakLanguageError) {
        return res.status(422).send(`Language ${lang} is either not supported by bot or by language server`)
      }

      res.sendStatus(500)
    }
  })

  router.post('/train/:lang/delete', async (req, res) => {
    const { botId, lang } = req.params
    try {
      await application.broadcastCancelTraining(botId, lang)
      res.sendStatus(200)
    } catch (err) {
      if (err instanceof BotNotMountedError) {
        return res.status(404).send(`Bot ${botId} doesn't exist`)
      }

      if (err instanceof BotDoesntSpeakLanguageError) {
        return res.status(422).send(`Language ${lang} is either not supported by bot or by language server`)
      }

      res.sendStatus(500)
    }
  })
}

export const removeRouter = (bp: typeof sdk) => {
  bp.http.deleteRouterForBot(ROUTER_ID)
}
