import _ from 'lodash'

import { Sequence, Token } from '../../typings'

// TODO replace sequence by utterance type once implemented
export function labelizeUtterance(utterance: Sequence): string[] {
  return utterance.tokens.map(labelizeToken)
}

function labelizeToken(token: Token): string {
  if (!token.slot) {
    return token.tag
  }

  const any = _.isEmpty(token.matchedEntities) ? '/any' : ''
  return `${token.tag}-${token.slot}${any}`
}
