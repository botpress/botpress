import _ from 'lodash'

import { ndistance } from '../tools/math'
import { levenshtein } from '../tools/strings'
import { Token2Vec } from '../typings'

function getMaxLevOps(token: string) {
  if (token.length <= 3) {
    return 0
  } else if (token.length <= 4) {
    return 1
  } else if (token.length < 10) {
    return 2
  } else {
    return 3
  }
}

// TODO move this in vocab
export function getClosestToken(
  tokenStr: string,
  tokenVec: number[] | ReadonlyArray<number>,
  token2Vec: Token2Vec,
  useSpacial: boolean = false
): string {
  let token = ''
  let dist = Number.POSITIVE_INFINITY
  _.forEach(token2Vec, (vec, t) => {
    // Leveinshtein is for typo detection
    const lev = levenshtein(tokenStr, t)
    const maxLevOps = getMaxLevOps(tokenStr)
    if (lev <= maxLevOps) {
      dist = lev
      token = t
    }

    // Space (vector) distance is for close-meaning detection
    const d = useSpacial ? ndistance(<number[]>tokenVec, vec) : Number.POSITIVE_INFINITY
    // stricly smaller, we want letter distance to take precedence over spacial
    if (d < dist) {
      token = t
      dist = d
    }
  })
  return token
}
