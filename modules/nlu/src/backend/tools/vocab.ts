import _ from 'lodash'

import { Token2Vec } from '../typings'

import { ndistance } from './math'
import { damerauLevenshtein } from './strings'

function getMaxLevOps(token: string, candidateTok: string) {
  const longestLength = Math.max(token.length, candidateTok.length)
  if (longestLength <= 3) {
    return 0
  } else if (longestLength <= 4) {
    return 1
  } else if (longestLength < 10) {
    return 2
  } else {
    return 3
  }
}

export function getClosestToken(
  tokenStr: string,
  tokenVec: number[] | ReadonlyArray<number>,
  token2Vec: Token2Vec,
  useSpacial: boolean = false
): string {
  let closestTok = ''
  let dist = Number.POSITIVE_INFINITY
  _.forEach(token2Vec, (candidateVec, candidateTok) => {
    // Leveinshtein is for typo detection
    const lev = damerauLevenshtein(tokenStr, candidateTok)
    const maxLevOps = getMaxLevOps(tokenStr, candidateTok)
    if (lev <= maxLevOps && lev < dist) {
      dist = lev
      closestTok = candidateTok
    }

    // Space (vector) distance is for close-meaning detection
    const d = useSpacial ? ndistance(<number[]>tokenVec, candidateVec) : Number.POSITIVE_INFINITY
    // stricly smaller, we want letter distance to take precedence over spacial
    if (d < dist) {
      closestTok = candidateTok
      dist = d
    }
  })
  return closestTok
}
