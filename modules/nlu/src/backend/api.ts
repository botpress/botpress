import * as sdk from 'botpress/sdk'
import { Response } from 'express'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'
import { Config } from '../config'

import { NLUApplication } from './application'
import { BotDoesntSpeakLanguageError, BotNotMountedError } from './application/errors'
import { TrainingSession } from './application/typings'
import { election } from './election'

const ROUTER_ID = 'nlu'

interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: sdk.NLU.TrainingSession
}

const PredictSchema = Joi.object().keys({
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global']),
  text: Joi.string().required()
})

const makeErrorMapper = (bp: typeof sdk) => (err: { botId: string; lang: string; error: Error }, res: Response) => {
  const { error, botId, lang } = err

  if (error instanceof BotNotMountedError) {
    return res.status(404).send(`Bot ${botId} doesn't exist`)
  }

  if (error instanceof BotDoesntSpeakLanguageError) {
    return res.status(422).send(`Language ${lang} is either not supported by bot or by language server`)
  }

  const msg = 'An unexpected error occured.'
  bp.logger
    .forBot(botId)
    .attachError(error)
    .error(msg)
  return res.status(500).send(msg)
}

const mapTrainSession = (ts: TrainingSession): sdk.NLU.TrainingSession => {
  const { botId, language, progress, status } = ts
  const key = `training:${botId}:${language}`
  return { key, language, status, progress }
}

export const getWebsocket = (bp: typeof sdk) => {
  return async (ts: TrainingSession) => {
    const { botId } = ts
    const trainSession = mapTrainSession(ts)
    const ev: NLUProgressEvent = { type: 'nlu', botId, trainSession }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', ev))
  }
}

export const registerRouter = async (bp: typeof sdk, app: NLUApplication) => {
  const router = bp.http.createRouterForBot(ROUTER_ID)
  const webSocket = getWebsocket(bp)

  const mapError = makeErrorMapper(bp)
  const needsWriteMW = bp.http.needPermission('write', 'bot.training')

  const globalConfig: Config = await bp.config.getModuleConfig('nlu')

  /**
   * This is needed because of limitiations on ghost file listening
   * and the fact studio and runtime don't share the same process.
   */
  router.post('/checkForDirtyModels', async (req, res) => {
    const { botId } = req.params
    const bot = app.getBot(botId)
    for (const l of bot.languages) {
      const ts = await bot.syncAndGetState(l)
      await webSocket({ ...ts, botId, language: l })
    }
    res.sendStatus(200)
  })

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it has changed (eg: user added languages)
    const health = await app.getHealth()
    if (!health) {
      return res.status(404).send('NLU Server is unreachable')
    }
    return res.send(health)
  })

  router.get('/training/:language', async (req, res) => {
    const { language: lang, botId } = req.params

    try {
      const state = await app.getBot(botId).syncAndGetState(lang)
      const ts = mapTrainSession({ botId, language: lang, ...state })
      res.send(ts)
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })

  router.post(['/predict', '/predict/:lang'], async (req, res) => {
    const { botId, lang } = req.params
    const { error, value } = PredictSchema.validate(req.body)
    if (error) {
      return res.status(400).send('Predict body is invalid')
    }

    try {
      const bot = app.getBot(botId)
      const t0 = Date.now()
      const nlu = await bot.predict(value.text, lang)
      const event: sdk.IO.EventUnderstanding = {
        ...nlu,
        includedContexts: value.contexts,
        detectedLanguage: nlu.detectedLanguage,
        ms: Date.now() - t0
      }
      res.send({ nlu: election(event, globalConfig) })
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })

  router.post('/train/:lang', needsWriteMW, async (req, res) => {
    const { botId, lang } = req.params
    try {
      const disableTraining = yn(process.env.BP_NLU_DISABLE_TRAINING)
      if (!disableTraining) {
        await app.queueTraining(botId, lang)
      }
      res.sendStatus(200)
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })

  router.post('/train/:lang/delete', needsWriteMW, async (req, res) => {
    const { botId, lang } = req.params
    try {
      await app.getBot(botId).cancelTraining(lang)
      res.sendStatus(200)
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })
}

export const removeRouter = (bp: typeof sdk) => {
  bp.http.deleteRouterForBot(ROUTER_ID)
}
