import { RuntimeError } from '@botpress/client'
import { ReplyToConversationMessageType } from 'intercom-client'
import { getAuthenticatedIntercomClient } from './auth'
import * as html from './html.utils'
import * as types from './types'
import * as bp from '.botpress'

type Card = bp.channels.channel.card.Card
type Location = bp.channels.channel.location.Location

export const channels: bp.IntegrationProps['channels'] = {
  channel: {
    messages: {
      text: async ({ payload, conversation, ack, client, ctx }) => {
        await sendMessage({
          body: payload.text,
          conversation,
          client,
          ctx,
          ack,
        })
      },
      image: async ({ payload, client, ctx, conversation, ack }) => {
        await sendMessage({
          body: '',
          conversation,
          client,
          ctx,
          ack,
          attachmentUrls: [payload.imageUrl],
        })
      },
      audio: async ({ client, ctx, conversation, ack, payload }) => {
        await sendMessage({
          body: '',
          conversation,
          client,
          ctx,
          ack,
          attachmentUrls: [payload.audioUrl],
        })
      },
      video: async ({ client, ctx, conversation, ack, payload }) => {
        await sendMessage({
          body: '',
          conversation,
          client,
          ctx,
          ack,
          attachmentUrls: [payload.videoUrl],
        })
      },
      file: async ({ client, ctx, conversation, ack, payload }) => {
        await sendMessage({
          body: '',
          conversation,
          client,
          ctx,
          ack,
          attachmentUrls: [payload.fileUrl],
        })
      },
      location: async ({ client, ctx, conversation, ack, payload }) => {
        await sendMessage({
          body: formatGoogleMapLink(payload),
          conversation,
          client,
          ctx,
          ack,
        })
      },
      carousel: async ({ client, ctx, conversation, ack, payload }) => {
        const carousel = payload.items.map((card) => createCard(card)).join('')

        await sendMessage({
          body: carousel,
          conversation,
          client,
          ctx,
          ack,
        })
      },
      card: async ({ client, ctx, conversation, ack, payload }) => {
        await sendMessage({
          body: createCard(payload),
          conversation,
          client,
          ctx,
          ack,
        })
      },
      dropdown: async ({ client, ctx, conversation, ack, payload }) => {
        const choices = payload.options.map((choice) => html.li(choice.value))

        const message = composeMessage(
          html.p(payload.text),
          html.p('Type one of the following options:'),
          choices.length > 0 ? html.ol(choices.join('')) : ''
        )

        await sendMessage({
          body: message,
          conversation,
          client,
          ctx,
          ack,
        })
      },
      choice: async ({ client, ctx, conversation, ack, payload }) => {
        const choices = payload.options.map((choice) => html.li(choice.value))

        const message = composeMessage(
          html.p(payload.text),
          html.p('Type one of the following options:'),
          choices.length > 0 ? html.ol(choices.join('')) : ''
        )

        await sendMessage({
          body: message,
          conversation,
          client,
          ctx,
          ack,
        })
      },
      bloc: () => {
        throw new RuntimeError('Not implemented')
      },
    },
  },
}

async function sendMessage(
  props: Pick<types.MessageHandlerProps, 'conversation' | 'client' | 'ctx' | 'ack'> & {
    body: string
    attachmentUrls?: string[]
  }
) {
  const { body, attachmentUrls, client, ctx, conversation, ack } = props
  const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  const { adminId } = state.payload

  const intercomClient = await getAuthenticatedIntercomClient(client, ctx)

  const {
    conversation_parts: { conversation_parts: conversationParts },
  } = await intercomClient.conversations.replyByIdAsAdmin({
    id: conversation.tags.id ?? '',
    adminId,
    messageType: ReplyToConversationMessageType.COMMENT,
    body,
    attachmentUrls,
  })

  const lastMessageId = conversationParts.at(-1)?.id
  await ack({ tags: { id: lastMessageId } })
}

function composeMessage(...parts: string[]) {
  return parts.join('')
}

function createCard({ title, subtitle, imageUrl, actions }: Card) {
  const image = imageUrl ? html.img(imageUrl) : ''
  const text = html.b(title) + html.p(subtitle ? subtitle : '')

  const links = actions.filter((item) => item.action === 'url').map((item) => html.li(html.a(item.value, item.label)))

  const choices = actions
    .filter((item) => item.action !== 'url')
    .map((item) => html.li(item.value))
    .join('')

  return composeMessage(
    image,
    text,
    links.length > 0 ? html.ul(links.join('')) : '',
    html.p('Type one of the following options:'),
    html.ol(choices)
  )
}

function formatGoogleMapLink(payload: Location) {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}
