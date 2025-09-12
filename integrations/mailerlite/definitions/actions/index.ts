import * as sdk from '@botpress/sdk'
import { actions as subscriberActions } from './subscriber'
import { actions as groupActions } from './group'

export const actions = {
  ...subscriberActions,
  ...groupActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
