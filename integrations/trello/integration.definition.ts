import { posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { trelloIdSchema } from 'definitions/schemas'

import { events, actions, channels, user, configuration, entities } from './definitions'

export const INTEGRATION_NAME = 'trello'
export const INTEGRATION_VERSION = '2.1.1'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Trello',
  version: INTEGRATION_VERSION,
  readme: 'hub.md',
  description: 'Update cards, add comments, create new cards, and read board members from your chatbot.',
  icon: 'icon.svg',
  actions,
  channels,
  user,
  configuration,
  events,
  entities,
  secrets: {
    ...posthogHelper.COMMON_SECRET_NAMES,
  },
  /** The states are no longer being used, however, it is
   *  being left in, in order to prevent potential breaking changes.
   *
   *  It should be removed next time we push a major release.
   *  @see https://github.com/botpress/botpress/pull/14849#pullrequestreview-3728680072 For more details. */
  states: {
    // TODO: Remove in next major release (v3.0.0)
    webhook: {
      type: 'integration',
      schema: sdk.z.object({
        trelloWebhookId: trelloIdSchema
          .nullable()
          .default(null)
          .title('Trello Webhook ID')
          .describe('Unique id of the webhook that is created by Trello upon integration registration'),
      }),
    },
  },
})
