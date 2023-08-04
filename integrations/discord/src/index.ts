import { Client } from '@botpress/client'
import { InteractionType, InteractionResponseType } from 'discord-interactions'
import queryString from 'query-string'
import { DiscordClient, commandName } from './discord'
import { Integration } from '.botpress'

const discord = new DiscordClient()

export default new Integration({
  register: async ({ ctx }) => {
    console.log(`Installing Global Commmands for ${ctx.botId}`)
    await discord.installGlobalCommands()
  },
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async () => {},
        image: async () => {},
        markdown: async () => {},
        audio: async () => {},
        video: async () => {},
        file: async () => {},
        location: async () => {},
        carousel: async () => {},
        card: async () => {},
        dropdown: async () => {},
        choice: async () => {},
      },
    },
  },
  handler: async ({ req, ctx, client }) => {
    console.log('here2')
    if (req.path === '/oauth') {
      const query = queryString.parse(req.query)
      const code = query.code

      if (!(code && typeof code === 'string')) {
        throw new Error('invalid code')
      }

      const data = await discord.getAccessToken(code)

      await client.setState({
        type: 'integration',
        id: ctx.integrationId,
        name: 'credentials',
        payload: {
          refreshToken: data.refreshToken,
          accessToken: data.accessToken,
          expiryDate: data.expiryDate.toISOString(),
        },
      })

      return
    }

    if (!discord.verifyRequest(req)) {
      return {
        status: 401,
        body: 'Bad request signature',
      }
    }

    if (!req.body) {
      throw new Error('invalid empty body')
    }

    const { type, data, ...rest } = JSON.parse(req.body)

    console.log(rest)
    console.log(data)

    if (type === InteractionType.PING) {
      return {
        body: JSON.stringify({
          type: InteractionResponseType.PONG,
        }),
      }
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
      console.log('here')
      const { name } = data

      if (name === commandName) {
        return {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          }),
        }
      }
    }

    return
  },
})

type OnChatCommand = {
  client: Client
  userId: string
  channelId: string
  messageId: string
}

export const onChatCommand = ({ client }: OnChatCommand) => {}
