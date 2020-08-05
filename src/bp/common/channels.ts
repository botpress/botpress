import sdk from 'botpress/sdk'
import { isArray } from 'lodash'

export const isValidOutgoingType = (type: string) => {
  return ['text', 'image', 'carousel'].includes(type)
}

/** Returns the list of options from either buttons or dropdown (if dropdown is not supported) */
export const getPayloadOptions = (payload: sdk.Content.All): sdk.Option[] | undefined => {
  const { __buttons, __dropdown } = payload.metadata ?? {}
  const dropdown = isArray(__dropdown) ? (__dropdown as sdk.Option[]) : __dropdown?.options

  return __buttons ?? dropdown
}

export const parseTyping = typing => {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}
