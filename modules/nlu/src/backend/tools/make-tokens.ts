import { Token } from '../typings'
import { sanitize } from '../pipelines/language/sanitizer'

export const makeTokenObjects = (stringTokens: string[], text: string) => {
  return stringTokens.reduce(reduceTokens(text), [] as Token[])
}

const reduceTokens = (text: string) => (currentTokens: Token[], token: string) => {
  let tokenWithSpace = token.replace('\u2581', ' ').trim()

  const previousToken = currentTokens[currentTokens.length - 1]
  const cursor = previousToken ? previousToken.end : 0

  const cutText = text.substring(cursor)
  const start = cutText.indexOf(tokenWithSpace) + cursor

  const newToken = {
    value: token,
    sanitized: sanitize(token),
    start,
    end: start + tokenWithSpace.length,
    matchedEntities: []
  } as Token

  return currentTokens.concat(newToken)
}
