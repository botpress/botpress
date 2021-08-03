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

import { Condition, CSVTest, Test, TestResult, TestResultDetails } from '../shared/typings'
import { computeSummary } from '../shared/utils'

type BPDS_BotConfig = sdk.BotConfig & {
  bpdsId: string
}

const NONE = 'none'

const TestsSchema = Joi.array().items(
  Joi.object({
    id: Joi.string().required(),
    context: Joi.string().required(),
    utterance: Joi.string().required(),
    conditions: Joi.array().items(
      Joi.array()
        .ordered(Joi.string().allow('context', 'intent', 'slot:*'), Joi.string().allow('is'), Joi.string())
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
      res.sendStatus(400)
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
        res.send({ nTests: data.length })
      } catch (err) {
        res.status(400).send('Tests are invalid')
      }
    })
  })

  router.post('/export', async (req, res) => {
    // TODO add a little validation
    const botId = req.params.botId
    const targetPath = await isRunningFromSources(bp, botId)
    if (!targetPath) {
      return res.status(400).send('Not in a git repository`')
    }

    const botConfig = await bp.bots.getBotById(botId)
    const tests = await getAllTests(req.params.botId)
    try {
      const csv = results2CSV(tests, req.body.results, botConfig.nluSeed)
      fs.writeFileSync(targetPath, csv)
      res.sendStatus(200)
    } catch (err) {
      console.error(err)
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
    const accuracy = _.flatten(resultsBatch).filter(res => res.success).length / tests.length
    bp.logger.forBot(req.params.botId).info(`finished running tests with ${accuracy} of accuracy`)
    res.send(testResults)
  })
}

function results2CSV(tests: Test[], results: _.Dictionary<TestResult>, seed?: number) {
  const summary = computeSummary(tests, results)
  const records = [
    [
      'utterance',
      'context',
      'conditions',
      'status',
      `date: ${new Date().toLocaleDateString()}`,
      `summary: ${summary}`,
      `nlu seed: ${seed}`
    ],
    ...tests.map(t => [
      t.utterance,
      t.context,
      t.conditions.reduce((c, next) => `${c}-${next}`, ''),
      _.get(results, `${t.id}.success`) ? 'pass' : 'fail'
    ])
  ]
  return stringify(records)
}

async function isRunningFromSources(bp: typeof sdk, botId: string): Promise<string | undefined> {
  try {
    const botConfig = (await bp.bots.getBotById(botId)) as BPDS_BotConfig
    const bpdsId = botConfig.bpdsId
    if (!bpdsId) {
      return
    }

    const sourceDirectory = path.resolve(process.PROJECT_LOCATION, '../..')
    const botTemplatesPath = path.resolve(sourceDirectory, './modules/nlu-testing/src/bot-templates')
    const childDirs = fs.readdirSync(botTemplatesPath)

    const botTemplateUnderTesting = childDirs.find(template => {
      const configPath = path.resolve(botTemplatesPath, template, 'bot.config.json')
      const configContent = fs.readFileSync(configPath, { encoding: 'utf8' })
      const config = JSON.parse(configContent) as BPDS_BotConfig
      return config.bpdsId === bpdsId
    })
    if (!botTemplateUnderTesting) {
      return
    }

    const latestResultsPath = path.resolve(botTemplatesPath, botTemplateUnderTesting, 'latest-results.csv')
    const exists = fs.existsSync(latestResultsPath)

    return exists ? latestResultsPath : undefined
  } catch {
    return
  }
}

async function runTest(test: Test, axiosConfig: AxiosRequestConfig): Promise<TestResult> {
  const {
    data: { nlu }
  } = await Axios.post(
    'mod/nlu/predict',
    { text: test.utterance, contexts: test.context ? [test.context] : [] },
    axiosConfig
  )

  const conditionMatcher = test.context === '*' ? conditionMatchNDU : conditionMatch
  const details = test.conditions.map(c => conditionMatcher(nlu, c, test.context))

  return {
    nlu,
    success: details.every(r => r.success),
    id: test.id,
    details
  }
}

function conditionMatch(nlu: sdk.IO.EventUnderstanding, [key, matcher, expected], ctx: string): TestResultDetails {
  if (key === 'intent') {
    expected = expected.endsWith(NONE) ? NONE : expected
    const received = nlu.intent.name
    let success = expected === received
    if (expected.endsWith('disambiguation')) {
      success = !!nlu.ambiguous
    }

    return {
      success,
      reason: success
        ? ''
        : `Intent doesn't match. \nexpected: ${expected} \nreceived: ${received} \nconfidence: ${_.round(
            nlu.intent.confidence,
            2
          )}`,
      received,
      expected
    }
  } else if (key === 'context') {
    // eslint-disable-next-line
    let [received, ctxPred] = _.chain(nlu.predictions)
      .toPairs()
      .maxBy('1.confidence')
      .value()

    received = received !== 'oos' ? received : NONE
    const success = expected === received
    return {
      success,
      reason: success
        ? ''
        : `Context doesn't match. \nexpected: ${expected} \nreceived: ${received} \nconfidence ${_.round(
            ctxPred.confidence,
            2
          )}`,
      received,
      expected
    }
  } else if (key.includes('slot')) {
    return checkSlotMatch(nlu, key.split(':')[1], expected)
  }
}

function conditionMatchNDU(nlu: sdk.IO.EventUnderstanding, [key, matcher, expected], ctx: string): TestResultDetails {
  if (key.includes('slot')) {
    return checkSlotMatch(nlu, key.split(':')[1], expected)
  }
  if (key === 'context') {
    const [received, ctxPredObj] = _.chain(nlu.predictions)
      .toPairs()
      .maxBy('1.confidence')
      .value()

    let conf = ctxPredObj.confidence
    let success = expected === received

    if (expected === NONE) {
      const inConf = ctxPredObj.confidence * ctxPredObj.intents.filter(i => i.label !== NONE)[0].confidence
      const outConf = ctxPredObj.oos
      success = outConf > inConf
      conf = success ? outConf : conf
    }

    return {
      success,
      reason: success
        ? ''
        : `Context doesn't match. \nexpected: ${expected} \nreceived: ${received} \nconfidence: ${conf}`,
      received,
      expected
    }
  }

  if (key === 'intent') {
    const highestRankingIntent = _.chain(nlu.predictions)
      .values()
      .flatMap(ctxPreds => {
        return ctxPreds.intents.map(intentPred => {
          let confidence = intentPred.confidence * (1 - ctxPreds.oos) * ctxPreds.confidence
          if (intentPred.label === NONE) {
            confidence = Math.min(intentPred.confidence * ctxPreds.confidence * ctxPreds.oos, 1)
          }
          return {
            label: intentPred.label,
            confidence
          }
        })
      })
      .maxBy('confidence')
      .value()

    const success = expected === highestRankingIntent.label
    const conf = Math.round(Number(highestRankingIntent.confidence) * 100)
    return {
      success,
      reason: success
        ? ''
        : `Intent doesn't match. \nexpected: ${expected} \nreceived: ${highestRankingIntent.label} \nconfidence: ${conf}`,
      received: highestRankingIntent.label,
      expected
    }
  }
}

function checkSlotMatch(nlu, slotName, expected) {
  const received = _.get(nlu, `slots.${slotName}.source`, 'undefined')
  const success = received === expected

  return {
    success,
    reason: success ? '' : `Slot ${slotName} doesn't match. \nexpected: ${expected} \nreceived: ${received}`,
    received,
    expected
  }
}
