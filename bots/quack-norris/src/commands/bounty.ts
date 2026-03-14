import type { CommandHandler } from '../lib/command-context'
import { type LocationId } from '../lib/locations'
import { getNpcsAtLocation } from '../lib/npcs'
import { parseQuestState } from '../lib/profile'
import { generateBountyQuest, getGeneratedQuestsFromProfile, serializeGeneratedQuests } from '../lib/quest-generator'
import { getAvailableQuestsFromNpc } from '../lib/quests'
import { saveProfile } from '../lib/save-profile'

const BOUNTY_COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours

const handleBounty: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const qs = parseQuestState(profile.questState)

  // Check: already has an active generated bounty?
  const activeBounty = qs.activeQuests.find((q) => q.questId.startsWith('bounty_'))
  if (activeBounty) {
    const genQuests = getGeneratedQuestsFromProfile(profile.questState)
    const def = genQuests.find((g) => g.id === activeBounty.questId)
    await ctx.sendText(
      `You already have an active bounty: **${def?.name ?? activeBounty.questId}**. Complete or \`!abandon\` it first.`,
      true
    )
    return
  }

  // Check cooldown
  const lastCompleted = (qs as Record<string, unknown>).lastBountyCompletedAt as string | undefined
  if (lastCompleted) {
    const elapsed = Date.now() - new Date(lastCompleted).getTime()
    if (elapsed < BOUNTY_COOLDOWN_MS) {
      const hoursLeft = Math.ceil((BOUNTY_COOLDOWN_MS - elapsed) / (60 * 60 * 1000))
      await ctx.sendText(`The bounty board refreshes in ~${hoursLeft}h. Check back later!`, true)
      return
    }
  }

  // Pick an NPC at current location to be the quest giver
  const npcsHere = getNpcsAtLocation(profile.currentLocation as LocationId)
  if (npcsHere.length === 0) {
    await ctx.sendText('There are no NPCs here to post bounties. Travel somewhere with characters!', true)
    return
  }

  // Prefer an NPC that has no remaining hardcoded quests
  const completedIds = qs.completedQuests.map((q) => q.questId)
  const activeIds = qs.activeQuests.map((q) => q.questId)
  let giverNpc = npcsHere.find((npc) => {
    const available = getAvailableQuestsFromNpc(npc.id, profile.level ?? 1, completedIds, activeIds, qs.completedQuests)
    return available.length === 0
  })
  if (!giverNpc) {
    giverNpc = npcsHere[Math.floor(Math.random() * npcsHere.length)]!
  }

  await ctx.sendText(`*${giverNpc.name} rummages through a stack of papers...* "Hold on, I might have something..."`)

  // Generate the bounty
  const genQuests = getGeneratedQuestsFromProfile(profile.questState)
  const completedBountyNames = genQuests.filter((g) => completedIds.includes(g.id)).map((g) => g.name)

  let result: Awaited<ReturnType<typeof generateBountyQuest>>
  try {
    result = await generateBountyQuest(
      giverNpc.id,
      profile.level ?? 1,
      profile.currentLocation as LocationId,
      completedBountyNames
    )
  } catch {
    await ctx.sendText(
      `*${giverNpc.name} drops the papers.* "Ah... the bounty board is being restocked. Try again in a moment!"`,
      true
    )
    return
  }

  const { generated, definition } = result

  // Store definition and create active quest progress
  const updatedGenQuests = [...genQuests, definition]
  qs.activeQuests.push({
    questId: definition.id,
    currentStepId: definition.steps[0]!.id,
    objectiveProgress: {},
    startedAt: new Date().toISOString(),
    choicesMade: [],
  })
  ;(qs as Record<string, unknown>).generatedQuestsJson = serializeGeneratedQuests(updatedGenQuests)
  profile.questState = qs as typeof profile.questState
  await saveProfile(profile)
  ctx.invalidateCache()

  // Display the bounty
  const step = definition.steps[0]!
  let bountyText = `${definition.emoji} **Bounty: ${definition.name}**\n*${definition.description}*\n\n`
  if (generated.flavorText) {
    bountyText += `${generated.flavorText}\n\n`
  }
  bountyText += '**Objectives:**'
  for (const obj of step.objectives) {
    bountyText += `\n⬜ ${obj.description} (0/${obj.count})`
  }
  const rewardParts = definition.rewards.map((r) => {
    if (r.type === 'xp') {
      return `+${r.value} XP`
    }
    if (r.type === 'breadcrumbs') {
      return `+${r.value} 🍞`
    }
    return String(r.value)
  })
  bountyText += `\n\n**Rewards:** ${rewardParts.join(', ')}`

  await ctx.sendText(bountyText, true)
}

export const bountyCommands = new Map<string, CommandHandler>([['!bounty', handleBounty]])
