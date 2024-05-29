import type * as sdk from '@botpress/sdk'
import * as errors from '../errors'
import * as utils from '../utils'

export const validateIntegrationDefinition = (i: sdk.IntegrationDefinition): void => {
  const { actions, channels, events, states, interfaces } = i

  const interfaceActions: Record<string, sdk.ActionDefinition> = interfaces.reduce(
    (acc, i) => ({
      ...acc,
      ...utils.records.mapKeys(i.actions, (_, actionName) => (i.prefix ? `${i.prefix}${actionName}` : actionName)),
    }),
    {}
  )

  const interfaceEvents: Record<string, sdk.EventDefinition> = interfaces.reduce(
    (acc, i) => ({
      ...acc,
      ...utils.records.mapKeys(i.events, (_, eventName) => (i.prefix ? `${i.prefix}${eventName}` : eventName)),
    }),
    {}
  )

  const allActions = { ...(actions ?? {}), ...interfaceActions }
  const invalidActionNames = _nonCamelCaseKeys(allActions)
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

  const allEvents = { ...(events ?? {}), ...interfaceEvents }
  const invalidEventNames = _nonCamelCaseKeys(allEvents)
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
