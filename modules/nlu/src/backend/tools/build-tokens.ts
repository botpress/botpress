import _ from 'lodash'

import { Token } from '../typings'
import { sanitize } from '../pipelines/language/sanitizer'

export const buildTokens = (stringTokens: string[], text: string) => {
  return stringTokens.map(token => {
    const sanitized = sanitize(token)
    const start = text.indexOf(sanitized) // problem if more then one occurence :(
    return {
      value: token,
      sanitized,
      start,
      end: start + sanitized.length - 1,
      matchedEntities: []
    } as Token
  })
}

// const reduceTokens = (currentTokens: Token[], token: string, text: string) => {
//   const sanitized = sanitize(token)

//   if (currentTokens.map(t => t.sanitized).includes(sanitized)) {
//     return currentTokens
//   }

//   const regexp = new RegExp(sanitized)
//   let match = regexp.exec(text)
//   while (!!match) {
//     const start = match.index
//     const newToken = {
//       value: token,
//       sanitized,
//       start,
//       end: start + sanitized.length - 1,
//       matchedEntities: []
//     }
//     currentTokens.push(newToken)
//     match = regexp.exec(text)
//   }

//   return currentTokens
// }
