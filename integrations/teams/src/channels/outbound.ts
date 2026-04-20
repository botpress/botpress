import { RuntimeError } from '@botpress/client'
import {
  Activity,
  ConversationReference,
  CardFactory,
  CardAction,
  ActionTypes,
  Attachment,
  MessageFactory,
} from 'botbuilder'
import { transformMarkdownToTeamsXml } from '../markdown/markdown-to-teams-xml'
import { getAdapter } from '../utils'
import { DROPDOWN_VALUE_ID, DROPDOWN_VALUE_KIND } from './constants'
import * as bp from '.botpress'

type MessageHandlerProps<T extends keyof bp.MessageProps['channel']> = bp.MessageProps['channel'][T]

type ChoicePayload = MessageHandlerProps<'choice'>['payload']
type ChoiceOption = ChoicePayload['options'][number]
type DropdownPayload = MessageHandlerProps<'dropdown'>['payload']
type DropdownOption = DropdownPayload['options'][number]

type BotpressCard = bp.channels.channel.card.Card
type Action = BotpressCard['actions'][number]
type ActionType = Action['action']

// ====== Message Channel Helpers ======

const _renderTeams = async (
  { ctx, ack, conversation, client, logger }: bp.AnyMessageProps,
  activity: Partial<Activity>
) => {
  const { configuration } = ctx
  const adapter = getAdapter(configuration)

  const stateRes = await client.getState({
    id: conversation.id,
    name: 'conversation',
    type: 'conversation',
  })
  const { state } = stateRes
  const convRef = state.payload as ConversationReference

  await adapter.continueConversation(convRef, async (turnContext) => {
    if (!turnContext.activity.id) {
      logger.forBot().warn('No activity id found')
      return
    }

    await turnContext.sendActivity(activity)
    await ack({ tags: { id: turnContext.activity.id } })
  })
}

const _mapActionType = (action: ActionType): ActionTypes => {
  if (action === 'postback') {
    return ActionTypes.MessageBack
  }
  if (action === 'say') {
    return ActionTypes.MessageBack
  }
  if (action === 'url') {
    return ActionTypes.OpenUrl
  }
  return ActionTypes.MessageBack
}

const _mapAction = (action: Action): CardAction => ({
  type: _mapActionType(action.action),
  title: action.label,
  value: action.value,
  text: action.label,
  displayText: action.label,
})

const _mapChoice = (choice: ChoiceOption): CardAction => ({
  type: ActionTypes.MessageBack,
  title: choice.label,
  displayText: choice.label,
  value: choice.value,
  text: choice.label,
})

const _makeCard = (card: BotpressCard): Attachment => {
  const { actions, imageUrl, subtitle, title } = card
  const buttons: CardAction[] = actions.map(_mapAction)
  const images = imageUrl ? [{ url: imageUrl }] : []
  return CardFactory.heroCard(title, images, buttons, { subtitle })
}

const _distinctByValue = (choice: { value: string }, index: number, arr: { value: string }[]): boolean => {
  return arr.findIndex((otherChoice) => otherChoice.value === choice.value) === index
}

const _makeDropdownCard = (text: string, options: DropdownOption[], logger: bp.Logger): Attachment => {
  const uniqueChoices = options
    .map((option: DropdownOption) => ({
      title: option.label,
      value: option.value,
    }))
    // Hotfix: This exists because some client's code was
    // duplicating the options everytime the workflow was ran
    .filter(_distinctByValue)

  if (uniqueChoices.length < options.length) {
    // Normally, it's not the responsibility of the integration
    // to warn the user of issues in their workflow.
    logger
      .forBot()
      .warn(
        `The dropdown options contained duplicates (This is likely due to a misconfiguration in the bot workflow).\nReduced from ${options.length} to ${uniqueChoices.length} unique options.`
      )
  }

  return CardFactory.adaptiveCard({
    // documentation here https://learn.microsoft.com/en-us/adaptive-cards/authoring-cards/text-features
    body: [
      {
        type: 'TextBlock',
        text,
        wrap: true,
        weight: 'Bolder',
      },
      {
        id: DROPDOWN_VALUE_ID,
        type: 'Input.ChoiceSet',
        placeholder: 'Select...',
        style: 'compact',
        choices: uniqueChoices,
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Submit',
        data: { kind: DROPDOWN_VALUE_KIND },
      },
    ],
  })
}

// ====== Message Channel Handlers ======

const _handleTextMessage = async (props: MessageHandlerProps<'text'>) => {
  const { text } = props.payload
  const xml = transformMarkdownToTeamsXml(text)
  const activity: Partial<Activity> = {
    type: 'message',
    textFormat: 'xml',
    text: xml,
  }
  await _renderTeams(props, activity)
}

const _handleImageMessage = async (props: MessageHandlerProps<'image'>) => {
  const { imageUrl } = props.payload
  const activity: Partial<Activity> = {
    type: 'message',
    attachments: [CardFactory.heroCard('', [{ url: imageUrl }])],
  }
  await _renderTeams(props, activity)
}

const _handleAudioMessage = async (props: MessageHandlerProps<'audio'>) => {
  const { audioUrl } = props.payload
  const activity: Partial<Activity> = {
    type: 'message',
    attachments: [CardFactory.audioCard('', [{ url: audioUrl }])],
  }
  await _renderTeams(props, activity)
}

const _handleVideoMessage = async (props: MessageHandlerProps<'video'>) => {
  const { videoUrl } = props.payload
  const activity: Partial<Activity> = {
    type: 'message',
    attachments: [CardFactory.videoCard('', [{ url: videoUrl }])],
  }
  await _renderTeams(props, activity)
}

const _handleFileMessage = async (props: MessageHandlerProps<'file'>) => {
  const { fileUrl } = props.payload
  const activity: Partial<Activity> = { type: 'message', text: fileUrl }
  await _renderTeams(props, activity)
}

const _handleLocationMessage = async (props: MessageHandlerProps<'location'>) => {
  const { latitude, longitude } = props.payload
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  const activity: Partial<Activity> = { type: 'message', text: googleMapsLink }
  await _renderTeams(props, activity)
}

const _handleCarouselMessage = async (props: MessageHandlerProps<'carousel'>) => {
  const { items } = props.payload
  const activity = MessageFactory.carousel(items.map(_makeCard))
  await _renderTeams(props, activity)
}

const _handleCardMessage = async (props: MessageHandlerProps<'card'>) => {
  const activity: Partial<Activity> = {
    type: 'message',
    attachments: [_makeCard(props.payload)],
  }
  await _renderTeams(props, activity)
}

const _handleChoiceMessage = async (props: MessageHandlerProps<'choice'>) => {
  const { options, text } = props.payload
  const buttons: CardAction[] = options.map(_mapChoice)
  const activity: Partial<Activity> = {
    type: 'message',
    attachments: [CardFactory.heroCard(text, [], buttons)],
  }
  await _renderTeams(props, activity)
}

const _handleDropdownMessage = async (props: MessageHandlerProps<'dropdown'>) => {
  const { options, text } = props.payload
  const activity: Partial<Activity> = {
    type: 'message',
    attachments: [_makeDropdownCard(text, options, props.logger)],
  }
  await _renderTeams(props, activity)
}

const _handleBlocMessage = async ({ payload, ...rest }: MessageHandlerProps<'bloc'>) => {
  if (payload.items.length > 50) {
    throw new RuntimeError('Teams only allows 50 messages to be sent every 1 second(s)')
  }

  for (const item of payload.items) {
    const messageProps = { ...rest, ...item }
    switch (messageProps.type) {
      case 'text':
        await _handleTextMessage(messageProps)
        continue
      case 'image':
        await _handleImageMessage(messageProps)
        continue
      case 'audio':
        await _handleAudioMessage(messageProps)
        continue
      case 'video':
        await _handleVideoMessage(messageProps)
        continue
      case 'file':
        await _handleFileMessage(messageProps)
        continue
      case 'location':
        await _handleLocationMessage(messageProps)
        continue
      default:
        messageProps satisfies never
        throw new RuntimeError(`Unsupported message type: ${(messageProps as any)?.type ?? 'Unknown'}`)
    }
  }
}

export const channels = {
  channel: {
    messages: {
      text: _handleTextMessage,
      image: _handleImageMessage,
      audio: _handleAudioMessage,
      video: _handleVideoMessage,
      file: _handleFileMessage,
      location: _handleLocationMessage,
      carousel: _handleCarouselMessage,
      card: _handleCardMessage,
      choice: _handleChoiceMessage,
      dropdown: _handleDropdownMessage,
      bloc: _handleBlocMessage,
    },
  },
} satisfies bp.IntegrationProps['channels']
