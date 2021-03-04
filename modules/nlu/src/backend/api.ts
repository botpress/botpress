import * as sdk from 'botpress/sdk'
import { Response } from 'express'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'

import { NLUApplication } from './application'
import { BotDoesntSpeakLanguageError, BotNotMountedError } from './application/errors'
import { TrainingSession } from './application/typings'
import legacyElectionPipeline from './election/legacy-election'
import { NLUProgressEvent } from './typings'

const ROUTER_ID = 'nlu'

export const PredictSchema = Joi.object().keys({
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

  const mapError = makeErrorMapper(bp)

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it has changed (eg: user added languages)
    const health = app.getHealth()
    res.send(health)
  })

  router.get('/training/:language', async (req, res) => {
    const { language, botId } = req.params

    const state = await app.getTraining(botId, language)
    const ts = mapTrainSession({ botId, language, ...state })
    res.send(ts)
  })

  router.post(['/predict', '/predict/:lang'], async (req, res) => {
    const { botId, lang } = req.params
    const { error, value } = PredictSchema.validate(req.body)
    if (error) {
      return res.status(400).send('Predict body is invalid')
    }

    try {
      const bot = app.getBot(botId)
      const nlu = await bot.predict(value.text, lang)
      const event: sdk.IO.EventUnderstanding = {
        ...nlu,
        includedContexts: value.contexts,
        detectedLanguage: nlu.detectedLanguage
      }
      res.send({ nlu: legacyElectionPipeline(event) })
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })

  router.post('/train/:lang', async (req, res) => {
    const { botId, lang } = req.params
    try {
      const disableTraining = yn(process.env.BP_NLU_DISABLE_TRAINING)

      // to return as fast as possible
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (!disableTraining) {
        await app.queueTraining(botId, lang)
      }
      res.sendStatus(200)
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })

  router.post('/train/:lang/delete', async (req, res) => {
    const { botId, lang } = req.params
    try {
      await app.cancelTraining(botId, lang)
      res.sendStatus(200)
    } catch (error) {
      return mapError({ botId, lang, error }, res)
    }
  })

  addTrainingServiceRoutes(router, app, mapError)
}

const trainingStatusSchema = Joi.object().keys({
  status: Joi.string()
    .valid(['idle', 'done', 'needs-training', 'training-pending', 'training', 'canceled', 'errored'])
    .required(),
  progress: Joi.number()
    .default(0)
    .min(0)
    .max(1)
    .required()
})

const addTrainingServiceRoutes = (
  router: sdk.http.RouterExtension,
  app: NLUApplication,
  errorMapper: (err: { botId: string; lang: string; error: Error }, res: Response) => Response
) => {
  const repo = app.repository
  const SUBROUTE_NAME = 'trainrepo'

  router.get(`/${SUBROUTE_NAME}/trainings`, async (req, res) => {
    const trainings = await repo.getAll()
    res.status(200).json(trainings)
  })

  router.use(`/${SUBROUTE_NAME}/trainings/:botId/:lang`, async (req, res, next) => {
    const { botId, lang } = req.params
    try {
      const training = await repo.get({ botId, language: lang })
      if (!training) {
        throw new Error('Training not found')
      }
      res.locals.training = training
    } catch (error) {
      return errorMapper({ botId, lang, error }, res)
    }
    next()
  })

  router.get(`/${SUBROUTE_NAME}/trainings/:botId/:lang`, async (req, res) => {
    const trainings = res.locals.training as TrainingSession[]
    res.status(200).json(trainings)
  })

  router.post(`/${SUBROUTE_NAME}/trainings/:botId/:lang`, async (req, res) => {
    const { botId, lang } = req.params
    const { error, value } = trainingStatusSchema.validate(req.body)

    if (error) {
      return res.status(400).send(`Training status body is invalid: ${error.message}`)
    }

    await repo.set({ botId, language: lang }, value)
    res.status(200).send()
  })
}

export const removeRouter = (bp: typeof sdk) => {
  bp.http.deleteRouterForBot(ROUTER_ID)
}
