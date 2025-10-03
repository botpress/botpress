import * as sdk from '@botpress/sdk'
import { actions as subscriberActions } from './subscriber'

export const actions = {
  ...subscriberActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
