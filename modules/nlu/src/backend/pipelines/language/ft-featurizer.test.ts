import _ from 'lodash'

import { computeSentenceEmbedding } from './ft_featurizer'
import { doc, docTfidf, expectedResults, vecs } from './test-data'

test('Sentence Embeddings', () => {
  computeSentenceEmbedding(vecs, doc, docTfidf, {}).forEach((actual, idx) => {
    expect(actual).toBeCloseTo(expectedResults[idx], 3)
  })
})
