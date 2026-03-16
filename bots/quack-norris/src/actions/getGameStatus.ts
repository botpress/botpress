import { Action, z } from '@botpress/runtime'
import { renderPlayerStatus } from '../lib/narration'
import type { Player } from '../lib/types'

export const getGameStatus = new Action({
  name: 'getGameStatus',
  description: 'Get the current status of a game with full class/energy/status details',

  input: z.object({
    gameId: z.string(),
  }),

  output: z.object({
    phase: z.string(),
    round: z.number(),
    players: z.array(
      z.object({
        name: z.string(),
        hp: z.number(),
        maxHp: z.number(),
        energy: z.number(),
        maxEnergy: z.number(),
        alive: z.boolean(),
        duckClass: z.string().optional(),
        specialCooldown: z.number(),
        itemCount: z.number(),
      })
    ),
    winnerId: z.string().optional(),
    formattedStatus: z.string(),
  }),

  async handler({ input }) {
    const { GamesTable } = await import('../tables/Games')
    const { PlayersTable } = await import('../tables/Players')

    const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
    const game = rows[0]
    if (!game) {
      throw new Error(`Game ${input.gameId} not found`)
    }

    // Fetch item counts from player profiles (parallel with partial-failure resilience)
    const itemCounts = new Map<string, number>()
    const profileResults = await Promise.allSettled(
      (game.players as Player[]).map(async (p) => {
        const { rows: profileRows } = await PlayersTable.findRows({
          filter: { discordUserId: p.discordUserId },
          limit: 1,
        })
        return { id: p.discordUserId, profile: profileRows[0] }
      })
    )
    for (const result of profileResults) {
      if (result.status === 'fulfilled') {
        const count =
          result.value.profile?.inventory?.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0) ?? 0
        itemCounts.set(result.value.id, count)
      }
    }

    const players = game.players.map((p: Player) => ({
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
      energy: p.energy,
      maxEnergy: p.maxEnergy,
      alive: p.alive,
      duckClass: p.duckClass,
      specialCooldown: p.specialCooldown,
      itemCount: itemCounts.get(p.discordUserId) ?? 0,
    }))

    const formattedStatus = game.players
      .map((p: Player) => {
        const items = itemCounts.get(p.discordUserId) ?? 0
        const itemTag = items > 0 ? ` | Items: ${items}` : ''
        return `${p.alive ? '❤️' : '💀'} ${renderPlayerStatus(p)}${itemTag}`
      })
      .join('\n\n')

    return {
      phase: game.phase,
      round: game.round,
      players,
      winnerId: game.winnerId,
      formattedStatus: `**Game Status** — Phase: ${game.phase} | Round: ${game.round}\n\n${formattedStatus}`,
    }
  },
})
