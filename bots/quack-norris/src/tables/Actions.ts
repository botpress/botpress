import { Table, z } from '@botpress/runtime'

export const ActionsTable = new Table({
  name: 'ActionsTable',
  keyColumn: 'actionKey',
  columns: {
    actionKey: z.string().describe('Compound key: gameId:round:discordUserId'),
    gameId: z.string().describe('Game ID'),
    round: z.number().describe('Round number'),
    discordUserId: z.string().describe('Discord user ID of the player'),
    actionType: z.enum(['light', 'heavy', 'block', 'rest', 'special', 'forfeit']).describe('Action type'),
    targetUserId: z.string().optional().describe('Target Discord user ID'),
  },
})
