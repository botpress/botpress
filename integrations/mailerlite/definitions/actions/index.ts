import * as sdk from '@botpress/sdk'
import { actions as groupActions } from './group'
import { actions as subscriberActions } from './subscriber'

export const actions = {
  ...subscriberActions,
  ...groupActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
