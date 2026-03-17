import type { CommandHandler } from '../lib/command-context'
import { LOCATIONS, type LocationId } from '../lib/locations'
import { parseQuestState } from '../lib/profile'
import { getLevelForXp, getTitleName, renderXpBar, TITLES } from '../lib/progression'
import { PlayersTable } from '../tables/Players'

// --- !help ---
const handleHelp: CommandHandler = async (ctx) => {
  const helpText = [
    '*Sir David Attenbird adjusts his monocle and unfurls a scroll:*',
    '',
    "**📖 The Adventurer's Guide to The Pond Eternal**",
    '',
    '🗺️ **Adventure:**',
    '`!startGame` — Begin your adventure in the Quackverse',
    '`!explore` — Search your location for encounters & loot',
    '`!travel` — Waddle to a new location',
    '`!look` — See who lurks nearby',
    '`!talk <npc>` — Chat with an NPC (quests, dialogue, wisdom)',
    "`!shop` — Browse the local vendor's wares",
    '`!buy <#>` — Purchase an item',
    '`!inventory` / `!inv` — Rummage through your belongings',
    '`!drop <item>` — Discard an item into the pond',
    '`!cancel` — Walk away from a pending choice',
    '',
    '📜 **Quests & Progression:**',
    '`!quests` / `!journal` — Open your quest journal',
    '`!daily` — Pick up a daily quest',
    '`!abandon <quest>` — Give up on an active quest',
    '`!title <name>` / `!titles` — Flaunt your earned titles',
    "`!profile` / `!profile @user` — Consult the Arena Scribe's records",
    '',
    '🗡️ **Combat:**',
    '`!light @target` ⚔️ | `!heavy @target` 🔨 | `!block` 🛡️ | `!special @target` 💥',
    '`!rest` 💤 | `!use <item>` ✨ | `!forfeit` 🏳️',
    '',
    '📊 **Info:**',
    '`!leaderboard` — The sacred scroll of champions',
    '',
    '*During encounters and quests, reply with a number to choose. Commands are case-insensitive.*',
    '',
    '*"Remarkable,"* Attenbird whispers. *"The duck actually read the manual."*',
  ].join('\n')

  await ctx.sendText(helpText)
}

// --- !profile ---
const handleProfile: CommandHandler = async (ctx) => {
  // !profile @user — View another duck's profile
  if (ctx.args[0]) {
    const targetId = ctx.args[0].replace(/[<@!>]/g, '')
    const { rows } = await PlayersTable.findRows({ filter: { discordUserId: targetId }, limit: 1 })
    const targetProfile = rows[0]

    if (!targetProfile) {
      await ctx.sendText(
        "*The Arena Scribe flips through dusty pages...* That duck hasn't started their adventure yet!"
      )
      return
    }

    const location = LOCATIONS[targetProfile.currentLocation as LocationId]
    const locationName = location ? `${location.emoji} ${location.name}` : targetProfile.currentLocation

    const tLevel = targetProfile.level ?? 1
    const tXp = targetProfile.xp ?? 0
    const tBc = targetProfile.breadcrumbs ?? 0
    const tTitle = targetProfile.title ?? 'Fledgling'
    const tXpInfo = getLevelForXp(tXp) >= 10 ? 'MAX' : renderXpBar(tXp)

    const profileText = [
      '*The Arena Scribe flips through the records:*',
      '',
      `**${targetProfile.displayName}** — *${getTitleName(tTitle)}*`,
      '',
      `📊 **Level ${tLevel}** | ${tXpInfo} | 🍞 ${tBc} breadcrumbs`,
      `📍 ${locationName}`,
      `⚔️ ${targetProfile.totalWins}W / ${targetProfile.totalLosses}L / ${targetProfile.totalKills}K`,
      `🗺️ ${targetProfile.adventureState.encountersCompleted.length} encounters completed`,
    ].join('\n')

    await ctx.sendText(profileText)
    return
  }

  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const location = LOCATIONS[profile.currentLocation as LocationId]
  const locationName = location ? `${location.emoji} ${location.name}` : profile.currentLocation
  const level = profile.level ?? 1
  const xp = profile.xp ?? 0
  const bc = profile.breadcrumbs ?? 0
  const title = profile.title ?? 'Fledgling'
  const qs = parseQuestState(profile.questState)
  const activeCount = qs?.activeQuests.length ?? 0
  const completedCount = qs?.completedQuests.length ?? 0
  const xpInfo = getLevelForXp(xp) >= 10 ? 'MAX' : renderXpBar(xp)

  const profileText = [
    '*The Arena Scribe opens a weathered tome and reads aloud:*',
    '',
    `**${profile.displayName}** — *${getTitleName(title)}*`,
    '',
    `📊 **Level ${level}** | ${xpInfo} | 🍞 ${bc} breadcrumbs`,
    `📍 ${locationName}`,
    `⚔️ ${profile.totalWins}W / ${profile.totalLosses}L / ${profile.totalKills}K`,
    `🗺️ ${profile.adventureState.encountersCompleted.length} encounters | ${completedCount} quests done, ${activeCount} active`,
    `📦 ${profile.inventory.length}/6 items`,
  ].join('\n')

  await ctx.sendText(profileText)
}

// --- !leaderboard ---
const handleLeaderboard: CommandHandler = async (ctx) => {
  if (!ctx.guildId) {
    await ctx.sendText('*The Arena Scribe squints...* Could not determine your server. Try again in a guild channel.')
    return
  }

  const { rows: allPlayers } = await PlayersTable.findRows({ filter: { guildId: ctx.guildId }, limit: 100 })
  if (allPlayers.length === 0) {
    await ctx.sendText(
      '*The Arena Scribe checks the records...* No adventurers found on this server yet! Type `!startGame` to begin.'
    )
    return
  }

  const showAdventure = ctx.args[0]?.toLowerCase() === 'adventure' || ctx.args[0]?.toLowerCase() === 'quest'

  if (showAdventure) {
    // Adventure leaderboard: sorted by level, then XP, then quests completed
    const advSorted = [...allPlayers]
      .sort((a, b) => {
        const lvlDiff = (b.level ?? 1) - (a.level ?? 1)
        if (lvlDiff !== 0) {
          return lvlDiff
        }
        const xpDiff = (b.xp ?? 0) - (a.xp ?? 0)
        if (xpDiff !== 0) {
          return xpDiff
        }
        const aQuests = (a.questState as { completedQuests?: unknown[] })?.completedQuests?.length ?? 0
        const bQuests = (b.questState as { completedQuests?: unknown[] })?.completedQuests?.length ?? 0
        return bQuests - aQuests
      })
      .slice(0, 10)
    const medals = ['🥇', '🥈', '🥉']
    const advLines = advSorted.map((p, i) => {
      const medal = medals[i] ?? `**#${i + 1}**`
      const title = getTitleName(p.title ?? 'Fledgling')
      const questCount = (p.questState as { completedQuests?: unknown[] })?.completedQuests?.length ?? 0
      return `${medal} **${p.displayName}** [${title}] — Lvl ${p.level ?? 1} | ${p.xp ?? 0} XP | ${questCount} quests`
    })

    await ctx.sendText(
      '*The Arena Scribe opens a second, dustier scroll:*\n\n' +
        `**The Quackverse Explorer Rankings**\n\n${advLines.join('\n')}\n\n` +
        `*${advSorted.length} adventurer${advSorted.length !== 1 ? 's' : ''} recorded. Use \`!leaderboard\` for arena rankings.*`
    )
    return
  }

  // Default: Arena leaderboard
  const sorted = [...allPlayers].sort((a, b) => b.totalWins - a.totalWins || b.totalKills - a.totalKills).slice(0, 10)
  const medals = ['🥇', '🥈', '🥉']
  const lines = sorted.map((p, i) => {
    const medal = medals[i] ?? `**#${i + 1}**`
    const title = getTitleName(p.title ?? 'Fledgling')
    const kd = `${p.totalWins}W / ${p.totalLosses}L / ${p.totalKills}K`
    const lvl = `Lvl ${p.level ?? 1}`
    return `${medal} **${p.displayName}** [${title}] — ${kd} | ${lvl}`
  })

  await ctx.sendText(
    '*The Arena Scribe unrolls the sacred scroll of champions:*\n\n' +
      `**The Arena of Mallard Destiny — Leaderboard**\n\n${lines.join('\n')}\n\n` +
      `*${sorted.length} warrior${sorted.length !== 1 ? 's' : ''} recorded. Glory awaits the bold.*\n` +
      '*Use `!leaderboard adventure` for explorer rankings.*'
  )
}

// --- !title / !titles ---
const handleTitle: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  // !title <name> — Set display title
  if (ctx.args[0]) {
    const titleInput = ctx.args.join(' ').toLowerCase()
    const matchedTitle = TITLES.find((t) => t.name.toLowerCase() === titleInput || t.id === titleInput)
    if (!matchedTitle) {
      const available = (profile.titlesUnlocked ?? ['Fledgling']).map((id: string) => getTitleName(id)).join(', ')
      await ctx.sendText(`Unknown title. Your unlocked titles: ${available}`)
      return
    }

    if (!(profile.titlesUnlocked ?? []).includes(matchedTitle.id)) {
      await ctx.sendText(`You haven't unlocked **${matchedTitle.name}** yet! ${matchedTitle.condition}.`)
      return
    }

    await PlayersTable.upsertRows({
      rows: [{ ...profile, title: matchedTitle.id, version: ((profile.version as number) ?? 0) + 1 }],
      keyColumn: 'discordUserId',
    })
    ctx.invalidateCache()
    await ctx.sendText(`Title set to **${matchedTitle.name}**!`, true)
    return
  }

  // !title (no arg) / !titles — List unlocked titles
  const unlocked = (profile.titlesUnlocked ?? ['Fledgling']).map((id: string) => {
    const active = id === (profile.title ?? 'Fledgling') ? ' *(active)*' : ''
    return `• **${getTitleName(id)}**${active}`
  })
  await ctx.sendText(`**Your Titles:**\n${unlocked.join('\n')}\n\n*Use \`!title <name>\` to change.*`)
}

// --- !channels ---
const handleChannels: CommandHandler = async (ctx) => {
  if (!ctx.guildId) {
    await ctx.sendText('*Quack.* Could not determine your server.')
    return
  }

  try {
    const result = await ctx.actions.discord.getGuildChannels({ guildId: ctx.guildId })
    const textChannels = (result.channels as { id: string; name?: string; type: number }[])
      .filter((c) => c.type === 0)
      .slice(0, 15)

    if (textChannels.length === 0) {
      await ctx.sendText('No text channels found. That seems... wrong.')
      return
    }

    const lines = textChannels.map((c) => `• #${c.name ?? c.id}`)
    await ctx.sendText(`**Server Channels:**\n${lines.join('\n')}`)
  } catch {
    await ctx.sendText('*The Arena Scribe drops their quill.* Could not fetch channels.')
  }
}

export const infoCommands = new Map<string, CommandHandler>([
  ['!help', handleHelp],
  ['!profile', handleProfile],
  ['!leaderboard', handleLeaderboard],
  ['!title', handleTitle],
  ['!titles', handleTitle],
  ['!channels', handleChannels],
])
