import type * as sdk from '@botpress/sdk'
import * as errors from '../errors'
import * as utils from '../utils'

export const validateIntegrationDefinition = (i: sdk.IntegrationDefinition): void => {
  const { actions, channels, events, states } = i

  const invalidActionNames = _nonCamelCaseKeys(actions ?? {})
  if (invalidActionNames.length) {
    throw new errors.BotpressCLIError(
      `The following action names are not in camelCase: ${invalidActionNames.join(', ')}`
    )
  }

  const invalidChannelNames = _nonCamelCaseKeys(channels ?? {})
  if (invalidChannelNames.length) {
    throw new errors.BotpressCLIError(
      `The following channel names are not in camelCase: ${invalidChannelNames.join(', ')}`
    )
  }

  const invalidMessageNames = Object.entries(channels ?? {}).flatMap(([channelName, channel]) =>
    _nonCamelCaseKeys(channel.messages ?? {}).map((message) => `${channelName}.${message}`)
  )
  if (invalidMessageNames.length) {
    throw new errors.BotpressCLIError(
      `The following message names are not in camelCase: ${invalidMessageNames.join(', ')}`
    )
  }

  const invalidEventNames = _nonCamelCaseKeys(events ?? {})
  if (invalidEventNames.length) {
    throw new errors.BotpressCLIError(`The following event names are not in camelCase: ${invalidEventNames.join(', ')}`)
  }

  const invalidStateNames = _nonCamelCaseKeys(states ?? {})
  if (invalidStateNames.length) {
    throw new errors.BotpressCLIError(`The following state names are not in camelCase: ${invalidStateNames.join(', ')}`)
  }
}

const _nonCamelCaseKeys = (obj: Record<string, any>): string[] =>
  Object.keys(obj).filter((k) => !utils.casing.is.camelCase(k))
