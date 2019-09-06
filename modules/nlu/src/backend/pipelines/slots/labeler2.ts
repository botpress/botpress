import _ from 'lodash'

import { Utterance } from '../../engine2'
import { BIO } from '../../typings'

export function labelizeUtterance(utterance: Utterance): string[] {
  return utterance.tokens.map(token => {
    if (_.isEmpty(token.slots)) {
      return BIO.OUT
    }

    const slot = token.slots[0]
    const tag = slot.startTokenIdx === token.index ? BIO.BEGINNING : BIO.INSIDE
    const any = _.isEmpty(token.entities) ? '/any' : ''

    return `${tag}-${slot.name}${any}`
  })
}
