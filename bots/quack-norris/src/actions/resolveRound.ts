import { Action, z } from '@botpress/runtime'
import {
  getChaosEventByName,
  fogMissChance,
  isFogOfWar,
  isFloorIsLava,
  isScrambledOrders,
  isTreasureChest,
  applyFloorIsLava,
  scrambleTargets,
  applyTreasureChest,
  shouldTriggerChaos,
} from '../lib/chaosEvents'
import { DUCK_CLASSES } from '../lib/classes'
import {
  calculateDamage,
  deductEnergy,
  regenerateEnergy,
  applyRest,
  hasEnoughEnergy,
  executeSpecial,
  tickStatusEffects,
  decrementCooldowns,
  processShieldedAttack,
  removeStatusEffect,
} from '../lib/combat'
import {
  narrateLightAttack,
  narrateHeavyAttack,
  narrateCriticalHit,
  narrateBlockSuccess,
  narrateBlockNoAttack,
  narrateBlockPartial,
  narrateDodge,
  narrateElimination,
  narrateRest,
  generateCommentary,
} from '../lib/narration'
import type { ActionType, CombatEvent, GameAction, Player } from '../lib/types'

export const resolveRound = new Action({
  name: 'resolveRound',
  description: 'Process all player actions for the current round with full combat engine',

  input: z.object({
    gameId: z.string(),
  }),

  output: z.object({
    log: z.array(z.string()),
    eliminatedPlayers: z.array(z.string()),
    gameOver: z.boolean(),
    winnerId: z.string().optional(),
    chaosEventName: z.string().optional(),
  }),

  async handler({ input }) {
    const { GamesTable } = await import('../tables/Games')
    const { ActionsTable } = await import('../tables/Actions')

    const { rows } = await GamesTable.findRows({ filter: { gameId: input.gameId }, limit: 1 })
    const game = rows[0]
    if (!game) {
      throw new Error(`Game ${input.gameId} not found`)
    }

    const players: Player[] = [...game.players]
    const aliveBefore = players.filter((p) => p.alive)
    const events: CombatEvent[] = []
    let totalDamageThisRound = 0

    // --- Read actions from ActionsTable (filter by round directly) ---
    const { rows: actionRows } = await ActionsTable.findRows({
      filter: { gameId: input.gameId, round: game.round },
    })
    const VALID_ACTION_TYPES = new Set<string>(['light', 'heavy', 'block', 'rest', 'special', 'forfeit'])
    const roundActions: GameAction[] = actionRows
      .filter((r) => VALID_ACTION_TYPES.has(r.actionType))
      .map((r) => ({
        discordUserId: r.discordUserId,
        type: r.actionType as ActionType,
        targetUserId: r.targetUserId,
      }))

    // --- Process forfeits first ---
    const forfeitActions = roundActions.filter((a) => a.type === 'forfeit')
    for (const fa of forfeitActions) {
      const player = players.find((p) => p.discordUserId === fa.discordUserId)
      if (player && player.alive) {
        player.alive = false
        player.hp = 0
        events.push({
          text: `${player.name} raises a white feather and surrenders! They waddle out of the arena with dignity intact... mostly.`,
          type: 'elimination',
        })
      }
    }

    // --- AFK default: assign 'rest' to alive players with no submitted action ---
    const submittedIds = new Set(roundActions.map((a) => a.discordUserId))
    const forcedRestIds = new Set<string>()
    for (const player of players.filter((p) => p.alive)) {
      if (!submittedIds.has(player.discordUserId)) {
        roundActions.push({ discordUserId: player.discordUserId, type: 'rest' })
        forcedRestIds.add(player.discordUserId)
      }
    }

    // --- Step 1: Chaos Event (read from game row, not re-rolled) ---
    let chaosEvent = null
    let chaosEventName: string | undefined
    if (shouldTriggerChaos(game.round) && game.chaosEvent) {
      chaosEvent = getChaosEventByName(game.chaosEvent)
      chaosEventName = game.chaosEvent

      if (
        chaosEvent &&
        !isFogOfWar(chaosEvent) &&
        !isFloorIsLava(chaosEvent) &&
        !isScrambledOrders(chaosEvent) &&
        !isTreasureChest(chaosEvent)
      ) {
        const chaosResults = chaosEvent.apply(players)
        events.push(...chaosResults)
      }

      if (chaosEvent && isScrambledOrders(chaosEvent)) {
        scrambleTargets(
          roundActions,
          players.filter((p) => p.alive)
        )
        events.push({ text: 'All targets have been SCRAMBLED by the Quackverse!', type: 'chaos' })
      }
    }

    // --- Step 2: Tick status effects ---
    const statusEvents = tickStatusEffects(players)
    events.push(...statusEvents)
    for (const evt of statusEvents) {
      if (evt.type === 'status') {
        const dmgMatch = evt.text.match(/(\d+) poison damage/)
        if (dmgMatch) {
          totalDamageThisRound += parseInt(dmgMatch[1]!, 10)
        }
      }
    }

    // --- Step 2b: Check poison deaths ---
    for (const player of players) {
      if (player.hp <= 0 && player.alive) {
        player.alive = false
        events.push({
          text: `${player.name} succumbs to the poison! The toxins claim another victim!`,
          type: 'elimination',
        })
      }
    }

    // --- Step 3: Identify blockers and process energy ---
    const blockingPlayerIds = new Set(roundActions.filter((a) => a.type === 'block').map((a) => a.discordUserId))
    const restingPlayers: Player[] = []

    for (const action of roundActions) {
      if (action.type === 'forfeit') {
        continue
      }
      const player = players.find((p) => p.discordUserId === action.discordUserId)
      if (!player || !player.alive) {
        continue
      }

      if (!hasEnoughEnergy(player, action.type)) {
        action.type = 'rest'
        forcedRestIds.add(player.discordUserId)
      }

      if (action.type === 'rest') {
        applyRest(player)
        restingPlayers.push(player)
        events.push({ text: narrateRest(player.name), type: 'rest' })
        // Forced rests (AFK or no energy) don't get vulnerability
        if (forcedRestIds.has(player.discordUserId)) {
          removeStatusEffect(player, 'resting')
        }
      } else {
        deductEnergy(player, action.type)
      }
    }

    if (chaosEvent && isFloorIsLava(chaosEvent)) {
      const lavaEvents = applyFloorIsLava(restingPlayers)
      events.push(...lavaEvents)
    }

    // --- Step 4: Process blocks ---
    for (const action of roundActions) {
      if (action.type !== 'block') {
        continue
      }
      const player = players.find((p) => p.discordUserId === action.discordUserId)
      if (!player || !player.alive) {
        continue
      }

      const heavyAttackers = roundActions.filter((a) => a.type === 'heavy' && a.targetUserId === player.discordUserId)
      const lightAttackers = roundActions.filter((a) => a.type === 'light' && a.targetUserId === player.discordUserId)
      const aliveHeavyAttackers = heavyAttackers
        .map((a) => players.find((p) => p.discordUserId === a.discordUserId))
        .filter((p): p is Player => Boolean(p?.alive))
      const aliveLightAttackers = lightAttackers
        .map((a) => players.find((p) => p.discordUserId === a.discordUserId))
        .filter((p): p is Player => Boolean(p?.alive))
      const anyAttackers = aliveHeavyAttackers.length + aliveLightAttackers.length

      if (aliveHeavyAttackers.length > 0) {
        for (const attacker of aliveHeavyAttackers) {
          events.push({ text: narrateBlockSuccess(attacker.name, player.name), type: 'block' })
        }
      } else if (anyAttackers === 0) {
        events.push({ text: narrateBlockNoAttack(player.name), type: 'block' })
      }

      // Holy Plumage: heal on ANY blocked attack (heavy or light)
      if (player.duckClass === 'sirQuacksALot' && anyAttackers > 0) {
        player.hp = Math.min(player.maxHp, player.hp + 8)
        events.push({
          text: `${player.name}'s Holy Plumage glows! +8 HP healed from successful block!`,
          type: 'status',
        })
      }
    }

    // --- Step 5: Process special abilities ---
    let eliminationCount = 0
    for (const action of roundActions) {
      if (action.type !== 'special') {
        continue
      }
      const caster = players.find((p) => p.discordUserId === action.discordUserId)
      if (!caster || !caster.alive || !caster.duckClass) {
        continue
      }

      if (caster.specialCooldown > 0) {
        events.push({
          text: `${caster.name} tries to use their special but it's on cooldown! (${caster.specialCooldown} rounds)`,
          type: 'special',
        })
        continue
      }

      const target = action.targetUserId ? players.find((p) => p.discordUserId === action.targetUserId) : undefined
      const result = executeSpecial(caster, target, players)
      events.push(...result.events)

      if (caster.duckClass === 'mallardNorris') {
        if (result.kills.length === 0) {
          caster.specialCooldown = DUCK_CLASSES[caster.duckClass].specialCooldown
        }
      } else {
        caster.specialCooldown = DUCK_CLASSES[caster.duckClass].specialCooldown
      }

      eliminationCount += result.kills.length
    }

    // --- Step 6: Process attacks ---
    let firstLightAttacker: Player | undefined
    for (const action of roundActions) {
      if (action.type !== 'light' && action.type !== 'heavy') {
        continue
      }

      const attacker = players.find((p) => p.discordUserId === action.discordUserId)
      const target = players.find((p) => p.discordUserId === action.targetUserId)

      if (!attacker || !target || !attacker.alive || !target.alive) {
        continue
      }

      if (action.type === 'light' && !firstLightAttacker) {
        firstLightAttacker = attacker
      }

      // Fog of War: 10% miss chance
      if (chaosEvent && isFogOfWar(chaosEvent) && fogMissChance()) {
        events.push({
          text: `${attacker.name} swings blindly in the fog and MISSES ${target.name}!`,
          type: 'attack',
        })
        continue
      }

      const isBlocking = blockingPlayerIds.has(target.discordUserId)

      // Capture pre-attack HP for shield restoration
      const preAttackHp = target.hp
      const result = calculateDamage(attacker, target, action.type, isBlocking)

      if (result.isDodged) {
        events.push({ text: narrateDodge(attacker.name, target.name, action.type), type: 'attack' })
        continue
      }

      if (result.isBlocked) {
        continue
      }

      if (result.damage > 0) {
        const shieldResult = processShieldedAttack(attacker, target, result.damage)
        if (shieldResult.absorbed) {
          // Restore to pre-attack HP (shield absorbed the blow)
          if (!shieldResult.reflected) {
            target.hp = preAttackHp
          }
          if (shieldResult.reflected) {
            events.push({
              text: `${target.name}'s Mirror Decoy activates! Attack negated and ${shieldResult.reflectDamage} dmg reflected to ${attacker.name}!`,
              type: 'special',
            })
          } else {
            events.push({
              text: `${target.name}'s Divine Shield absorbs the blow! Shield shattered!`,
              type: 'special',
            })
          }
          continue
        }
      }

      totalDamageThisRound += result.damage

      if (result.isCrit) {
        events.push({ text: narrateCriticalHit(attacker.name, target.name, result.damage), type: 'attack' })
      } else if (isBlocking && action.type === 'light') {
        events.push({ text: narrateBlockPartial(attacker.name, target.name, result.damage), type: 'attack' })
      } else if (action.type === 'light') {
        events.push({ text: narrateLightAttack(attacker.name, target.name, result.damage), type: 'attack' })
      } else {
        events.push({ text: narrateHeavyAttack(attacker.name, target.name, result.damage), type: 'attack' })
      }

      if (result.comboTriggered) {
        events.push({
          text: `**QUACK COMBO!** ${attacker.name} lands hit #3 in a row! +15 bonus dmg! They're powered up!`,
          type: 'attack',
        })
      }

      if (result.poisonApplied) {
        events.push({ text: `${target.name} has been poisoned by Dr. Quackenstein's Toxic Aura!`, type: 'status' })
      }
    }

    if (chaosEvent && isTreasureChest(chaosEvent)) {
      const chestEvents = applyTreasureChest(firstLightAttacker)
      events.push(...chestEvents)
    }

    // --- Step 7: Check eliminations ---
    const eliminatedPlayers: string[] = []
    for (const player of players) {
      if (player.hp <= 0 && player.alive) {
        player.alive = false
        eliminatedPlayers.push(player.name)
        eliminationCount++

        const isFirst = eliminationCount === 1 && aliveBefore.length === players.length
        const remaining = players.filter((p) => p.alive)
        events.push({ text: narrateElimination(player.name, isFirst, remaining), type: 'elimination' })
      }
    }

    // --- Step 8: Regenerate energy + decrement cooldowns ---
    for (const player of players.filter((p) => p.alive)) {
      regenerateEnergy(player)
    }
    decrementCooldowns(players)

    // --- Step 9: Remove expired resting status ---
    for (const player of players) {
      if (player.statusEffects) {
        player.statusEffects = player.statusEffects.filter((e) => e.type !== 'resting')
      }
    }

    // --- Step 10: Check game over ---
    const alivePlayers = players.filter((p) => p.alive)
    const gameOver = alivePlayers.length <= 1
    const winnerId = gameOver && alivePlayers.length === 1 ? alivePlayers[0]!.discordUserId : undefined

    // --- Step 11: Commentary ---
    const commentary = generateCommentary(players, eliminatedPlayers.length, totalDamageThisRound)
    if (commentary) {
      events.push({ text: `\n${commentary}`, type: 'commentary' })
    }

    // --- Step 12: Update game state ---
    await GamesTable.upsertRows({
      rows: [
        {
          ...game,
          players,
          actions: [],
          round: game.round + 1,
          phase: gameOver ? 'finished' : 'combat',
          winnerId,
          chaosEvent: undefined,
        },
      ],
      keyColumn: 'gameId',
    })

    // Clean up resolved actions in parallel (avoids sequential N+1 pattern)
    await Promise.all(actionRows.map((row) => ActionsTable.deleteRows({ actionKey: row.actionKey })))

    if (gameOver && winnerId) {
      const winner = players.find((p) => p.discordUserId === winnerId)
      events.push({ text: `\n${winner?.name ?? 'Unknown'} wins the battle!`, type: 'elimination' })
    }

    let log: string[]
    if (chaosEvent && isFogOfWar(chaosEvent)) {
      log = [
        '🌫️ **FOG OF WAR** 🌫️',
        'The fog lifts to reveal...',
        ...events
          .filter((e) => e.type === 'elimination' || e.type === 'chaos' || e.type === 'commentary')
          .map((e) => e.text),
        `${eliminatedPlayers.length} ducks were eliminated. ${totalDamageThisRound} total damage was dealt. But by whom? Only the fog knows.`,
      ]
    } else {
      log = events.map((e) => e.text)
    }

    return { log, eliminatedPlayers, gameOver, winnerId, chaosEventName }
  },
})
