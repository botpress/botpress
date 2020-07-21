import getVocabTokenizer from './vocab-tokenizer'

test('vocab tokenizer should split', () => {
  // arange
  const vocab = ['shes', 'a', 'witch', 'burn', 'her']
  const sentencepieceToken = 'shesa'
  const vocabTokenizer = getVocabTokenizer(vocab)

  // act
  const actual = vocabTokenizer(sentencepieceToken)

  // assert
  expect(actual).toHaveLength(2)
  expect(actual[0]).toBe('shes')
  expect(actual[1]).toBe('a')
})

test('vocab tokenizer should split with the correct token', () => {
  // arange
  const vocab = ['she', 'shes', 'is', 's', 'a', 'sa', 'witch', 'burn', 'her']
  const sentencepieceToken = 'shesa'
  const vocabTokenizer = getVocabTokenizer(vocab)

  // act
  const actual = vocabTokenizer(sentencepieceToken)

  // assert
  expect(actual).toHaveLength(2)
  expect(actual[0]).toBe('shes')
  expect(actual[1]).toBe('a')
})

test('vocab tokenizer should not try more than combinations of length 2', () => {
  // arange
  const vocab = ['she', 'shes', 'is', 's', 'a', 'sa', 'witch', 'burn', 'her']
  const sentencepieceToken = 'shesawitch'
  const vocabTokenizer = getVocabTokenizer(vocab)

  // act
  const actual = vocabTokenizer(sentencepieceToken)

  // assert
  expect(actual).toHaveLength(1)
  expect(actual[0]).toBe('shesawitch')
})

test('vocab tokenizer should not split', () => {
  // arange
  const vocab = ['she', 'shes', 'is', 's', 'a', 'witch', 'burn', 'her']
  const sentencepieceToken = 'arthur'
  const vocabTokenizer = getVocabTokenizer(vocab)

  // act
  const actual = vocabTokenizer(sentencepieceToken)

  // assert
  expect(actual).toHaveLength(1)
  expect(actual[0]).toBe('arthur')
})
