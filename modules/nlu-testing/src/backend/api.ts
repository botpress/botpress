import Axios from 'axios'
import * as sdk from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'

import { Config } from '../config'

export interface Test {
  id: string
  utterance: string
  conditions: ['intent' | 'slot', 'is', string][]
}

const TestsSchema = Joi.array().items(
  Joi.object({
    id: Joi.string().required(),
    utterance: Joi.string().required(),
    conditions: Joi.array().items(
      Joi.array()
        .ordered(Joi.string().allow('intent', 'slot:*'), Joi.string().allow('is'), Joi.string())
        .required()
        .length(3)
    )
  })
)

export default async (bp: typeof sdk) => {
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

    const axiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })

    const {
      data: { nlu }
    } = await Axios.post(
      '/converse/nlutesting/secured?include=nlu',
      { type: 'text', text: test.utterance },
      axiosConfig
    )

    const details = test.conditions.map(c => conditionMatch(nlu, c))
    const result = {
      success: details.every(r => r.success),
      id: req.params.testId,
      details
    }

    res.send(result)
  })
}

function conditionMatch(nlu: sdk.IO.EventUnderstanding, [key, matcher, expected]): TestResult {
  if (key === 'intent') {
    const received = nlu.intent.name
    const success = nlu.intent.name === expected
    return {
      success: nlu.intent.name === expected,
      reason: success ? '' : `Intent doesn't match, expected: ${expected} received: ${received}`,
      received,
      expected
    }
  } else if (key.includes('slot')) {
    const slotName = key.split(':')[1]
    const received = _.get(nlu, `slots.${slotName}.source`, 'undefined')
    const success = received === expected
    return {
      success,
      reason: success ? '' : `Slot ${slotName} doesn't match. expected: ${expected} received: ${received}`,
      received,
      expected
    }
  }
}

export interface TestResult {
  success: boolean
  reason?: string
  expected: string
  received: string | undefined
}
