import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getZendeskClient } from './client'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

class Tags<T extends Record<string, string>> {
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

const wrapChannel = bpCommon.createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    ticketId: ({ conversation, logger }) => Tags.of(conversation, logger).get('id'),
    zendeskAuthorId: async ({ client, logger, payload, user }) =>
      Tags.of((await client.getUser({ id: payload.userId ?? user.id })).user, logger).get('id'),
    zendeskClient: ({ ctx }) => getZendeskClient(ctx.configuration),
  },
})

export default {
  hitl: {
    messages: {
      text: wrapChannel(
        { channelName: 'hitl', messageType: 'text' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.text
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      image: wrapChannel(
        { channelName: 'hitl', messageType: 'image' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.imageUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.audioUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.videoUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.fileUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      bloc: wrapChannel(
        { channelName: 'hitl', messageType: 'bloc' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          for (const item of payload.items) {
            switch (item.type) {
              case 'text':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.text)
                break
              case 'markdown':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.markdown)
                break
              case 'image':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.imageUrl)
                break
              case 'video':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.videoUrl)
                break
              case 'audio':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.audioUrl)
                break
              case 'file':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.fileUrl)
                break
              case 'location':
                const { title, address, latitude, longitude } = item.payload
                const messageParts = []

                if (title) {
                  messageParts.push(title, '')
                }
                if (address) {
                  messageParts.push(address, '')
                }
                messageParts.push(`Latitude: ${latitude}`, `Longitude: ${longitude}`)

                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, messageParts.join('\n'))
                break
              default:
                item satisfies never
            }
          }

          await ack({ tags: {} })
        }
      ),
    },
  },
} satisfies bp.IntegrationProps['channels']
