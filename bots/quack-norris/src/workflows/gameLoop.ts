import { Workflow, z, actions } from '@botpress/runtime'
import { shouldTriggerChaos, rollChaosEvent, formatChaosAnnouncement } from '../lib/chaosEvents'
import { DUCK_CLASSES } from '../lib/classes'
import { ITEMS, addItemToInventory } from '../lib/items'
import { LOCATIONS, type LocationId } from '../lib/locations'
import {
  narrateOpeningCeremony,
  narrateRoundStart,
  narrateVictory,
  narrateDraw,
  renderPlayerStatus,
} from '../lib/narration'
import { parseQuestState } from '../lib/profile'
import {
  awardXp,
  renderLevelUp,
  XP_AWARDS,
  BREADCRUMB_AWARDS,
  checkTitleUnlocks,
  getTitleName,
  checkMilestones,
} from '../lib/progression'
import { getQuestById, checkObjectiveProgress, isStepComplete, advanceToNextStep } from '../lib/quests'
import type { Player } from '../lib/types'

const MAX_ROUNDS = 15
const ROUND_TIMEOUT_MS = 60_000
const QUACKENING_DAMAGE = 5

type GameProfile = {
  displayName: string
  xp: number
  level: number
  breadcrumbs: number
  titlesUnlocked: string[]
  unlockedLocations: string[]
  inventory: Parameters<typeof addItemToInventory>[0]
}

const processQuestRewards = (
  profile: GameProfile,
  def: { rewards: { type: string; value: unknown }[] },
  announcements: string[]
): void => {
  let questXpGain = 0
  let questBcGain = 0
  for (const reward of def.rewards) {
    if (!reward || reward.value == null) {
      continue
    }
    if (reward.type === 'xp') {
      questXpGain += reward.value as number
    } else if (reward.type === 'breadcrumbs') {
      questBcGain += reward.value as number
    } else if (reward.type === 'title') {
      const titleId = reward.value as string
      if (!profile.titlesUnlocked.includes(titleId)) {
        profile.titlesUnlocked = [...profile.titlesUnlocked, titleId]
        announcements.push(`🏆 **${profile.displayName}** earned title: **${getTitleName(titleId)}**`)
      }
    } else if (reward.type === 'locationUnlock') {
      const locId = reward.value as string
      if (!profile.unlockedLocations.includes(locId)) {
        profile.unlockedLocations = [...profile.unlockedLocations, locId]
        const loc = LOCATIONS[locId as LocationId]
        announcements.push(`🔓 **${profile.displayName}** unlocked: **${loc?.emoji ?? ''} ${loc?.name ?? locId}**`)
      }
    } else if (reward.type === 'item') {
      addItemToInventory(profile.inventory, reward.value as Parameters<typeof addItemToInventory>[1])
      const itemDef = ITEMS[reward.value as keyof typeof ITEMS]
      if (itemDef) {
        announcements.push(`📦 **${profile.displayName}** received: ${itemDef.emoji} ${itemDef.name}`)
      }
    }
  }
  if (questXpGain > 0) {
    const qXpResult = awardXp(profile.xp ?? 0, questXpGain)
    profile.xp = qXpResult.newXp
    profile.level = qXpResult.newLevel
    if (qXpResult.leveledUp) {
      const lvlText = renderLevelUp(qXpResult.oldLevel, qXpResult.newLevel, qXpResult.newXp).trim()
      announcements.push(`${lvlText} (**${profile.displayName}**)`)
    }
  }
  profile.breadcrumbs = (profile.breadcrumbs ?? 0) + questBcGain
}

const QUICK_REFERENCE = [
  '*The Arena Scribe unrolls a scroll:*',
  '`!light @target` ⚔️ 10e | `!heavy @target` 🔨 25e | `!block` 🛡️ 10e | `!special @target` 💥 | `!rest` 💤 +30e | `!use <item>` ✨ | `!forfeit` 🏳️',
].join('\n')

export const GameLoop = new Workflow({
  name: 'gameLoop',
  description: 'Main RPG game loop: class selection reveal, combat rounds with chaos events, dynamic narration',
  timeout: '1h',

  input: z.object({
    gameId: z.string(),
    channelId: z.string(),
    conversationId: z.string(),
    userId: z.string(),
  }),

  state: z.object({
    currentRound: z.number().default(1),
    gameOver: z.boolean().default(false),
  }),

  output: z.object({
    winnerId: z.string().optional(),
    totalRounds: z.number(),
  }),

  async handler({ input, state, step, client }) {
    const { GamesTable } = await import('../tables/Games')

    // --- Phase 1: Opening Ceremony + Class Reveal ---
    await step('announce-start', async () => {
      const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
      const game = rows[0]
      if (!game) {
        return
      }

      const ceremony = narrateOpeningCeremony()
      await client.createMessage({
        conversationId: input.conversationId,
        userId: input.userId,
        type: 'text',
        tags: {},
        payload: { text: ceremony },
      })
    })

    // Dramatic class reveal
    await step('class-reveal', async () => {
      const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
      const game = rows[0]
      if (!game) {
        return
      }

      const reveals: string[] = ['**The fighters step into the arena...**\n']
      for (const player of game.players as Player[]) {
        const classDef = player.duckClass ? DUCK_CLASSES[player.duckClass] : undefined
        if (classDef) {
          reveals.push(`${classDef.emoji} **${player.name}** enters as the **${classDef.name}**!`)
          reveals.push(`  *"${getClassEntrance(player.duckClass!)}"*`)
        } else {
          reveals.push(`❓ **${player.name}** enters... classless? Bold.`)
        }
      }

      reveals.push('')
      reveals.push(QUICK_REFERENCE)

      await client.createMessage({
        conversationId: input.conversationId,
        userId: input.userId,
        type: 'text',
        tags: {},
        payload: { text: reveals.join('\n') },
      })
    })

    // --- Phase 2: Combat Loop ---
    while (!state.gameOver && state.currentRound <= MAX_ROUNDS) {
      const roundNum = state.currentRound

      // Chaos event: roll, store on game row, and announce (every 3 rounds)
      if (shouldTriggerChaos(roundNum)) {
        await step(`chaos-${roundNum}`, async () => {
          const chaosEvent = rollChaosEvent()

          // Store chaos event on game row so resolveRound reads it
          const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
          const game = rows[0]
          if (game) {
            await GamesTable.upsertRows({
              rows: [{ ...game, chaosEvent: chaosEvent.name }],
              keyColumn: 'gameId',
            })
          }

          const announcement = formatChaosAnnouncement(chaosEvent)
          await client.createMessage({
            conversationId: input.conversationId,
            userId: input.userId,
            type: 'text',
            tags: {},
            payload: { text: announcement },
          })
        })
      }

      // Round announcement
      await step(`round-${roundNum}-announce`, async () => {
        const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
        const game = rows[0]
        if (!game) {
          return
        }

        const alivePlayers = (game.players as Player[]).filter((p) => p.alive)
        const isQuackening = alivePlayers.length <= 3 && roundNum > 3

        let roundText = narrateRoundStart(roundNum)
        roundText += '\n\n'

        for (const p of alivePlayers) {
          roundText += `${renderPlayerStatus(p)}\n`
        }

        if (isQuackening) {
          roundText += '\n⚡ **THE QUACKENING** ⚡ — All fighters take 5 dmg per round! Specials recharge faster!'
        }

        roundText += `\n\nSubmit your actions! (60s)\n${QUICK_REFERENCE}`

        await client.createMessage({
          conversationId: input.conversationId,
          userId: input.userId,
          type: 'text',
          tags: {},
          payload: { text: roundText },
        })

        // Apply Quackening damage
        if (isQuackening) {
          const players = [...game.players] as Player[]
          for (const p of players.filter((pl: Player) => pl.alive)) {
            p.hp = Math.max(0, p.hp - QUACKENING_DAMAGE)
            if (p.hp <= 0) {
              p.alive = false
            }
            if (p.specialCooldown > 0) {
              p.specialCooldown = Math.max(0, p.specialCooldown - 1)
            }
          }
          await GamesTable.upsertRows({ rows: [{ ...game, players }], keyColumn: 'gameId' })
        }
      })

      // Wait for player actions
      await step.sleep(`round-${roundNum}-wait`, ROUND_TIMEOUT_MS)

      // Show typing indicator before resolution
      await step(`round-${roundNum}-typing`, async () => {
        try {
          await actions.discord.startTypingIndicator({ conversationId: input.conversationId })
        } catch (e) {
          console.error('[gameLoop] typing indicator failed:', e)
        }
      })

      // Resolve round (with error recovery to avoid zombie games)
      let result: { log: string[]; gameOver: boolean; winnerId?: string }
      try {
        result = await step(`round-${roundNum}-resolve`, async () => {
          return await actions.resolveRound({ gameId: input.gameId })
        })
      } catch {
        // Clean up the game state so it doesn't stay in limbo
        await step(`round-${roundNum}-error-recovery`, async () => {
          const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
          const game = rows[0]
          if (game) {
            await GamesTable.upsertRows({ rows: [{ ...game, phase: 'finished' }], keyColumn: 'gameId' })
          }
          await client.createMessage({
            conversationId: input.conversationId,
            userId: input.userId,
            type: 'text',
            tags: {},
            payload: {
              text:
                '*The Arena shudders. Cracks appear in the ancient stonework.* Something went wrong behind the scenes ' +
                '— the Arena Scribe is investigating. This tournament has been cancelled.\n\n' +
                'Type `!startTournament` to summon a new Quacktament!',
            },
          })
        })
        return { winnerId: undefined, totalRounds: roundNum }
      }

      // Post round results
      await step(`round-${roundNum}-results`, async () => {
        const logText =
          result.log.length > 0 ? result.log.join('\n') : 'No actions this round. The arena is eerily silent...'

        await client.createMessage({
          conversationId: input.conversationId,
          userId: input.userId,
          type: 'text',
          tags: {},
          payload: {
            text: `**Round ${roundNum} Results:**\n${logText}`,
          },
        })
      })

      // Check game over
      if (result.gameOver) {
        state.gameOver = true

        await step('announce-winner', async () => {
          const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
          const game = rows[0]
          const winner = game?.players.find((p: Player) => p.discordUserId === result.winnerId)

          let text: string
          if (winner) {
            text = narrateVictory(winner.name)
            if (game) {
              const stats = generatePostGameStats(game.players as Player[], winner)
              text += `\n\n${stats}`
            }
          } else {
            text = narrateDraw()
          }

          await client.createMessage({
            conversationId: input.conversationId,
            userId: input.userId,
            type: 'text',
            tags: {},
            payload: { text },
          })
        })

        // Update PlayersTable with win/loss/XP/breadcrumb/quest stats
        await step('update-player-stats', async () => {
          const { PlayersTable } = await import('../tables/Players')
          const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
          const game = rows[0]
          if (!game) {
            return
          }

          const announcements: string[] = []

          // Fetch all player profiles in parallel (allSettled for partial-failure resilience)
          type ProfileEntry = {
            player: Player
            profile: Awaited<ReturnType<typeof PlayersTable.findRows>>['rows'][0] | undefined
          }
          const profileResults = await Promise.allSettled(
            (game.players as Player[]).map(async (player): Promise<ProfileEntry> => {
              const { rows: profileRows } = await PlayersTable.findRows({
                filter: { discordUserId: player.discordUserId },
                limit: 1,
              })
              return { player, profile: profileRows[0] }
            })
          )
          const profileEntries: ProfileEntry[] = profileResults
            .filter((r): r is PromiseFulfilledResult<ProfileEntry> => r.status === 'fulfilled')
            .map((r) => r.value)

          const updatedProfiles: NonNullable<ProfileEntry['profile']>[] = []

          for (const { player, profile } of profileEntries) {
            if (!profile) {
              continue
            }

            const isWinner = player.discordUserId === result.winnerId
            const xpGain = isWinner ? XP_AWARDS.tournamentWin : XP_AWARDS.tournamentLoss
            const bcGain = isWinner ? BREADCRUMB_AWARDS.tournamentWin : 0

            profile.totalWins += isWinner ? 1 : 0
            profile.totalLosses += isWinner ? 0 : 1
            const tourneyXpResult = awardXp(profile.xp ?? 0, xpGain)
            profile.xp = tourneyXpResult.newXp
            profile.breadcrumbs = (profile.breadcrumbs ?? 0) + bcGain
            profile.level = tourneyXpResult.newLevel
            if (tourneyXpResult.leveledUp) {
              const lvlMsg = renderLevelUp(
                tourneyXpResult.oldLevel,
                tourneyXpResult.newLevel,
                tourneyXpResult.newXp
              ).trim()
              announcements.push(`${lvlMsg} (**${profile.displayName}**)`)
            }

            // Advance quest objectives for tournament participation
            const qs = parseQuestState(profile.questState)
            if (qs.activeQuests.length > 0) {
              for (const quest of qs.activeQuests) {
                const def = getQuestById(quest.questId)
                if (!def) {
                  continue
                }
                if (isWinner) {
                  checkObjectiveProgress(quest, def, 'winTournament')
                }
                checkObjectiveProgress(quest, def, 'defeatInTournament')

                if (!isStepComplete(quest, def)) {
                  continue
                }
                const stepDef = def.steps.find((s) => s.id === quest.currentStepId)
                const hasChoices = stepDef?.choices && stepDef.choices.length > 0
                if (hasChoices) {
                  continue
                }
                const advance = advanceToNextStep(quest, def)
                if (!advance.completed) {
                  continue
                }
                qs.activeQuests = qs.activeQuests.filter((q) => q.questId !== quest.questId)
                qs.completedQuests.push({
                  questId: quest.questId,
                  completedAt: new Date().toISOString(),
                  choicesMade: quest.choicesMade,
                })

                if (!def.rewards || def.rewards.length === 0) {
                  announcements.push(`🎉 **${profile.displayName}** completed quest: **${def.name}**!`)
                  continue
                }
                processQuestRewards(profile as unknown as GameProfile, def, announcements)
                announcements.push(`🎉 **${profile.displayName}** completed quest: **${def.name}**!`)
              }
            }

            profile.questState = qs as typeof profile.questState

            const newTitles = checkTitleUnlocks(profile as Parameters<typeof checkTitleUnlocks>[0])
            for (const t of newTitles) {
              if (!profile.titlesUnlocked.includes(t)) {
                profile.titlesUnlocked = [...profile.titlesUnlocked, t]
                announcements.push(`🏆 **${profile.displayName}** earned title: **${getTitleName(t)}**`)
              }
            }

            // Check milestone celebrations
            const prevIdx = (profile.adventureState?.lastMilestoneIndex as number) ?? -1
            const milResult = checkMilestones(profile as Parameters<typeof checkMilestones>[0], prevIdx)
            if (milResult.messages.length > 0) {
              for (const m of milResult.messages) {
                announcements.push(`**${profile.displayName}** — ${m}`)
              }
              profile.adventureState = {
                ...profile.adventureState,
                lastMilestoneIndex: milResult.newIndex,
              }
            }

            profile.version = ((profile.version as number) ?? 0) + 1
            updatedProfiles.push(profile)
          }

          // Batch write all updated profiles in a single call
          if (updatedProfiles.length > 0) {
            await PlayersTable.upsertRows({
              rows: updatedProfiles,
              keyColumn: 'discordUserId',
            })
          }

          // Post quest/title announcements
          if (announcements.length > 0) {
            await client.createMessage({
              conversationId: input.conversationId,
              userId: input.userId,
              type: 'text',
              tags: {},
              payload: { text: announcements.join('\n') },
            })
          }
        })

        // Pin the winner announcement
        await step('pin-winner', async () => {
          try {
            // Unpin old tournament results first
            const { messages: pins } = await actions.discord.getChannelPins({ channelId: input.channelId })
            for (const pin of (pins as { id: string; content: string }[]).slice(0, 5)) {
              if (pin.content.includes('VICTORY') || pin.content.includes('CHAMPION') || pin.content.includes('DRAW')) {
                await actions.discord.unpinMessage({ channelId: input.channelId, messageId: pin.id })
              }
            }
          } catch (e) {
            console.error('[gameLoop] pin cleanup failed:', e)
          }
        })

        await step('post-game-prompt', async () => {
          await client.createMessage({
            conversationId: input.conversationId,
            userId: input.userId,
            type: 'text',
            tags: {},
            payload: {
              text: 'The Arena of Mallard Destiny falls silent... for now. Type `!startTournament` to summon a new Quacktament!',
            },
          })
        })

        return { winnerId: result.winnerId, totalRounds: roundNum }
      }

      state.currentRound = roundNum + 1
    }

    // MAX_ROUNDS reached without a winner — announce a draw
    if (!state.gameOver) {
      await step('max-rounds-draw', async () => {
        const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
        const game = rows[0]
        if (game) {
          await GamesTable.upsertRows({ rows: [{ ...game, phase: 'finished' }], keyColumn: 'gameId' })
        }

        const drawText = narrateDraw()
        await client.createMessage({
          conversationId: input.conversationId,
          userId: input.userId,
          type: 'text',
          tags: {},
          payload: {
            text: `${drawText}\n\n*${MAX_ROUNDS} rounds have passed. The Arena demands closure. Type \`!startTournament\` for a new fight!*`,
          },
        })
      })
    }

    return { winnerId: undefined, totalRounds: state.currentRound }
  },
})

// --- Helper Functions ---

const getClassEntrance = (duckClass: string): string => {
  const entrances: Record<string, string[]> = {
    mallardNorris: [
      'If it quacks like a problem, I punch it like a problem.',
      "I didn't come here to make friends. I came here to make craters.",
      'The only thing getting blocked today is your escape route.',
    ],
    quackdini: [
      'You never see the duck that gets you.',
      "Now you see me... actually, that's already too late.",
      "I'd tell you my strategy, but then I'd have to misdirect you.",
    ],
    sirQuacksALot: [
      "By the Great Mallard's light, I shall protect the righteous!",
      'My shield has never faltered. My resolve, even less so.',
      'I block, therefore I am. Also, +8 HP.',
    ],
    drQuackenstein: [
      'The side effects of my potions have side effects. And those have side effects.',
      "Everything is toxic if you add enough of it. That's science.",
      "Don't worry. The burning sensation is completely normal. Probably.",
    ],
  }

  const classEntrances = entrances[duckClass] ?? ['*waddles in confidently*']
  return classEntrances[Math.floor(Math.random() * classEntrances.length)]!
}

const generatePostGameStats = (players: Player[], winner: Player): string => {
  const lines: string[] = ['**=== BATTLE REPORT ===**\n']

  lines.push(`🏆 **Champion:** ${winner.name}`)
  if (winner.duckClass) {
    const classDef = DUCK_CLASSES[winner.duckClass]
    lines.push(`   Class: ${classDef.emoji} ${classDef.name}`)
  }
  lines.push(`   Final HP: ${winner.hp}/${winner.maxHp}`)
  lines.push('')

  lines.push('**Final Standings:**')
  const sorted = [...players].sort((a, b) => {
    if (a.alive && !b.alive) {
      return -1
    }
    if (!a.alive && b.alive) {
      return 1
    }
    return b.hp - a.hp
  })

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!
    const classDef = p.duckClass ? DUCK_CLASSES[p.duckClass] : undefined
    const classTag = classDef ? ` ${classDef.emoji}` : ''
    const status = p.alive ? '👑' : '💀'
    lines.push(`${status} #${i + 1} ${p.name}${classTag} — ${p.hp}/${p.maxHp} HP`)
  }

  lines.push('\n*GG! Type `!startTournament` to start a new match!*')

  return lines.join('\n')
}
