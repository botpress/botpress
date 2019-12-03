import Joi from 'joi'

import { Config } from '../config'

import { SDK } from '.'

export interface Test {
  id: string
  utterance: string
  condition: ['intent' | 'slot', 'is', string]
}

const TestsSchema = Joi.array().items(
  Joi.object({
    id: Joi.string().required(),
    utterance: Joi.string().required(),
    condition: Joi.array()
      .ordered(Joi.string().allow('intent', 'slot'), Joi.string().allow('is'), Joi.string())
      .required()
      .length(3)
  })
)

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('nlu-testing')

  const getAllTests = async (botId: string) => {
    try {
      const content = await bp.ghost.forBot(botId).readFileAsObject<Test[]>('./', 'nlu-tests.json')
      const { error } = Joi.validate(content, TestsSchema)
      if (error) {
        bp.logger.attachError(error).error('Error parsing tests: invalid tests')
        return []
      }

      return content
    } catch (err) {
      if (err.code === 'ENOENT') {
        return []
      }
      throw err
    }
  }

  const saveAllTests = async (botId: string, tests: Test[]) => {
    const { error } = Joi.validate(tests, TestsSchema)
    if (error) {
      bp.logger.attachError(error).error('Error saving tests: invalid schema')
      throw error
    }

    await bp.ghost.forBot(botId).upsertFile('./', 'nlu-tests.json', JSON.stringify(tests, undefined, 2))
  }

  router.get('/tests', async (req, res) => {
    res.send(await getAllTests(req.params.botId))
  })

  router.post('/tests/:testId', async (req, res) => {
    let tests = await getAllTests(req.params.botId)
    tests = tests.filter(x => x.id !== req.params.testId)

    try {
      await saveAllTests(req.params.botId, [...tests, req.body])
      res.sendStatus(204)
    } catch (err) {
      res.sendStatus(500)
    }
  })

  router.delete('/tests/:testId', async (req, res) => {
    let tests = await getAllTests(req.params.botId)
    tests = tests.filter(x => x.id !== req.params.testId)

    try {
      await saveAllTests(req.params.botId, tests)
      res.sendStatus(200)
    } catch (err) {
      res.sendStatus(500)
    }
  })

  router.post('/tests/:testId/run', async (req, res) => {
    const tests = await getAllTests(req.params.botId)
    const test = tests.find(x => x.id === req.params.testId)

    if (!test) {
      return res.status(404).send({ result: 'failure', id: req.params.testId, reason: 'test not found' })
    }

    const result = { result: 'success', id: req.params.testId }

    res.send(result)
  })
}
