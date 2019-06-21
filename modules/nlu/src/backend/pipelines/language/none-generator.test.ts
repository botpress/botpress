import _ from 'lodash'

import { ngram } from '../../tools/strings'

import { generateNoneUtterances } from './none-generator'

const tokens = [['▁he', 'llo', '▁what', '▁is', '▁your', '▁name', '▁?']]

test('None intent generator', () => {
  const utterances = generateNoneUtterances(tokens, 10)
  expect(utterances).toHaveLength(10)
  // console.log(utterances)
})

test('ngram', () => {
  expect(ngram('bonjour', 2)).toEqual(['ur', 'ou', 'jo', 'nj', 'on', 'bo'])
  expect(ngram('bonjour', 3)).toEqual(['our', 'jou', 'njo', 'onj', 'bon'])
})
