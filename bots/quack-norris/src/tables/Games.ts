import { Table, z } from '@botpress/runtime'

export const GamesTable = new Table({
  name: 'GamesTable',
  keyColumn: 'gameId',
  columns: {
    gameId: z.string().describe('Unique game identifier'),
    channelId: z.string().describe('Discord channel where the game runs'),
    pollMessageId: z.string().optional().describe('Registration poll message ID'),
    phase: z.enum(['registration', 'classSelection', 'combat', 'finished']).describe('Current game phase'),
    round: z.number().default(0).describe('Current combat round'),
    quackeningAppliedRound: z.number().default(0).describe('Latest round where Quackening damage was applied'),
    chaosEvent: z.string().optional().describe('Active chaos event name for this round'),
    players: z
      .array(
        z.object({
          discordUserId: z.string(),
          name: z.string(),
          hp: z.number().default(100),
          maxHp: z.number().default(100),
          energy: z.number().default(100),
          maxEnergy: z.number().default(100),
          alive: z.boolean().default(true),
          duckClass: z
            .enum(['mallardNorris', 'quackdini', 'sirQuacksALot', 'drQuackenstein'])
            .optional()
            .describe('Selected duck class'),
          statusEffects: z
            .array(
              z.object({
                type: z.enum([
                  'poison',
                  'inspired',
                  'exposed',
                  'shielded',
                  'decoy',
                  'resting',
                  'blessed',
                  'damageBoost',
                  'dodgeAll',
                ]),
                turnsLeft: z.number(),
                stacks: z.number().optional(),
                sourceId: z.string().optional(),
              })
            )
            .default([])
            .describe('Active status effects'),
          specialCooldown: z.number().default(0).describe('Rounds until special ability is available'),
          consecutiveTargetId: z.string().optional().describe('Last targeted player for combo tracking'),
          consecutiveHits: z.number().default(0).describe('Consecutive hits on same target'),
        })
      )
      .default([])
      .describe('Players in the game'),
    actions: z
      .array(
        z.object({
          discordUserId: z.string(),
          type: z.enum(['light', 'heavy', 'block', 'rest', 'special', 'forfeit']),
          targetUserId: z.string().optional(),
        })
      )
      .default([])
      .describe('Actions submitted for the current round'),
    winnerId: z.string().optional().describe('Discord user ID of the winner'),
  },
})
