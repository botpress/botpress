import { RuntimeError } from '@botpress/client'
import { Markup, Telegraf } from 'telegraf'
import { stdMarkdownToTelegramHtml } from './markdown-to-telegram-html'
import { ackMessage, getChat, sendCard } from './utils'
import * as bp from '.botpress'

export type MessageHandlerProps<T extends keyof bp.MessageProps['channel']> = bp.MessageProps['channel'][T]

export const handleTextMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'text'>) => {
  const { text } = payload
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending markdown message to Telegram chat ${chat}:`, text)
  const { html } = stdMarkdownToTelegramHtml(text)
  // TODO: Implement extracted data
  const message = await client.telegram.sendMessage(chat, html, {
    parse_mode: 'HTML',
  })
  await ackMessage(message, ack)
}

export const handleImageMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'image'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending image message to Telegram chat ${chat}`, payload.imageUrl)
  const message = await client.telegram.sendPhoto(chat, payload.imageUrl)
  await ackMessage(message, ack)
}

export const handleAudioMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'audio'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending audio voice to Telegram chat ${chat}:`, payload.audioUrl)
  try {
    const message = await client.telegram.sendVoice(chat, payload.audioUrl, { caption: payload.caption })
    await ackMessage(message, ack)
  } catch {
    // If the audio file is too large to be voice, Telegram should send it as an audio file, but if for some reason it doesn't, we can send it as an audio file
    const message = await client.telegram.sendAudio(chat, payload.audioUrl, { caption: payload.caption })
    await ackMessage(message, ack)
  }
}

export const handleVideoMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'video'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending video message to Telegram chat ${chat}:`, payload.videoUrl)
  const message = await client.telegram.sendVideo(chat, payload.videoUrl)
  await ackMessage(message, ack)
}

export const handleFileMessage = async ({ payload, ctx, conversation, ack, logger }: MessageHandlerProps<'file'>) => {
  const client = new Telegraf(ctx.configuration.botToken)
  const chat = getChat(conversation)
  logger.forBot().debug(`Sending file message to Telegram chat ${chat}:`, payload.fileUrl)
  const message = await client.telegram.sendDocument(chat, payload.fileUrl)
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
  const message = await client.telegram.sendLocation(chat, payload.latitude, payload.longitude)
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
  const message = await client.telegram.sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
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
  const message = await client.telegram.sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
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
