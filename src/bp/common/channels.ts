import sdk from 'botpress/sdk'
import { isArray } from 'lodash'

export const isValidOutgoingType = (type: string) => {
  return ['text', 'image', 'carousel'].includes(type)
}

export const parseTyping = typing => {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}
