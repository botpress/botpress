import { RuntimeError } from '@botpress/client'
import { Markup, Telegraf } from 'telegraf'
import { markdownHtmlToTelegramPayloads, stdMarkdownToTelegramHtml } from './markdown-to-telegram-html'
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
    .catch(mapToRuntimeErrorAndThrow)
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

export const handleImageMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'image'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending image message to Telegram chat ${chat}`, payload.imageUrl)
  const message = await client.telegram
    .sendPhoto(chat, payload.imageUrl, {
      caption: payload.caption,
    })
    .catch(mapToRuntimeErrorAndThrow)
  await ackMessage(message, ack)
}

export const handleAudioMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'audio'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending audio voice to Telegram chat ${chat}:`, payload.audioUrl)
  try {
    const message = await client.telegram
      .sendVoice(chat, payload.audioUrl, { caption: payload.caption })
      .catch(mapToRuntimeErrorAndThrow)
    await ackMessage(message, ack)
  } catch {
    // If the audio file is too large to be voice, Telegram should send it as an audio file, but if for some reason it doesn't, we can send it as an audio file
    const message = await client.telegram
      .sendAudio(chat, payload.audioUrl, { caption: payload.caption })
      .catch(mapToRuntimeErrorAndThrow)
    await ackMessage(message, ack)
  }
}

export const handleVideoMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'video'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending video message to Telegram chat ${chat}:`, payload.videoUrl)
  const message = await client.telegram.sendVideo(chat, payload.videoUrl).catch(mapToRuntimeErrorAndThrow)
  await ackMessage(message, ack)
}

export const handleFileMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'file'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending file message to Telegram chat ${chat}:`, payload.fileUrl)
  const message = await client.telegram.sendDocument(chat, payload.fileUrl).catch(mapToRuntimeErrorAndThrow)
  await ackMessage(message, ack)
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
    .catch(mapToRuntimeErrorAndThrow)
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
  payload.items.forEach(async (item) => {
    await sendCard(item, client, chat, ack)
  })
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
    .catch(mapToRuntimeErrorAndThrow)
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
    .catch(mapToRuntimeErrorAndThrow)
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
