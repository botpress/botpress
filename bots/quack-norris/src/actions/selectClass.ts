import { Action, z } from '@botpress/runtime'
import { DUCK_CLASSES, resolveClassAlias } from '../lib/classes'
import type { Player } from '../lib/types'

export const selectClass = new Action({
  name: 'selectClass',
  description: 'Select a duck class for a player during the class selection phase',

  input: z.object({
    gameId: z.string(),
    discordUserId: z.string(),
    className: z.string().describe('Class name or alias (e.g. "mallard", "trickster", "paladin", "warlock")'),
  }),

  output: z.object({
    success: z.boolean(),
    message: z.string(),
    className: z.string().optional(),
  }),

  async handler({ input }) {
    const { GamesTable } = await import('../tables/Games')

    const duckClass = resolveClassAlias(input.className)
    if (!duckClass) {
      const validNames = Object.values(DUCK_CLASSES)
        .map((c) => c.name)
        .join(', ')
      return { success: false, message: `Unknown class "${input.className}". Valid classes: ${validNames}` }
    }

    const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
    const game = rows[0]

    if (!game) {
      return { success: false, message: `Game ${input.gameId} not found.` }
    }

    if (game.phase !== 'classSelection') {
      return { success: false, message: 'Class selection is not active right now.' }
    }

    const players = [...game.players]
    const playerIndex = players.findIndex((p: Player) => p.discordUserId === input.discordUserId)

    if (playerIndex === -1) {
      return { success: false, message: 'You are not in this game.' }
    }

    const player = players[playerIndex]!
    if (player.duckClass) {
      const existingClass = DUCK_CLASSES[player.duckClass]
      return { success: false, message: `You already picked ${existingClass.name}!` }
    }

    const classDef = DUCK_CLASSES[duckClass]
    const classTaken = players.some((p: Player) => p.duckClass === duckClass)
    if (classTaken) {
      return { success: false, message: `**${classDef.name}** is already taken! Pick another class.` }
    }
    players[playerIndex] = {
      ...player,
      duckClass,
      hp: classDef.maxHp,
      maxHp: classDef.maxHp,
      energy: classDef.maxEnergy,
      maxEnergy: classDef.maxEnergy,
      specialCooldown: 0,
      statusEffects: [],
      consecutiveHits: 0,
    }

    await GamesTable.upsertRows({ rows: [{ ...game, players }], keyColumn: 'gameId' })

    return {
      success: true,
      message: `${player.name} is now a **${classDef.emoji} ${classDef.name}**! ${classDef.description}`,
      className: classDef.name,
    }
  },
})
