import { RuntimeError } from '@botpress/client'
import { Markup, Telegraf, Telegram } from 'telegraf'
import { markdownHtmlToTelegramPayloads, stdMarkdownToTelegramHtml } from './markdown-to-telegram-html'
import { TelegramMessage } from './types'
import { ackMessage, getChat, mapToRuntimeErrorAndThrow, sendCard } from './utils'
import * as bp from '.botpress'

export type MessageHandlerProps<T extends keyof bp.MessageProps['channel']> = bp.MessageProps['channel'][T]

const sendHtmlTextMessage = async (
  client: Telegraf,
  ack: MessageHandlerProps<'text'>['ack'],
  chat: string,
  html: string
) => {
  const message = await client.telegram
    .sendMessage(chat, html, {
      parse_mode: 'HTML',
    })
    .catch(mapToRuntimeErrorAndThrow('Fail to send message'))
  await ackMessage(message, ack)
}

type SendMediaMethod = (
  chatId: number | string,
  media: string,
  extra?: { caption?: string }
) => Promise<TelegramMessage>

const sendContentOrFallback = async <P extends MessageHandlerProps<keyof bp.MessageProps['channel']>>({
  props,
  url,
  send,
  fallback,
}: {
  props: P
  url: string
  send: (telegram: Telegram) => SendMediaMethod
  fallback?: () => Promise<void>
}) => {
  const { ctx, conversation, ack, logger, payload } = props
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  const sendFn = send(client.telegram)
  const opts = 'caption' in payload ? { caption: payload.caption } : undefined
  logger.forBot().debug(`calling ${sendFn.name} to Telegram chat ${chat}: ${url}`)
  let message: TelegramMessage
  try {
    message = await sendFn
      .call(client.telegram, chat, url, opts)
      .catch(mapToRuntimeErrorAndThrow(`Failed to ${sendFn.name}`))
  } catch (err) {
    if (fallback) {
      await fallback()
      return
    }
    logger
      .forBot()
      .warn(
        `Telegram could not send the media using ${sendFn.name}, sending it as a plain text link instead: ${String(err)}`
      )
    const text = opts?.caption ? `${opts.caption}\n${url}` : url
    message = await client.telegram
      .sendMessage(chat, text)
      .catch(mapToRuntimeErrorAndThrow('Fail to send media link fallback'))
  }
  await ackMessage(message, ack)
}

export const handleTextMessage = async (props: MessageHandlerProps<'text'>) => {
  const { payload, ctx, conversation, ack, logger } = props
  const { text } = payload
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending markdown message to Telegram chat ${chat}:`, text)
  const { html, extractedData } = stdMarkdownToTelegramHtml(text)

  if (!extractedData.images || extractedData.images.length === 0) {
    await sendHtmlTextMessage(client, ack, chat, html)
    return
  }

  const payloads = markdownHtmlToTelegramPayloads(html, extractedData.images)

  for (const payload of payloads) {
    if (payload.type === 'text') {
      await sendHtmlTextMessage(client, ack, chat, payload.text)
    } else {
      await handleImageMessage({ ...props, payload: { imageUrl: payload.imageUrl }, type: 'image' })
    }
  }
}

export const handleImageMessage = async (props: MessageHandlerProps<'image'>) => {
  await sendContentOrFallback({
    props,
    url: props.payload.imageUrl,
    send: (t) => t.sendPhoto,
  })
}

export const handleAudioMessage = async (props: MessageHandlerProps<'audio'>) => {
  // If voice fails, retry as audio; if that also fails, fall back to a plain text link.
  await sendContentOrFallback({
    props,
    url: props.payload.audioUrl,
    send: (t) => t.sendVoice,
    fallback: () =>
      sendContentOrFallback({
        props,
        url: props.payload.audioUrl,
        send: (t) => t.sendAudio,
      }),
  })
}

export const handleVideoMessage = async (props: MessageHandlerProps<'video'>) => {
  await sendContentOrFallback({
    props,
    url: props.payload.videoUrl,
    send: (t) => t.sendVideo,
  })
}

export const handleFileMessage = async (props: MessageHandlerProps<'file'>) => {
  await sendContentOrFallback({
    props,
    url: props.payload.fileUrl,
    send: (t) => t.sendDocument,
  })
}

export const handleLocationMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'location'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending location message to Telegram chat ${chat}:`, {
    latitude: payload.latitude,
    longitude: payload.longitude,
  })
  const message = await client.telegram
    .sendLocation(chat, payload.latitude, payload.longitude)
    .catch(mapToRuntimeErrorAndThrow('Fail to send location'))
  await ackMessage(message, ack)
}

export const handleCardMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'card'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending card message to Telegram chat ${chat}:`, payload)
  await sendCard(payload, client, chat, ack)
}

export const handleCarouselMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'carousel'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending carousel message to Telegram chat ${chat}:`, payload)
  for (const item of payload.items) {
    await sendCard(item, client, chat, ack)
  }
}

export const handleDropdownMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'dropdown'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
  logger.forBot().debug(`Sending dropdown message to Telegram chat ${chat}:`, payload)
  const message = await client.telegram
    .sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
    .catch(mapToRuntimeErrorAndThrow('Fail to send message'))
  await ackMessage(message, ack)
}

export const handleChoiceMessage = async ({
  payload,
  ctx,
  conversation,
  ack,
  logger,
}: MessageHandlerProps<'choice'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending choice message to Telegram chat ${chat}:`, payload)
  const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
  const message = await client.telegram
    .sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
    .catch(mapToRuntimeErrorAndThrow('Fail to send message'))
  await ackMessage(message, ack)
}

export const handleBlocMessage = async ({
  client,
  payload,
  ctx,
  conversation,
  ...rest
}: MessageHandlerProps<'bloc'>) => {
  if (payload.items.length > 20) {
    throw new RuntimeError('Telegram only allows 20 messages to be sent every 60 seconds')
  }

  for (const item of payload.items) {
    switch (item.type) {
      case 'text':
        await handleTextMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'image':
        await handleImageMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'audio':
        await handleAudioMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'video':
        await handleVideoMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'file':
        await handleFileMessage({ ...rest, type: item.type, client, payload: item.payload, ctx, conversation })
        break
      case 'location':
        await handleLocationMessage({
          ...rest,
          type: item.type,
          client,
          payload: item.payload,
          ctx,
          conversation,
        })
        break
      default:
        // @ts-ignore
        throw new RuntimeError(`Unsupported message type: ${item?.type ?? 'Unknown'}`)
    }
  }
}
