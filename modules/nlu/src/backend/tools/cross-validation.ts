import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import Engine from '../engine'
import { MIN_NB_UTTERANCES } from '../training-pipeline'
import { BIO } from '../typings'
import Utterance, { buildUtteranceBatch } from '../utterance/utterance'

import MultiClassF1Scorer, { F1 } from './f1-scorer'
const seedrandom = require('seedrandom')

interface CrossValidationResults {
  intents: Dic<F1> //
  slots: F1
}

interface TestSetExample {
  utterance: Utterance
  ctxs: string[]
  intent: string
}

type TestSet = TestSetExample[]
type TrainSet = NLU.IntentDefinition[]

const TRAIN_SET_SIZE = 0.8

async function makeIntentTestSet(rawUtts: string[], ctxs: string[], intent: string, lang: string): Promise<TestSet> {
  const utterances = await buildUtteranceBatch(rawUtts, lang, Engine.tools)
  return utterances.map(utterance => ({
    utterance,
    ctxs,
    intent
  }))
}

async function splitSet(language: string, intents: TrainSet): Promise<[TrainSet, TestSet]> {
  const lo = _.runInContext() // so seed is applied
  let testSet: TestSet = []
  const trainSet = (
    await Promise.map(intents, async i => {
      // split data & preserve distribution
      const nTrain = Math.floor(TRAIN_SET_SIZE * i.utterances[language].length)
      if (nTrain < MIN_NB_UTTERANCES) {
        return // filter out thouse without enough data
      }

      const utterances = lo.shuffle(i.utterances[language])
      const trainUtts = utterances.slice(0, nTrain)
      const iTestSet = await makeIntentTestSet(utterances.slice(nTrain), i.contexts, i.name, language)
      testSet = [...testSet, ...iTestSet]

      return {
        ...i,
        utterances: { [language]: trainUtts }
      }
    })
  ).filter(Boolean)

  return [trainSet, testSet]
}

function recordSlots(testU: Utterance, extractedSlots: NLU.SlotCollection, f1Scorer: MultiClassF1Scorer) {
  const slotList = _.values(extractedSlots)

  for (const tok of testU.tokens) {
    const actual = _.get(
      slotList.find(s => s.start <= tok.offset && s.end >= tok.offset + tok.value.length),
      'name',
      BIO.OUT
    ) as string
    const expected = _.get(tok, 'slots.0.name', BIO.OUT) as string
    f1Scorer.record(actual, expected)
  }
}

// pass k for k-fold is results are not significant
export async function crossValidate(
  botId: string,
  intents: NLU.IntentDefinition[],
  entities: NLU.EntityDefinition[],
  language: string
): Promise<CrossValidationResults> {
  seedrandom('confusion', { global: true })

  const [trainSet, testSet] = await splitSet(language, intents)

  const engine = new Engine(language, botId)
  await engine.train(trainSet, entities, language)

  const allCtx = _.chain(intents)
    .flatMap(i => i.contexts)
    .uniq()
    .value()

  const intentF1Scorers: Dic<MultiClassF1Scorer> = _.chain(allCtx)
    .thru(ctxs => (ctxs.length > 1 ? ['all', ...ctxs] : ctxs))
    .reduce((byCtx, ctx) => ({ ...byCtx, [ctx]: new MultiClassF1Scorer() }), {})
    .value()

  const slotsF1Scorer = new MultiClassF1Scorer()
  const intentMap: Dic<NLU.IntentDefinition> = intents.reduce((map, i) => ({ ...map, [i.name]: i }), {})

  for (const ex of testSet) {
    for (const ctx of ex.ctxs) {
      const res = await engine.predict(ex.utterance.toString(), [ctx])
      intentF1Scorers[ctx].record(res.intent.name, ex.intent)
      const intentHasSlots = !!intentMap[ex.intent].slots.length
      if (intentHasSlots) {
        recordSlots(ex.utterance, res.slots, slotsF1Scorer)
      }
    }
    if (allCtx.length > 1) {
      const res = await engine.predict(ex.utterance.toString(), allCtx)
      intentF1Scorers['all'].record(res.intent.name, ex.intent)
    }
  }

  seedrandom()
  return {
    intents: _.fromPairs(_.toPairs(intentF1Scorers).map(([ctx, scorer]) => [ctx, scorer.getResults()])),
    slots: slotsF1Scorer.getResults()
  }
}
