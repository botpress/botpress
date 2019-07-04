import _ from 'lodash'

import { Token } from '../typings'
import { sanitize } from '../pipelines/language/sanitizer'

export const makeTokenObjects = (stringTokens: string[], text: string) => {
  return _.reduce(stringTokens, (ac, cu) => reduceTokens(ac, cu, text), [] as Token[])
}

const reduceTokens = (currentTokens: Token[], token: string, text: string) => {
  let tokenWithSpace = token.replace('\u2581', ' ').trim()

  const previousToken = currentTokens[currentTokens.length - 1]
  const cursor = previousToken ? previousToken.end : 0

  text = text.substring(cursor)

  const start = text.indexOf(tokenWithSpace) + cursor

  const newToken = {
    value: token,
    sanitized: sanitize(token),
    start,
    end: start + tokenWithSpace.length,
    matchedEntities: []
  } as Token

  currentTokens.push(newToken)

  return currentTokens
}
