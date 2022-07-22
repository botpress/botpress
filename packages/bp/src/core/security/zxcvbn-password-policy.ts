import { zxcvbn, zxcvbnOptions, ZxcvbnResult } from '@zxcvbn-ts/core'
import zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import zxcvbnEnPackage from '@zxcvbn-ts/language-en'
import _ from 'lodash'

export interface ZXCVBNPolicyOptions {
  minScore?: number
  failWhenCommonWordIsDominant: boolean
}

const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary
  }
}

zxcvbnOptions.setOptions(options)

/**
 * Custom password sheriff policy that implements zxcvbn
 * Note: Implemented stricly for our "requireComplexPassword" use case
 * Note: We could use zxcvbn feedback for explain but it seems we don't use the explain feature
 */
export class ZXCVBNPolicy {
  constructor() {}
  validate(options: any) {
    if (!_.isPlainObject(options)) {
      throw new Error('options should be an object')
    }
    if (options.minScore && !(_.isNumber(options.minScore) && _.inRange(options.minScore, 0, 5))) {
      throw new Error('minScore should be a number between 0 and 5')
    }
  }

  private scorePasses(minScore: number = 0, res: ZxcvbnResult) {
    return res.score >= minScore
  }

  /**
   * Fails when there is 2 or less common words and one of the common word is longer or equal than the rest of the candidate
   * check test cases for more details
   */
  private dictPasses(failWhenCommonWordIsDominant: boolean, res: ZxcvbnResult, pwdCandidate: string) {
    if (!failWhenCommonWordIsDominant || res.score === 4) {
      return true
    }

    const dictMatches = res.sequence
      .filter(match => match.pattern === 'dictionary')
      .sort((matchA, matchB) => matchB.token.length - matchA.token.length)

    if (!dictMatches.length || dictMatches.length > 2) {
      return true
    }

    const longestCommonWord = dictMatches[0].token
    return pwdCandidate.replace(longestCommonWord, '').length >= longestCommonWord.length
  }

  assert(options: ZXCVBNPolicyOptions, pwdCandidate: string) {
    const res = zxcvbn(pwdCandidate)

    return (
      this.scorePasses(options.minScore, res) &&
      this.dictPasses(options.failWhenCommonWordIsDominant, res, pwdCandidate)
    )
  }
}
