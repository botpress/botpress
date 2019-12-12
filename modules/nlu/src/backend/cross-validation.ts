import { NLU } from 'botpress/sdk'
import _ from 'lodash'
const seedrandom = require('seedrandom')

import Engine2 from './engine2/engine2'
import MultiClassF1Scorer, { F1 } from './tools/f1-scorer'
import { parseUtterance } from './tools/utterance-parser'

interface CrossValidationResults {
  intents: Dic<F1> //
  slots: Dic<F1>
}

interface TestSetExample {
  input: string
  ctxs: string[]
  expected: {
    intent: string
    // slots: string[] // one tag for each tokens
  }
}

const TRAIN_SET_SIZE = 0.8

// TODO probably have to use the utterance class
function makeTestExample(trainU: string, ctxs, intent): TestSetExample {
  const parsed = parseUtterance(trainU)
  return {
    input: parsed.utterance,
    ctxs,
    expected: {
      intent
      // TODO add slots
    }
  }
}

function splitSet(language: string, intents: NLU.IntentDefinition[]): [NLU.IntentDefinition[], TestSetExample[]] {
  const lo = _.runInContext() // so seed is applied
  let testSet: TestSetExample[] = []
  const trainSet = intents // split data & preserve distribution
    .map(i => {
      const nTrain = Math.floor(TRAIN_SET_SIZE * i.utterances[language].length)
      if (nTrain < 3) {
        return // filter out thouse without enough data
      }

      const utterances = lo.shuffle(i.utterances[language])
      const trainUtts = utterances.slice(0, nTrain)

      const testExamples = utterances.slice(nTrain).map(u => makeTestExample(u, i.contexts, i.name))
      testSet = [...testSet, ...testExamples]

      return {
        ...i,
        utterances: { [language]: trainUtts }
      }
    })
    .filter(Boolean)

  return [trainSet, testSet]
}

// pass k for k-fold is results are not significant
export async function crossValidate(
  botId: string,
  intents: NLU.IntentDefinition[],
  entities: NLU.EntityDefinition[],
  language: string
): Promise<CrossValidationResults> {
  seedrandom('confusion', { global: true })

  const [trainSet, testSet] = splitSet(language, intents)

  const engine = new Engine2(language, botId)
  await engine.train(trainSet, entities, language)

  const allCtx = _.chain(intents)
    .flatMap(i => i.contexts)
    .uniq()
    .value()

  const intentF1Scorers: Dic<MultiClassF1Scorer> = _.chain(allCtx)
    .thru(ctxs => (ctxs.length > 1 ? ['all', ...ctxs] : ctxs))
    .reduce((byCtx, ctx) => ({ ...byCtx, [ctx]: new MultiClassF1Scorer() }), {})
    .value()

  for (const ex of testSet) {
    for (const ctx of ex.ctxs) {
      const res = await engine.predict(ex.input, [ctx])
      intentF1Scorers[ctx].record(res.intent.name, ex.expected.intent)
    }

    if (allCtx.length > 1) {
      const res = await engine.predict(ex.input, allCtx)
      intentF1Scorers['all'].record(res.intent.name, ex.expected.intent)
    }
  }

  seedrandom()
  return {
    intents: _.fromPairs(_.toPairs(intentF1Scorers).map(([ctx, scorer]) => [ctx, scorer.getResults()])),
    slots: {}
  }
}
