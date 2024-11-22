import type * as sdk from '@botpress/sdk'
import * as errors from '../errors'
import * as utils from '../utils'

export const validateBotDefinition = (b: sdk.BotDefinition): void => {
  const { actions, events, states } = b

  const invalidActionNames = _nonCamelCaseKeys(actions ?? {})
  if (invalidActionNames.length) {
    throw new errors.BotpressCLIError(
      `The following action names are not in camelCase: ${invalidActionNames.join(', ')}`
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

  for (const [pluginName, plugin] of Object.entries(b.plugins ?? {})) {
    const dependencies = plugin.definition.integrations ?? {}
    for (const dep of Object.values(dependencies)) {
      if (!_hasDependency(b, dep.definition)) {
        throw new errors.BotpressCLIError(
          `Plugin "${pluginName}" has a dependency on integration "${dep.definition.name}@${dep.definition.version}", but it is not present in the bot definition. Please install it.`
        )
      }
    }
  }
}

const _nonCamelCaseKeys = (obj: Record<string, any>): string[] =>
  Object.keys(obj).filter((k) => !utils.casing.is.camelCase(k))

const _hasDependency = (b: sdk.BotDefinition, dep: { name: string; version: string }): boolean => {
  const integrationEntries = Object.entries(b.integrations ?? {}).map(([_, { definition }]) => definition)

  return integrationEntries.some((integration) => integration.name === dep.name && integration.version === dep.version)
}
