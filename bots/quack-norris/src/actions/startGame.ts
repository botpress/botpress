import { Action, z, actions } from '@botpress/runtime'
import { randomUUID } from 'crypto'
import { GamesTable } from '../tables/Games'

export const startGame = new Action({
  name: 'startGame',
  description: 'Create a new RPG game session with a registration poll',

  input: z.object({
    channelId: z.string().describe('Discord channel ID to create the game in'),
  }),

  output: z.object({
    gameId: z.string(),
    pollMessageId: z.string(),
  }),

  async handler({ input }) {
    const gameId = `game_${randomUUID()}`

    const { messageId } = await actions.discord.createPoll({
      channelId: input.channelId,
      question: 'The Quacktament calls for warriors! Vote to enter the Arena of Mallard Destiny!',
      answers: [{ text: 'Enter the Quacktament!' }],
      duration: 1,
      allowMultiselect: false,
    })

    await GamesTable.upsertRows({
      rows: [
        {
          gameId,
          channelId: input.channelId,
          pollMessageId: messageId,
          phase: 'registration',
          round: 0,
          players: [],
          actions: [],
        },
      ],
      keyColumn: 'gameId',
    })

    return { gameId, pollMessageId: messageId }
  },
})
