import { Conversation, z } from '@botpress/runtime'

export const DiscordDm = new Conversation({
  channel: 'discord.dm',

  state: z.object({}),

  async handler({ message, conversation }) {
    if (!message) {
      return
    }

    await conversation.send({
      type: 'text',
      payload: {
        text:
          '*A duck peers through the darkness of your DMs.*\n\n' +
          '**Quack Norris** is a duck-themed RPG played in Discord servers — ' +
          'explore locations, complete quests, fight in tournaments, and uncover the mysteries of The Pond Eternal.\n\n' +
          'All commands work in guild channels. Head to the server and type `!help` to begin your adventure!',
      },
    })
  },
})
