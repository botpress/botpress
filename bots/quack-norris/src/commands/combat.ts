import { formatCompactClassList, formatClassDetails, resolveClassAlias, DUCK_CLASSES } from '../lib/classes'
import { hasEnoughEnergy, getSpecialEnergyCost } from '../lib/combat'
import type { CommandHandler, CommandContext } from '../lib/command-context'
import { narrateLoreIntro } from '../lib/narration'
import type { Player } from '../lib/types'
import { GameLoop } from '../workflows/gameLoop'

const safeReact = async (ctx: CommandContext, emojiId: string): Promise<void> => {
  try {
    await ctx.actions.discord.addReaction({
      channelId: ctx.channelId,
      messageId: ctx.message.tags['discord:id'] ?? ctx.message.id,
      emojiId,
    })
  } catch {
    // Reaction may fail if bot lacks permissions — not critical
  }
}

// --- !startTournament / !game ---
const handleStartTournament: CommandHandler = async (ctx) => {
  const targetChannelId = ctx.args[0] ?? ctx.channelId
  if (!targetChannelId) {
    await ctx.sendText('Could not detect channel. Try `!startTournament <channelId>`.')
    return
  }

  const result = await ctx.actions.startGame({ channelId: targetChannelId })

  ctx.stateRef.activeGameId = result.gameId
  ctx.convTags.gameId = result.gameId
  ctx.convTags.phase = 'registration'

  await ctx.sendText(
    'The Quacktament has been summoned! A call echoes across The Pond Eternal. Vote on the poll to join the tournament! Type `!start` when all warriors have answered the call.'
  )
}

// --- !start ---
const handleStart: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Type `!startTournament` to begin one!')
    return
  }

  const { GamesTable } = await import('../tables/Games')
  const { rows } = await GamesTable.findRows({ filter: { gameId: ctx.stateRef.activeGameId }, limit: 1 })
  const game = rows[0]

  if (!game || game.phase !== 'registration') {
    await ctx.sendText('*The Arena Scribe checks the roster.* No game is awaiting warriors right now.')
    return
  }

  if (game.players.length < 2) {
    await ctx.sendText(
      `*The Arena Scribe counts heads...* Only ${game.players.length} warrior${game.players.length === 1 ? '' : 's'}. The Arena demands at least 2 to begin.`
    )
    return
  }

  if (game.pollMessageId) {
    await ctx.actions.discord.endPoll({
      channelId: game.channelId,
      messageId: game.pollMessageId,
    })
  }

  await GamesTable.upsertRows({ rows: [{ ...game, phase: 'classSelection' }], keyColumn: 'gameId' })
  ctx.convTags.phase = 'classSelection'

  const loreIntro = narrateLoreIntro()
  await ctx.sendText(loreIntro)

  const classList = formatCompactClassList()
  await ctx.sendText(
    `**Choose your fighter!** Type \`!class <name>\` to pick your duck class:\n\n${classList}\n\n*Type \`!helpclass <name>\` for full details on any class.*\n\nType \`!ready\` when everyone has picked (or they'll be assigned randomly).`
  )
}

// --- !class ---
const handleClass: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament running. Class selection happens during `!startTournament`.')
    return
  }

  if (!ctx.args[0]) {
    await ctx.sendText(
      'Pick a class! Type `!class <name>` — options: `mallard`, `doc`, `sir`, `trickster`. Use `!helpclass <name>` for details.'
    )
    return
  }

  const result = await ctx.actions.selectClass({
    gameId: ctx.stateRef.activeGameId,
    discordUserId: ctx.discordUserId,
    className: ctx.args[0]!,
  })

  await ctx.sendText(result.message)

  if (result.success) {
    await safeReact(ctx, '✅')
  }
}

// --- !helpclass ---
const handleHelpClass: CommandHandler = async (ctx) => {
  if (!ctx.args[0]) {
    await ctx.sendText('Which class? Type `!helpclass <name>` — options: `mallard`, `doc`, `sir`, `trickster`.')
    return
  }

  const duckClass = resolveClassAlias(ctx.args[0]!)
  if (!duckClass) {
    const validNames = Object.values(DUCK_CLASSES)
      .map((c) => c.name)
      .join(', ')
    await ctx.sendText(`Unknown class "${ctx.args[0]}". Valid classes: ${validNames}`)
    return
  }

  const details = formatClassDetails(duckClass)
  await ctx.sendText(details)
}

// --- !ready ---
const handleReady: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Type `!startTournament` to begin one!')
    return
  }

  const { GamesTable } = await import('../tables/Games')
  const { rows } = await GamesTable.findRows({ filter: { gameId: ctx.stateRef.activeGameId }, limit: 1 })
  const game = rows[0]

  if (!game || game.phase !== 'classSelection') {
    await ctx.sendText("*The Arena Scribe frowns.* Class selection hasn't started yet.")
    return
  }

  const players = [...game.players]
  const allClasses = Object.keys(DUCK_CLASSES) as Array<keyof typeof DUCK_CLASSES>
  for (const player of players) {
    if (!player.duckClass) {
      const randomClass = allClasses[Math.floor(Math.random() * allClasses.length)]!
      const classDef = DUCK_CLASSES[randomClass]
      player.duckClass = randomClass
      player.hp = classDef.maxHp
      player.maxHp = classDef.maxHp
      player.energy = classDef.maxEnergy
      player.maxEnergy = classDef.maxEnergy
      player.specialCooldown = 0
      player.statusEffects = []
      player.consecutiveHits = 0
    }
  }

  await GamesTable.upsertRows({
    rows: [{ ...game, players, phase: 'combat', round: 1 }],
    keyColumn: 'gameId',
  })
  ctx.convTags.phase = 'combat'

  await GameLoop.start({
    gameId: game.gameId,
    channelId: game.channelId,
    conversationId: ctx.conversation.id,
    userId: ctx.message.userId,
  })
}

// --- Combat action helpers ---
const validateCombatAction = async (ctx: CommandContext) => {
  if (!ctx.stateRef.activeGameId) {
    return null
  }

  const { GamesTable } = await import('../tables/Games')
  const { ActionsTable } = await import('../tables/Actions')
  const { rows } = await GamesTable.findRows({ filter: { gameId: ctx.stateRef.activeGameId }, limit: 1 })
  const game = rows[0]
  if (!game || game.phase !== 'combat') {
    await ctx.sendText('*The Arena is quiet.* No active combat right now.')
    return null
  }

  const player = game.players.find((p: Player) => p.discordUserId === ctx.discordUserId && p.alive)
  if (!player) {
    await ctx.sendText("*The Arena Scribe shakes their head.* You're not in this fight — or you've already fallen.")
    return null
  }

  const actionKey = `${ctx.stateRef.activeGameId}:${game.round}:${ctx.discordUserId}`
  const { rows: existingActions } = await ActionsTable.findRows({ filter: { actionKey }, limit: 1 })
  if (existingActions.length > 0) {
    await ctx.sendText("*The Arena Scribe taps their quill.* You've already declared your move this round.")
    return null
  }

  return { game, player, ActionsTable }
}

const submitAction = async (
  ActionsTable: { upsertRows: (opts: { rows: unknown[]; keyColumn: string }) => Promise<unknown> },
  gameId: string,
  round: number,
  discordUserId: string,
  actionType: string,
  targetUserId?: string
): Promise<void> => {
  const actionKey = `${gameId}:${round}:${discordUserId}`
  await ActionsTable.upsertRows({
    rows: [{ actionKey, gameId, round, discordUserId, actionType, targetUserId }],
    keyColumn: 'actionKey',
  })
}

const validateTarget = (game: { players: Player[] }, targetUserId: string, discordUserId: string): string | null => {
  if (targetUserId === discordUserId) {
    return "*You stare at your own reflection in the arena floor.* You can't target yourself!"
  }
  const target = game.players.find((p: Player) => p.discordUserId === targetUserId)
  if (!target) {
    return "*The Arena Scribe scans the roster.* That duck isn't in this fight."
  }
  if (!target.alive) {
    return `*${target.name}\'s feathers lie still on the arena floor.* They\'ve already been eliminated.`
  }
  return null
}

// --- !light / !heavy ---
const handleLightHeavy: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Type `!startTournament` to begin one!')
    return
  }
  if (!ctx.args[0]) {
    await ctx.sendText(`Who are you attacking? Type \`${ctx.command} @target\`.`)
    return
  }

  const targetUserId = ctx.args[0]!.replace(/[<@!>]/g, '')
  const combat = await validateCombatAction(ctx)
  if (!combat) {
    return
  }

  const targetError = validateTarget(combat.game, targetUserId, ctx.discordUserId)
  if (targetError) {
    await ctx.sendText(targetError)
    return
  }

  const actionType = ctx.command === '!light' ? 'light' : 'heavy'
  if (!hasEnoughEnergy(combat.player, actionType)) {
    await ctx.sendText(
      `Not enough energy! You have ${combat.player.energy} energy. ${actionType === 'light' ? 'Light' : 'Heavy'} costs ${actionType === 'light' ? 10 : 25}. Use \`!rest\` to recover.`
    )
    return
  }

  await submitAction(
    combat.ActionsTable,
    ctx.stateRef.activeGameId,
    combat.game.round,
    ctx.discordUserId,
    actionType,
    targetUserId
  )

  const target = combat.game.players.find((p: Player) => p.discordUserId === targetUserId)
  const targetName = target ? target.name : 'their target'
  await ctx.sendText(
    actionType === 'light'
      ? `⚔️ ${combat.player.name} locks eyes on ${targetName}... a swift strike incoming!`
      : `🔨 ${combat.player.name} winds up a MASSIVE swing at ${targetName}!`
  )

  await safeReact(ctx, ctx.command === '!light' ? '⚔' : '🔨')
}

// --- !block ---
const handleBlock: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Type `!startTournament` to begin one!')
    return
  }

  const combat = await validateCombatAction(ctx)
  if (!combat) {
    return
  }

  if (!hasEnoughEnergy(combat.player, 'block')) {
    await ctx.sendText(
      `Not enough energy to block! You have ${combat.player.energy} energy. Block costs 10. Use \`!rest\` to recover.`
    )
    return
  }

  await submitAction(combat.ActionsTable, ctx.stateRef.activeGameId, combat.game.round, ctx.discordUserId, 'block')
  await ctx.sendText(`🛡️ ${combat.player.name} hunkers down behind their wings! Blocking!`)
  await safeReact(ctx, '🛡')
}

// --- !special ---
const handleSpecial: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Specials are used during combat.')
    return
  }

  const combat = await validateCombatAction(ctx)
  if (!combat) {
    return
  }

  if (!combat.player.duckClass) {
    await ctx.sendText(
      "You don't have a class assigned yet — this shouldn't happen in combat! Try `!status` to check the game."
    )
    return
  }

  if (combat.player.specialCooldown > 0) {
    await ctx.sendText(
      `*Your power flickers but won't ignite.* Special on cooldown — ${combat.player.specialCooldown} round${combat.player.specialCooldown !== 1 ? 's' : ''} remaining.`
    )
    return
  }

  const specialCost = getSpecialEnergyCost(combat.player.duckClass)
  if (!hasEnoughEnergy(combat.player, 'special')) {
    await ctx.sendText(
      `Not enough energy for your special! You have ${combat.player.energy} energy. ${DUCK_CLASSES[combat.player.duckClass].specialName} costs ${specialCost}.`
    )
    return
  }

  const targetUserId = ctx.args[0] ? ctx.args[0].replace(/[<@!>]/g, '') : undefined
  await submitAction(
    combat.ActionsTable,
    ctx.stateRef.activeGameId,
    combat.game.round,
    ctx.discordUserId,
    'special',
    targetUserId
  )

  const classDef = DUCK_CLASSES[combat.player.duckClass]
  await ctx.sendText(`💥 ${combat.player.name} channels their inner power... **${classDef.specialName}** is coming!`)
  await safeReact(ctx, '💥')
}

// --- !rest ---
const handleRest: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Type `!startTournament` to begin one!')
    return
  }

  const combat = await validateCombatAction(ctx)
  if (!combat) {
    return
  }

  await submitAction(combat.ActionsTable, ctx.stateRef.activeGameId, combat.game.round, ctx.discordUserId, 'rest')
  await ctx.sendText(
    `💤 ${combat.player.name} sits down and catches their breath... risky, but sometimes you gotta recharge.`
  )
  await safeReact(ctx, '💤')
}

// --- !forfeit ---
const handleForfeit: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Type `!startTournament` to begin one!')
    return
  }

  const combat = await validateCombatAction(ctx)
  if (!combat) {
    return
  }

  await submitAction(combat.ActionsTable, ctx.stateRef.activeGameId, combat.game.round, ctx.discordUserId, 'forfeit')
  await ctx.sendText(
    `${combat.player.name} raises a white feather and surrenders! They waddle out of the arena with what remains of their dignity.`
  )
  await safeReact(ctx, '🏳️')
}

// --- !use ---
const handleUse: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('No tournament is active. Items can be used during combat with `!use <item name>`.')
    return
  }

  if (!ctx.args[0]) {
    await ctx.sendText('Which item? Type `!use <item name>`. Check `!inventory` to see your items.')
    return
  }

  // Using an item consumes the round action
  const combat = await validateCombatAction(ctx)
  if (!combat) {
    return
  }

  const result = await ctx.actions.useItem({
    gameId: ctx.stateRef.activeGameId,
    discordUserId: ctx.discordUserId,
    itemName: ctx.args.join(' '),
  })

  if (result.success) {
    // Register as the round action so the player can't also attack
    await submitAction(combat.ActionsTable, ctx.stateRef.activeGameId, combat.game.round, ctx.discordUserId, 'useItem')
    await safeReact(ctx, '✨')
  }

  await ctx.sendText(result.message)
}

// --- !status ---
const handleStatus: CommandHandler = async (ctx) => {
  if (!ctx.stateRef.activeGameId) {
    await ctx.sendText('*The Arena is empty.* No tournament is active. Type `!startTournament` to begin one!')
    return
  }

  const { GamesTable } = await import('../tables/Games')
  const { rows } = await GamesTable.findRows({ filter: { gameId: ctx.stateRef.activeGameId }, limit: 1 })
  const game = rows[0]

  if (!game) {
    await ctx.sendText("*The Arena Scribe can't find that tournament.* It may have ended.")
    return
  }

  // Show class selection status during classSelection phase
  if (game.phase === 'classSelection') {
    const lines = ['*The Arena Scribe checks who has picked their class:*', '']
    for (const p of game.players as Player[]) {
      const classDef = p.duckClass ? DUCK_CLASSES[p.duckClass] : undefined
      if (classDef) {
        lines.push(`  ✅ **${p.name}** — ${classDef.emoji} ${classDef.name}`)
      } else {
        lines.push(`  ⏳ **${p.name}** — *still choosing...*`)
      }
    }
    lines.push('')
    lines.push("*Type `!ready` when everyone has picked (or they'll be assigned randomly).*")
    await ctx.sendText(lines.join('\n'))
    return
  }

  if (game.phase === 'registration') {
    await ctx.sendText(
      `*The Arena Scribe counts the roster:* ${game.players.length} warrior${game.players.length !== 1 ? 's' : ''} registered. Type \`!start\` when ready.`
    )
    return
  }

  const status = await ctx.actions.getGameStatus({ gameId: ctx.stateRef.activeGameId })
  await ctx.sendText(status.formattedStatus)
}

export const combatCommands = new Map<string, CommandHandler>([
  ['!startTournament', handleStartTournament],
  ['!game', handleStartTournament],
  ['!start', handleStart],
  ['!class', handleClass],
  ['!helpclass', handleHelpClass],
  ['!helpClass', handleHelpClass],
  ['!ready', handleReady],
  ['!light', handleLightHeavy],
  ['!heavy', handleLightHeavy],
  ['!block', handleBlock],
  ['!special', handleSpecial],
  ['!rest', handleRest],
  ['!forfeit', handleForfeit],
  ['!use', handleUse],
  ['!status', handleStatus],
])
