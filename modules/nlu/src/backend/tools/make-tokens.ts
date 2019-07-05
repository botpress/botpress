import { sanitize } from '../pipelines/language/sanitizer'
import { Token } from '../typings'

export const makeTokens = (stringTokens: string[], text: string) => {
  return stringTokens.reduce(reduceTokens(text), [] as Token[])
}

const reduceTokens = (text: string) => (currentTokens: Token[], token: string) => {
  const trimedToken = token.replace('\u2581', '')

  const previousToken = currentTokens[currentTokens.length - 1]
  const cursor = previousToken ? previousToken.end : 0

  const cutText = text.substring(cursor).toLowerCase()
  const start = cutText.indexOf(trimedToken) + cursor
  const sanitized = text.substr(start, trimedToken.length)

  const newToken = {
    value: token,
    cannonical: sanitized,
    start,
    end: start + trimedToken.length,
    matchedEntities: []
  } as Token

  return currentTokens.concat(newToken)
}
