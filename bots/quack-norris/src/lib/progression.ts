import type { ItemType } from './items'

// --- XP & Level System ---

export const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]
export const MAX_LEVEL = 10

export const getLevelForXp = (xp: number): number => {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL[i]!) {
      return i + 1
    }
  }
  return 1
}

export const getXpToNextLevel = (xp: number): { current: number; needed: number; progress: number } => {
  const level = getLevelForXp(xp)
  if (level >= MAX_LEVEL) {
    return { current: xp, needed: 0, progress: 1 }
  }
  const currentThreshold = XP_PER_LEVEL[level - 1]!
  const nextThreshold = XP_PER_LEVEL[level]!
  return {
    current: xp - currentThreshold,
    needed: nextThreshold - currentThreshold,
    progress: (xp - currentThreshold) / (nextThreshold - currentThreshold),
  }
}

export const renderXpBar = (xp: number): string => {
  const level = getLevelForXp(xp)
  if (level >= MAX_LEVEL) {
    return '██████████ MAX'
  }
  const { current, needed } = getXpToNextLevel(xp)
  const filled = Math.round((current / needed) * 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${current}/${needed}`
}

// --- XP Award Helper ---

export type XpAwardResult = {
  newXp: number
  newLevel: number
  leveledUp: boolean
  oldLevel: number
}

export const awardXp = (currentXp: number, amount: number): XpAwardResult => {
  const oldLevel = getLevelForXp(currentXp)
  const newXp = currentXp + amount
  const newLevel = getLevelForXp(newXp)
  return { newXp, newLevel, leveledUp: newLevel > oldLevel, oldLevel }
}

const LEVEL_UNLOCKS: Record<number, string> = {
  2: '*The Arena Scribe makes a note.* "This one shows promise." New quests beckon — check `!quests`!',
  3: '*A warm wind blows across the pond.* You feel the world opening up. 🏷️ Title earned: **Pond Wanderer**',
  4: '*A shadowy figure in a trenchcoat nods from the alley.* Trenchbill has work for you — dark, profitable work.',
  5: '*Whispers travel through the Quackverse.* New side quests with rare rewards have surfaced...',
  6: '*The elders take notice.* Your reputation precedes you now. Harder encounters await.',
  7: '*A tremor shakes the Great Nest.* Something ancient stirs. The Seventh Egg quest is calling...',
  8: '*The Arena crowd chants your name.* Veterans seek your counsel. Power flows through your feathers.',
  9: '*Even Chuck Norris glances your way.* The final threshold approaches. Legends are forged here.',
  10: '*The Quackverse bows.* You have reached the pinnacle. 🏷️ Title earned: **The Unquackable**',
}

export const renderLevelUp = (oldLevel: number, newLevel: number, newXp?: number): string => {
  const xp = newXp ?? XP_PER_LEVEL[newLevel - 1] ?? 0
  const xpBar = renderXpBar(xp)
  const unlock = LEVEL_UNLOCKS[newLevel]
  const unlockLine = unlock
    ? `\n${unlock}`
    : '\n*The pond ripples with new possibilities.* Check `!quests` for what awaits.'
  return `\n🎉 **LEVEL UP!** You are now **Level ${newLevel}**!\n${xpBar} XP to next level${unlockLine}`
}

// --- XP Award Amounts ---

export const XP_AWARDS = {
  encounter: 15,
  questStep: 25,
  sideQuestComplete: 75,
  mainQuestComplete: 150,
  dailyQuestComplete: 40,
  tournamentWin: 100,
  tournamentLoss: 25,
  tournamentKill: 15,
} as const

// --- Breadcrumb Award Amounts ---

export const BREADCRUMB_AWARDS = {
  encounter: 5,
  questStep: 10,
  sideQuestComplete: 30,
  mainQuestComplete: 75,
  dailyQuestComplete: 20,
  tournamentWin: 50,
} as const

// --- Title System ---

export type TitleDefinition = {
  id: string
  name: string
  condition: string
}

export const TITLES: TitleDefinition[] = [
  { id: 'fledgling', name: 'Fledgling', condition: 'Default starting title' },
  { id: 'pond_wanderer', name: 'Pond Wanderer', condition: 'Reach level 3' },
  { id: 'breadcrumb_hunter', name: 'Breadcrumb Hunter', condition: 'Complete 10 encounters' },
  { id: 'arena_initiate', name: 'Arena Initiate', condition: 'Win 1 tournament' },
  { id: 'quack_champion', name: 'Quack Champion', condition: 'Win 5 tournaments' },
  { id: 'lorekeeper', name: 'Lorekeeper', condition: 'Complete all main quests' },
  { id: 'the_unquackable', name: 'The Unquackable', condition: 'Reach level 10' },
  { id: 'duck_of_all_trades', name: 'Duck of All Trades', condition: 'Complete 10 quests total' },
  { id: 'breadcrumb_baron', name: 'Breadcrumb Baron', condition: 'Accumulate 500 breadcrumbs' },
  {
    id: 'coliseum_regular',
    name: 'Coliseum Regular',
    condition: "Complete The Duchess's Favor (attend in finest feathers)",
  },
  { id: 'party_crasher', name: 'Party Crasher', condition: "Complete The Duchess's Favor (crash the party)" },
  { id: 'business_partner', name: 'Business Partner', condition: "Complete Trenchbill's Underworld" },
  { id: 'chads_friend', name: "Chad's Friend", condition: "Complete Chad's Redemption" },
  { id: 'documentary_star', name: 'Documentary Star', condition: 'Complete The Attenbird Documentary' },
  { id: 'harolds_apprentice', name: "Harold's Apprentice", condition: "Complete Harold's Chess Tournament" },
  { id: 'the_awakened', name: 'The Awakened', condition: 'Hatch the Seventh Egg' },
  { id: 'the_peacekeeper', name: 'The Peacekeeper', condition: 'Seal the Seventh Egg' },
]

export const checkTitleUnlocks = (profile: {
  level: number
  totalWins: number
  breadcrumbs: number
  titlesUnlocked: string[]
  adventureState: { encountersCompleted: string[] }
  questState: { completedQuests: { questId: string }[] }
}): string[] => {
  const newTitles: string[] = []
  const has = (id: string): boolean => profile.titlesUnlocked.includes(id)
  const unlock = (id: string): void => {
    if (!has(id)) {
      newTitles.push(id)
    }
  }

  if (profile.level >= 3) {
    unlock('pond_wanderer')
  }
  if (profile.level >= 10) {
    unlock('the_unquackable')
  }
  if (profile.adventureState.encountersCompleted.length >= 10) {
    unlock('breadcrumb_hunter')
  }
  if (profile.totalWins >= 1) {
    unlock('arena_initiate')
  }
  if (profile.totalWins >= 5) {
    unlock('quack_champion')
  }
  if (profile.breadcrumbs >= 500) {
    unlock('breadcrumb_baron')
  }
  if (profile.questState.completedQuests.length >= 10) {
    unlock('duck_of_all_trades')
  }

  const mainQuestIds = ['duchess_favor', 'frozen_prophecy', 'trenchbill_underworld', 'seventh_egg']
  const completedIds = profile.questState.completedQuests.map((q) => q.questId)
  if (mainQuestIds.every((id) => completedIds.includes(id))) {
    unlock('lorekeeper')
  }

  return newTitles
}

export const getTitleName = (titleId: string): string => {
  return TITLES.find((t) => t.id === titleId)?.name ?? titleId
}

// --- Milestone Celebrations ---

type MilestoneProfile = {
  breadcrumbs: number
  totalWins: number
  adventureState: { encountersCompleted: string[] }
  questState: { completedQuests: { questId: string }[] }
}

const MILESTONES = [
  {
    check: (p: MilestoneProfile) => p.breadcrumbs >= 100,
    msg: '🍞 **100 Breadcrumbs!** *The first crumbs of an empire.* The Duchess glances at your pouch with newfound respect — a fortune by fledgling standards, a mere appetiser for what lies ahead.',
  },
  {
    check: (p: MilestoneProfile) => p.breadcrumbs >= 250,
    msg: '🍞 **250 Breadcrumbs!** *The merchants of Puddle Plaza whisper your name.* With this fortune you could buy a small pond outright — or gamble it all at the Vault. The choice, as always, is yours.',
  },
  {
    check: (p: MilestoneProfile) => p.breadcrumbs >= 500,
    msg: '🍞 **500 Breadcrumbs!** *A golden warmth radiates from your pouch.* The Breadcrumb Baron themselves would tip their hat. Trenchbill mutters something about "investment opportunities." Wealth invites attention — not all of it friendly.',
  },
  {
    check: (p: MilestoneProfile) => p.adventureState.encountersCompleted.length >= 5,
    msg: '🗺️ **5 Encounters!** *The fog of the unknown begins to thin.* Paths you once feared now feel familiar. The Quackverse is vast, but you are learning its rhythms — the rustle before an ambush, the glint of hidden treasure.',
  },
  {
    check: (p: MilestoneProfile) => p.adventureState.encountersCompleted.length >= 10,
    msg: '🗺️ **10 Encounters!** *Sir David Attenbird adjusts his monocle and begins writing.* "A specimen of remarkable persistence," he murmurs into his field recorder. The world bends differently around seasoned explorers.',
  },
  {
    check: (p: MilestoneProfile) => p.adventureState.encountersCompleted.length >= 25,
    msg: "🗺️ **25 Encounters!** *The Quackverse has no more shadows you haven't touched.* Every alley, every frozen ridge, every crumbling ruin — you have walked them all. The land itself seems to nod in quiet recognition of one who has truly seen it.",
  },
  {
    check: (p: MilestoneProfile) => p.totalWins >= 1,
    msg: '⚔️ **First Tournament Win!** *The Arena falls silent, then erupts.* Chuck Norris shifts in his golden nest and delivers a single, slow nod. The crowd will forget many things — but never a first victory. The breadcrumbs remember.',
  },
  {
    check: (p: MilestoneProfile) => p.totalWins >= 5,
    msg: '⚔️ **5 Tournament Wins!** *The Arena Scribe carves your name deeper into the stone.* Five victories — not luck, not chance, but craft. The crowd chants in rhythm. Opponents study your patterns before they dare step into the ring.',
  },
  {
    check: (p: MilestoneProfile) => p.questState.completedQuests.length >= 3,
    msg: '📜 **3 Quests Complete!** *Word travels fast through the Quackverse.* The Duchess mentions you at dinner. Gerald saves you a seat. Even Trenchbill offers a grudging discount. The NPCs of this world are beginning to trust you with their deepest secrets.',
  },
  {
    check: (p: MilestoneProfile) => p.questState.completedQuests.length >= 10,
    msg: "📜 **10 Quests Complete!** *The Great Mallard's constellation shifts overhead.* You have woven yourself into the very fabric of the Quackverse. Every NPC knows your name, every tavern tells your stories, every questline bears your mark. A true Duck of All Trades.",
  },
] as const

/**
 * Check milestones and return celebration messages for newly reached ones.
 * Uses previousMilestoneIndex to avoid re-triggering and enforces ordered progression.
 */
export const checkMilestones = (
  profile: MilestoneProfile,
  previousMilestoneIndex: number
): { messages: string[]; newIndex: number } => {
  const messages: string[] = []
  let newIndex = previousMilestoneIndex

  // Advance only through contiguous newly satisfied milestones.
  // This avoids permanently skipping an earlier milestone when a later one is reached first.
  while (newIndex + 1 < MILESTONES.length && MILESTONES[newIndex + 1]!.check(profile)) {
    newIndex += 1
    messages.push(MILESTONES[newIndex]!.msg)
  }

  return { messages, newIndex }
}

// --- HUD Rendering ---

export type HudProfile = {
  displayName: string
  title: string
  level: number
  xp: number
  breadcrumbs: number
  currentLocation: string
  inventory: { type: ItemType; quantity: number }[]
  questState: { activeQuests: { questId: string; currentStepId: string }[] }
}

export const renderHud = (
  profile: HudProfile,
  locationEmoji: string,
  locationName: string,
  activeQuestName?: string,
  questStepProgress?: string
): string => {
  const titleDisplay = getTitleName(profile.title)
  const xpBar = renderXpBar(profile.xp)
  const invSlots = profile.inventory.reduce((sum, i) => sum + (i.quantity > 0 ? 1 : 0), 0)

  const lines = [
    `─── 🐤 ${profile.displayName} [${titleDisplay}] ───`,
    `Lvl ${profile.level} ${xpBar} | 🍞 ${profile.breadcrumbs} | 📍 ${locationEmoji} ${locationName} | 📦 ${invSlots}/6`,
  ]

  if (activeQuestName && questStepProgress) {
    lines.push(`Active: ${activeQuestName} (${questStepProgress})`)
  }

  return lines.join('\n')
}
