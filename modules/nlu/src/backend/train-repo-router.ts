import express, { Router } from 'express'
import Joi from 'joi'
import { NLUApplication } from './application'
import { TrainingSession } from './application/typings'

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

/**
 * This is the training repository router to override the training states
 *
 * To get all trainings for the bot:
 * GET /mod/nlu/trainrepo/trainings
 *
 * To get a training's state for a specific language:
 * GET /mod/nlu/trainrepo/trainings/:lang
 *
 * To modify a training's state:
 *
 * POST /mod/nlu/trainrepo/trainings/:lang
 * body: {
 *   status: <One of 'idle', 'done', 'needs-training', 'training-pending', 'training', 'canceled', 'errored'>,
 *   progress: <value between 0.0 and 1.0>
 * }
 *
 * To delete a training state:
 * POST /mod/nlu/trainrepo/trainings/:lang/delete
 *
 */
const createRepositoryRouter = (app: NLUApplication): Router => {
  const router = express.Router({ mergeParams: true })

  const repo = app.trainRepository

  router.get('/trainings', async (req, res) => {
    const { botId } = req.params
    const trainings = await repo.query({ botId })
    res.status(200).json(trainings)
  })

  router.use('/trainings/:lang', async (req, res, next) => {
    const { botId, lang } = req.params
    try {
      const training = await repo.get({ botId, language: lang })

      if (!training) {
        return res.status(404).json({ error: 'Training not found' })
      }

      res.locals.training = training
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
    next()
  })

  router.get('/trainings/:lang', async (req, res) => {
    const trainings = res.locals.training as TrainingSession[]
    res.status(200).json(trainings)
  })

  router.post('/trainings/:lang', async (req, res) => {
    const { botId, lang } = req.params
    const { error, value } = trainingStatusSchema.validate(req.body)

    if (error) {
      return res.status(400).json({ error: `Training status body is invalid: ${error.message}` })
    }
    await repo.inTransaction(trx => {
      return trx.set({ botId, language: lang }, value)
    })
    res.status(200).send()
  })

  router.post('/trainings/:lang/delete', async (req, res) => {
    const { botId, lang } = req.params
    await repo.inTransaction(trx => {
      return trx.delete({ botId, language: lang })
    })
    res.status(200).send()
  })

  return router
}

export default createRepositoryRouter
