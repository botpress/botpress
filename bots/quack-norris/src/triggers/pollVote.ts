import { Trigger, actions } from '@botpress/runtime'
import type { Player } from '../lib/types'
import { GamesTable } from '../tables/Games'

export const PollVote = new Trigger({
  name: 'pollVote',
  description: 'Register players when they vote on the game registration poll',
  events: ['discord:messagePollVoteAdd'],

  async handler({ event }) {
    const { userId, messageId } = event.payload as { userId: string; messageId: string; guildId: string }

    let playerName = `Player_${userId.slice(-4)}`
    try {
      const member = await actions.discord.getGuildMember({
        guildId: (event.payload as { guildId: string }).guildId,
        userId,
      })
      playerName =
        (member as { nick?: string; user: { username?: string } }).nick ??
        (member as { user: { username?: string } }).user.username ??
        playerName
    } catch {
      // fallback to default name
    }

    const newPlayer = {
      discordUserId: userId,
      name: playerName,
      hp: 100,
      maxHp: 100,
      energy: 100,
      maxEnergy: 100,
      alive: true,
      statusEffects: [],
      specialCooldown: 0,
      consecutiveHits: 0,
    }
    const maxAttempts = 5
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { rows } = await GamesTable.findRows({
        filter: { pollMessageId: messageId, phase: 'registration' },
        limit: 1,
      })
      const game = rows[0]
      if (!game) {
        return
      }

      if (game.players.some((p: Player) => p.discordUserId === userId)) {
        return
      }

      const updatedPlayers = [...game.players, newPlayer]
      await GamesTable.upsertRows({ rows: [{ ...game, players: updatedPlayers }], keyColumn: 'gameId' })

      // Re-read to verify this vote was not lost by a concurrent write.
      const { rows: verifyRows } = await GamesTable.findRows({ filter: { gameId: game.gameId }, limit: 1 })
      const verified = verifyRows[0]
      if (!verified) {
        return
      }
      if (verified.players.some((p: Player) => p.discordUserId === userId)) {
        return
      }
    }

    console.warn('[pollVote] Failed to register player after retries', { messageId, userId })
  },
})
