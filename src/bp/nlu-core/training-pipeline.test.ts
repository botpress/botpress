import _ from 'lodash'

import { tokenizeLatinTextForTests } from './test-utils/fake-tools'
import { TfidfTokens, TrainStep } from './training-pipeline'
import { Intent } from './typings'
import Utterance from './utterance/utterance'

test('tfidf has a value for all tokens of the training set', async () => {
  // arrange
  const makeUtterance = (utt: string) => {
    const tokens = tokenizeLatinTextForTests(utt)
    return new Utterance(
      tokens,
      tokens.map(t => Array(300).fill(0)),
      tokens.map(t => 'NOUN'),
      'en'
    )
  }

  const makeIntent = (name: string, utterances: string[]) => {
    return <Intent<Utterance>>{
      name,
      contexts: ['global'],
      slot_definitions: [],
      utterances: utterances.map(makeUtterance)
    }
  }

  const installBpIntent = makeIntent('install-bp', [
    'How can I install Botpress?',
    'Can you help me with Botpress install?'
  ])
  const reportBugIntent = makeIntent('report-bug', ['There seems to be a bug with Botpress...', 'I have a problem'])

  const intents: Intent<Utterance>[] = [installBpIntent, reportBugIntent]

  // act
  const { tfIdf } = await TfidfTokens({ intents } as TrainStep)

  // assert
  const botpressToken = 'botpress'

  const utterances = _.flatMap(intents, i => i.utterances)
  const tokens = _.flatMap(utterances, u => u.tokens)
  const desiredToken = tokens.find(t => t.toString({ lowerCase: true }) === botpressToken)

  expect(tfIdf).toBeDefined()
  expect(_.round(tfIdf![botpressToken], 2)).toBe(0.54)
  expect(_.round(desiredToken!.tfidf, 2)).toBe(0.54)
})
