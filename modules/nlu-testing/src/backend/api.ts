import Axios, { AxiosRequestConfig } from 'axios'
import P from 'bluebird'
import * as sdk from 'botpress/sdk'
import parse from 'csv-parse'
import stringify from 'csv-stringify/lib/sync'
import fs from 'fs'
import Joi from 'joi'
import _ from 'lodash'
import multer from 'multer'
import nanoid from 'nanoid'
import path from 'path'
import MultiClassF1Scorer from './f1-scorer'

import { Condition, CSVTest, Test, TestResult, TestResultDetails } from '../shared/typings'
import { computeSummary } from '../shared/utils'

const TestsSchema = Joi.array().items(
  Joi.object({
    id: Joi.string().required(),
    context: Joi.string().required(),
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

    try {
      const result = await runTest(test, axiosConfig)

      res.send(result)
    } catch (err) {
      bp.logger.warn('could not get response from converse api', err)
      res.send(400)
    }
  })

  router.post('/import', multer().single('file'), (req, res) => {
    parse(req.file.buffer, { columns: true }, async (err, data: CSVTest[]) => {
      if (err) {
        return res.status(500).send({ message: 'Cannot parse csv' })
      }

      const tests: Test[] = _.chain(data)
        .filter(t => !!t.Context && !!t.Intent && !!t.Utterance)
        .flatMap(t =>
          t.Context.split(',').map(c => ({
            id: nanoid(),
            utterance: t.Utterance,
            context: c,
            conditions: [['intent', 'is', `${c.toLowerCase()}-${t.Intent}`]] as Condition[]
          }))
        )
        .value()
      try {
        await saveAllTests(req.params.botId, tests)
        res.status(200).send({ nTests: data.length })
      } catch (err) {
        res.status(400).send('Tests are invalid')
      }
    })
  })

  router.post('/export', async (req, res) => {
    // TODO add a little validation
    const targetPath = isRunningFromSources()
    if (!targetPath) {
      return res.status(400).send('Not in a git repository`')
    }

    const tests = await getAllTests(req.params.botId)
    try {
      const csv = results2CSV(tests, req.body.results)
      fs.writeFileSync(targetPath, csv)
      res.sendStatus(200)
    } catch (err) {
      console.log(err)
      res.sendStatus(500)
    }
  })

  router.post('/runAll', async (req, res) => {
    const tests = await getAllTests(req.params.botId)
    const axiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })

    const resultsBatch = await P.mapSeries(_.chunk(tests, 20), testChunk => {
      return P.map(testChunk, async test => runTest(test, axiosConfig))
    })

    const testResults = _.flatten(resultsBatch).reduce((dic, testRes) => ({ ...dic, [testRes.id]: testRes }), {})
    // uncomment this when working on out of scope
    // const f1Scorer = new MultiClassF1Scorer()
    // _.zip(tests, _.flatten(resultsBatch)).forEach(([test, res]) => {
    //   const expected = test.conditions[0][2].endsWith('none') ? 'out' : 'in'
    //   // @ts-ignore
    //   const actual = res.nlu.outOfScope[test.context].label
    //   f1Scorer.record(expected, actual)
    //   // @ts-ignore
    // })
    // testResults.OOSF1 = f1Scorer.getResults()
    res.send(testResults)
  })
}

function results2CSV(tests: Test[], results: _.Dictionary<TestResult>) {
  const summary = computeSummary(tests, results)
  const records = [
    ['utterance', 'context', 'conditions', 'status', `date: ${new Date().toLocaleDateString()}`, `summary: ${summary}`],
    ...tests.map(t => [
      t.utterance,
      t.context,
      t.conditions.reduce((c, next) => `${c}-${next}`, ''),
      _.get(results, `${t.id}.success`) ? 'pass' : 'fail'
    ])
  ]
  return stringify(records)
}

function isRunningFromSources(): string | undefined {
  try {
    const sourceDirectory = path.resolve(process.PROJECT_LOCATION, '../..')
    const latestResultsPath = path.resolve(sourceDirectory, `./modules/nlu-testing/latest-results.csv`)
    const exists = fs.existsSync(latestResultsPath)
    return exists ? latestResultsPath : undefined
  } catch {
    return undefined
  }
}

async function runTest(test: Test, axiosConfig: AxiosRequestConfig): Promise<TestResult> {
  const {
    data: { nlu }
  } = await Axios.post('mod/nlu/predict', { text: test.utterance, contexts: [test.context] }, axiosConfig)

  const details = test.conditions.map(c => conditionMatch(nlu, c, test.context))
  return {
    // @ts-ignore
    nlu,
    success: details.every(r => r.success),
    id: test.id,
    details
  }
}

function conditionMatch(nlu: sdk.IO.EventUnderstanding, [key, matcher, expected], ctx: string): TestResultDetails {
  if (key === 'intent') {
    expected = expected.endsWith('none') ? 'none' : expected
    const received = nlu.intent.name
    const success = expected === received

    return {
      success,
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
