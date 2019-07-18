import _ from 'lodash'
import { Token } from '../typings'

const SPACE = '\u2581'

export const makeTokens = (stringTokens: string[], text: string) => {
  return stringTokens.reduce(reduceTokens(text), [] as Token[])
}

const reduceTokens = (text: string) => (currentTokens: Token[], token: string) => {
  const trimedToken = token.replace(SPACE, '')

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

export const mergeSpecialCharactersTokens = (toks: Token[], specialCharacters: string[]) => {
  const isMergeable = ({ value: previous }: Token, { value: current }: Token) => {
    previous = previous.replace(SPACE, '')
    return [previous, current].reduce((ac: boolean, tok: string) => {
      return ac && tokenIsAllMadeOf(tok, specialCharacters)
    }, true)
  }

  return mergeTokens(toks, isMergeable)
}

function tokenIsAllMadeOf(tok: string, chars: string[]) {
  const tokenChars = tok.split('')

  // check if A is fully included in B
  // return (A ∩ B) xor A === Ø
  const intersection = _.intersection(tokenChars, chars)
  return !_.xor(intersection, tokenChars).length
}

export const mergeTokens = (toks: Token[], isMergeable: (previous: Token, current: Token) => boolean) => {
  const merge = toks.map((current: Token, index: number) => {
    const previous = toks[index - 1]
    return !!(previous && isMergeable(previous, current))
  })

  return _.zip(toks, merge).reduce(
    (acc: Token[], cu: [Token?, boolean?]) => {
      const [currentToken, isCurrentMergeable] = cu
      const previousToken = _.last(acc)

      if (previousToken && isCurrentMergeable) {
        const newToken = {
          value: previousToken!.value + currentToken!.value,
          cannonical: previousToken!.cannonical + currentToken!.cannonical,
          start: previousToken!.start,
          end: currentToken!.end,
          matchedEntities: previousToken!.matchedEntities.concat(currentToken!.matchedEntities)
        }
        return _.dropRight(acc).concat(newToken)
      }
      return acc.concat(currentToken!)
    },
    [] as Token[]
  ) as Token[]
}
