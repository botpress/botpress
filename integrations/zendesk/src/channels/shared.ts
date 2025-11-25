import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { getZendeskClient } from '../client'
import { getMessagingClient } from '../messaging-client'

type IntegrationLogger = bp.Logger

export class Tags<T extends Record<string, string>> {
  private constructor(
    private _t: { tags: T },
    private _logger: IntegrationLogger
  ) {}

  public static of<T extends Record<string, string>>(t: { tags: T }, logger: IntegrationLogger) {
    return new Tags(t, logger)
  }

  public find(key: keyof T): string | undefined {
    return this._t.tags[key]
  }

  public get(key: keyof T): string {
    const value = this.find(key)
    if (!value) {
      const msg = `Could not find tag ${key as string}`
      this._logger.forBot().error(msg)
      throw new sdk.RuntimeError(`Could not find tag ${key as string}`)
    }
    return value
  }
}

export const wrapChannel = bpCommon.createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    ticketId: ({ conversation, logger }) => Tags.of(conversation, logger).get('id'),
    zendeskAuthorId: async ({ client, logger, payload, user }) => {
      const userId = 'userId' in payload && payload.userId ? payload.userId : user.id
      return Tags.of((await client.getUser({ id: userId })).user, logger).get('id')
    },
    zendeskClient: ({ ctx }) => getZendeskClient(ctx.configuration),
    messagingConversationId: ({ conversation, logger }) => Tags.of(conversation, logger).get('id'),
    messagingClient: ({ ctx }): ReturnType<typeof getMessagingClient> => {
      return getMessagingClient(ctx.configuration)
    },
    messagingAppId: ({ ctx }): string => {
      if (!ctx.configuration.messagingAppId) {
        throw new sdk.RuntimeError('Messaging App ID not configured')
      }
      return ctx.configuration.messagingAppId
    },
  },
})
