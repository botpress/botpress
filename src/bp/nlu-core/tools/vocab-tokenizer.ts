import _ from 'lodash'

interface VocabMatch {
  start: number
  end: number
  length: number
  src: string
}

export default (vocab: string[]) => (token: string) => {
  let matchingVocabTokens: VocabMatch[] = vocab
    .map(t => {
      try {
        const regexp = new RegExp(t, 'i')
        const match: RegExpMatchArray | null = token.match(regexp)
        return match
      } catch {
        return undefined
      }
    })
    .filter(x => !!x && x.length && x[0].length)
    .map(match => {
      const start = match!.index
      const src = match![0]
      const length = src.length
      const end = start! + length
      return <VocabMatch>{
        start,
        end,
        length,
        src
      }
    })
  matchingVocabTokens = _.orderBy(matchingVocabTokens, (match: VocabMatch) => match.length, 'desc')

  const coverAllToken = matchesCoverAllToken(token)

  for (const p of pairs(matchingVocabTokens.length)) {
    const [first, second] = _(p)
      .map(idx => matchingVocabTokens[idx])
      .orderBy(m => m.start)
      .value()

    if (coverAllToken(first, second)) {
      return [first.src, second.src]
    }
  }

  return [token]
}

function pairs(length: number) {
  return {
    *[Symbol.iterator](): Generator<[number, number]> {
      for (let i = 0; i < length; i++) {
        for (let j = i + 1; j < length; j++) {
          yield [i, j]
        }
      }
    }
  }
}

const matchesCoverAllToken = (token: string) => (first: VocabMatch, second: VocabMatch) => {
  const totalMatchLength = first.length + second.length
  return first.start === 0 && second.end === token.length && totalMatchLength === token.length
}
