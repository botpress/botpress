import {
  Activity,
  ConversationReference,
  BotFrameworkAdapter,
  CardFactory,
  CardAction,
  ActionTypes,
  Attachment,
  MessageFactory,
} from 'botbuilder'
import '@botpress/client'
import * as botpress from '.botpress'

type Messages = botpress.Integration['channels']['channel']['messages']
type MessageTypes = keyof Messages
type RenderProps = Parameters<Messages[MessageTypes]>[0]

type TeamsConfig = botpress.configuration.Configuration

type Choice = botpress.channels.channel.choice.Choice
type Alternative = Choice['options'][number]

type Card = botpress.channels.channel.card.Card
type Action = Card['actions'][number]
type ActionType = Action['action']

const getAdapter = (config: TeamsConfig) =>
  new BotFrameworkAdapter({
    channelAuthTenant: config.tenantId,
    appId: config.appId,
    appPassword: config.appPassword,
  })

const renderTeams = async ({ ctx, ack, conversation, client }: RenderProps, activity: Partial<Activity>) => {
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
      console.warn('No activity id found')
      return
    }

    await turnContext.sendActivity(activity)
    await ack({ tags: { ['teams:id']: turnContext.activity.id } })
  })
}

const mapActionType = (action: ActionType): ActionTypes => {
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

const mapAction = (action: Action): CardAction => ({
  type: mapActionType(action.action),
  title: action.label,
  value: action.value,
  text: action.label,
  displayText: action.label,
})

const mapChoice = (choice: Alternative): CardAction => ({
  type: ActionTypes.MessageBack,
  title: choice.label,
  displayText: choice.label,
  value: choice.value,
  text: choice.label,
})

const makeCard = (card: Card): Attachment => {
  const { actions, imageUrl, subtitle, title } = card
  const buttons: CardAction[] = actions.map(mapAction)
  const images = imageUrl ? [{ url: imageUrl }] : []
  return CardFactory.heroCard(title, images, buttons, { subtitle })
}

const channel = {
  messages: {
    text: async (props) => {
      const activity: Partial<Activity> = { type: 'message', text: props.payload.text }
      await renderTeams(props, activity)
    },
    image: async (props) => {
      const { imageUrl } = props.payload
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [CardFactory.heroCard('', [{ url: imageUrl }])],
      }
      await renderTeams(props, activity)
    },
    markdown: async (props) => {
      const { markdown } = props.payload
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [
          CardFactory.adaptiveCard({
            body: [
              {
                type: 'TextBlock',
                text: markdown,
              }, // documentation here https://learn.microsoft.com/en-us/adaptive-cards/authoring-cards/text-features
            ],
          }),
        ],
      }
      await renderTeams(props, activity)
    },
    audio: async (props) => {
      const { audioUrl } = props.payload
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [CardFactory.audioCard('', [{ url: audioUrl }])],
      }
      await renderTeams(props, activity)
    },
    video: async (props) => {
      const { videoUrl } = props.payload
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [CardFactory.videoCard('', [{ url: videoUrl }])],
      }
      await renderTeams(props, activity)
    },
    file: async (props) => {
      const { fileUrl } = props.payload
      const activity: Partial<Activity> = { type: 'message', text: fileUrl }
      await renderTeams(props, activity)
    },
    location: async (props) => {
      const { latitude, longitude } = props.payload
      const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      const activity: Partial<Activity> = { type: 'message', text: googleMapsLink }
      await renderTeams(props, activity)
    },
    carousel: async (props) => {
      const { items } = props.payload
      const activity = MessageFactory.carousel(items.map(makeCard))
      await renderTeams(props, activity)
    },
    card: async (props) => {
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [makeCard(props.payload)],
      }
      await renderTeams(props, activity)
    },
    choice: async (props) => {
      const { options, text } = props.payload
      const buttons: CardAction[] = options.map(mapChoice)
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [CardFactory.heroCard(text, [], buttons)],
      }
      await renderTeams(props, activity)
    },
    dropdown: async (props) => {
      // TODO: actually implement a dropdown and not a choice
      //       requires:
      //           - a submit button text
      //           - a dropdown placeholder
      //           - patience to mess around with adaptive cards

      const { options, text } = props.payload
      const buttons: CardAction[] = options.map(mapChoice)
      const activity: Partial<Activity> = {
        type: 'message',
        attachments: [CardFactory.heroCard(text, [], buttons)],
      }
      await renderTeams(props, activity)
    },
  },
} satisfies botpress.IntegrationProps['channels']['channel']

export const channels = {
  channel,
} satisfies botpress.IntegrationProps['channels']
