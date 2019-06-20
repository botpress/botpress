import _ from 'lodash'

export const SEPARATOR_CHAR = ''

// Example input: [ [ 'he', 'llo', 'what', 'is', 'your', 'name', '?' ] ]
// Example output: [ [ 'haatlo', 'llmeour', 'your', 'name', 'ame', 'atyona', 'he' ], [ 'amheur', 'am', 'llo', 'is' ] ]
export function generateNoneUtterances(utterances: string[][], count: number): string[][] {
  const plainTokens = _.flatten(utterances)
    .map(x => x.replace(SEPARATOR_CHAR, '')) // We want to discover real language-specific chars
    .filter(x => x.length > 1) // We want to exclude tokens that represent ponctuation etc (tokenizers will often split them alone)

  // We build a gramset, which is essentially a list of all the unique bigrams and trigrams
  // We'll create entirely new words from those grams
  const gramset = _.chain(plainTokens)
    .map(x => [ngram(x, 1), ngram(x, 2)])
    .flattenDeep()
    .uniq()
    .value()

  const realWords = _.uniq(plainTokens)
  const meanWordSize = _.meanBy(realWords, w => w.length)
  const junkWords = _.range(0, 100)
    .map(() => _.sampleSize(gramset, _.random(meanWordSize / 3, meanWordSize * 1.5, false)).join('')) // 100 randomly generated words
    .filter(x => !realWords.includes(x)) // excluding words that exist for real

  return _.range(0, count).map(() => {
    // create new utterances of varying length, made of real AND junk words (more junk)
    const fromVocab = _.random(0, 0, false)
    const fromJunk = _.random(2, 5, false)

    return _.shuffle([..._.sampleSize(realWords, fromVocab), ..._.sampleSize(junkWords, fromJunk)]).map(
      x => SEPARATOR_CHAR + x // Add token separator at the begining of each word
    )
  })
}

export function ngram(value: string, n: number) {
  const nGrams: string[] = []
  let index = value.length - n + 1

  while (index--) {
    nGrams.push(value.slice(index, index + n))
  }

  return nGrams
}
