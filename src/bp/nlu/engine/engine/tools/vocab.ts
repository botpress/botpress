import _ from 'lodash'

import { Token2Vec } from '../typings'

import { euclideanDistance } from './math'
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

export function getClosestSpellingToken(token: string, vocab: string[]): string {
  let closestTok = ''
  let dist = Number.POSITIVE_INFINITY
  for (const candidateTok of vocab) {
    // Leveinshtein is for typo detection
    const lev = damerauLevenshtein(token, candidateTok)
    const maxLevOps = getMaxLevOps(token, candidateTok)
    if (lev <= maxLevOps && lev < dist) {
      dist = lev
      closestTok = candidateTok
    }
  }
  return closestTok
}

export function getClosestMeaningToken(tokenVec: number[], token2Vec: Token2Vec): string {
  let closestTok = ''
  let dist = Number.POSITIVE_INFINITY
  for (const [candidateTok, candidateVec] of Object.entries(token2Vec)) {
    const d = euclideanDistance(<number[]>tokenVec, candidateVec)
    if (d < dist) {
      closestTok = candidateTok
      dist = d
    }
  }
  return closestTok
}
