import _ from 'lodash'

import { generateNoneUtterances, ngram } from './none-generator'

const tokens = [['▁he', 'llo', '▁what', '▁is', '▁your', '▁name', '▁?']]

test('None intent generator', () => {
  expect(generateNoneUtterances(tokens, 10)).toHaveLength(10)
})

test('ngram', () => {
  expect(ngram('bonjour', 2)).toEqual(['ur', 'ou', 'jo', 'nj', 'on', 'bo'])
  expect(ngram('bonjour', 3)).toEqual(['our', 'jou', 'njo', 'onj', 'bon'])
})
