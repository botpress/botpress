import { convertToRealSpaces, isWord } from '../tools/token-utils'
import { getClosestSpellingToken } from '../tools/vocab'
import { Tools } from '../typings'

function isClosestTokenValid(originalToken: string, closestToken: string): boolean {
  return isWord(closestToken) && originalToken.length > 3 && closestToken.length > 3
}

const makeSpellChecker = (vocab: string[], lang: string, tools: Tools) => async (text: string) => {
  const [raw_tokens] = await tools.tokenize_utterances([text], lang, vocab)

  return raw_tokens
    .map(convertToRealSpaces)
    .map(token => {
      const strTok = token.toLowerCase()
      if (!isWord(token) || vocab.includes(strTok)) {
        return token
      }

      const closestToken = getClosestSpellingToken(strTok, vocab)
      if (isClosestTokenValid(token, closestToken)) {
        return closestToken
      }

      return token
    })
    .join('')
}
export default makeSpellChecker
