import type { CommandHandler, ProfileRow, SendFn, SetStateFn, CompleteQuestFn } from '../lib/command-context'
import { ITEMS, addItemToInventory } from '../lib/items'
import { LOCATIONS, type LocationId } from '../lib/locations'
import { getNpcsAtLocation, getNpcById, resolveNpcAlias } from '../lib/npcs'
import { parseAdventureState, parseQuestState } from '../lib/profile'
import { awardXp, renderLevelUp, getTitleName } from '../lib/progression'
import { buildQuestLookup, getGeneratedQuestsFromProfile } from '../lib/quest-generator'
import {
  ALL_QUESTS,
  getQuestById,
  getAvailableQuestsFromNpc,
  getCurrentStep,
  advanceToNextStep,
  formatQuestJournal,
  type QuestProgress,
} from '../lib/quests'
import { saveProfile } from '../lib/save-profile'
import { PlayersTable } from '../tables/Players'

// --- !quests / !journal ---
const handleQuests: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }
  const qs = parseQuestState(profile.questState)
  const genQuests = getGeneratedQuestsFromProfile(profile.questState)
  const journal = formatQuestJournal(
    qs?.activeQuests ?? [],
    qs?.completedQuests ?? [],
    profile.level ?? 1,
    profile.currentLocation as LocationId,
    genQuests
  )
  await ctx.sendText(journal, true)
}

// --- !talk ---
const handleTalk: CommandHandler = async (ctx) => {
  if (!ctx.args[0]) {
    await ctx.sendText("Who do you want to talk to? Type `!talk <name>` — try `!look` to see who's around.")
    return
  }

  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const npcId = resolveNpcAlias(ctx.args.join(' '))
  if (!npcId) {
    await ctx.sendText(`Unknown NPC "${ctx.args.join(' ')}". Check who's here with \`!look\`.`, true)
    return
  }

  const npc = getNpcById(npcId)
  if (!npc) {
    await ctx.sendText('That NPC does not exist.', true)
    return
  }

  // Check NPC is at current location
  const npcsHere = getNpcsAtLocation(profile.currentLocation as LocationId)
  if (!npcsHere.some((n) => n.id === npcId)) {
    await ctx.sendText(
      `${npc.emoji} **${npc.name}** is not at your current location. They're at ${LOCATIONS[npc.location]?.name ?? npc.location}.`,
      true
    )
    return
  }

  // Advance talkToNpc quest objectives
  const questMsgs = await ctx.advanceQuestObjectives('talkToNpc', npcId)

  // Check for active quests with this NPC
  const qs = parseQuestState(profile.questState)
  const activeIds = qs?.activeQuests.map((q) => q.questId) ?? []
  const completedIds = qs?.completedQuests.map((q) => q.questId) ?? []

  // Check for quests available from this NPC
  const available = getAvailableQuestsFromNpc(npcId, profile.level ?? 1, completedIds, activeIds, qs?.completedQuests)

  // Check if the player has completed any quests given by this NPC
  const npcQuestIds = ALL_QUESTS.filter((q) => q.giverNpc === npcId).map((q) => q.id)
  const hasCompletedNpcQuest = npcQuestIds.some((qId) => completedIds.includes(qId))
  // Chad's postQuestDialogue only triggers if chad_redemption specifically was completed
  const usePostQuestDialogue =
    npc.dialogue.postQuestDialogue &&
    hasCompletedNpcQuest &&
    (npcId !== 'chad' || completedIds.includes('chad_redemption'))

  let responseText = ''
  if (questMsgs.length > 0) {
    responseText += questMsgs.join('\n') + '\n\n'
  }

  if (available.length > 0) {
    const quest = available[0]!
    // If the player has history with this NPC, greet with postQuestDialogue before the quest offer
    if (usePostQuestDialogue) {
      responseText += `${npc.dialogue.postQuestDialogue}\n\n`
    }
    responseText += `${npc.dialogue.questAvailable}\n\n`
    responseText += `📜 **${quest.emoji} ${quest.name}** — *${quest.description}*\n\n`
    responseText += '**1.** Accept quest\n**2.** Decline'
    await ctx.setInteractionState(profile, {
      awaitingChoice: 'quest_accept',
      pendingQuestId: quest.id,
      pendingNpcId: npcId,
    })
  } else {
    // Check if NPC has quests in progress
    const talkGenQuests = getGeneratedQuestsFromProfile(profile.questState)
    const talkLookup = buildQuestLookup(talkGenQuests)
    const inProgress = qs?.activeQuests.find((q) => {
      const qDef = talkLookup(q.questId)
      return qDef?.giverNpc === npcId
    })
    if (inProgress) {
      responseText += npc.dialogue.questInProgress
    } else if (usePostQuestDialogue) {
      responseText += npc.dialogue.postQuestDialogue
    } else if (questMsgs.length === 0) {
      responseText += npc.dialogue.greeting
    }
  }

  await ctx.sendText(responseText, true)
}

// --- !daily ---
const handleDaily: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const qs = parseQuestState(profile.questState)

  // Check if any daily is already active
  const activeDaily = qs?.activeQuests.find((q) => {
    const def = getQuestById(q.questId)
    return def?.category === 'daily'
  })
  if (activeDaily) {
    const def = getQuestById(activeDaily.questId)
    await ctx.sendText(
      `You already have an active daily: **${def?.name ?? activeDaily.questId}**. Complete it first!`,
      true
    )
    return
  }

  // Find available dailies
  const dailies = ALL_QUESTS.filter((q) => q.category === 'daily' && q.levelRequired <= (profile.level ?? 1))
  if (dailies.length === 0) {
    await ctx.sendText('No daily quests available yet. Keep leveling up!', true)
    return
  }

  // Pick a random daily that isn't on cooldown
  const now = Date.now()
  const availableDailies = dailies.filter((d) => {
    const completed = qs?.completedQuests
      .filter((c) => c.questId === d.id)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    const last = completed?.[0]
    if (!last) {
      return true
    }
    const cooldownMs = (d.cooldownHours ?? 20) * 60 * 60 * 1000
    return now - new Date(last.completedAt).getTime() > cooldownMs
  })

  if (availableDailies.length === 0) {
    // Find next available cooldown
    const nextAvailable = dailies.reduce((earliest: number | null, d) => {
      const completed = qs?.completedQuests
        .filter((c) => c.questId === d.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      const last = completed?.[0]
      if (!last) {
        return earliest
      }
      const cooldownMs = (d.cooldownHours ?? 20) * 60 * 60 * 1000
      const readyAt = new Date(last.completedAt).getTime() + cooldownMs
      return earliest === null || readyAt < earliest ? readyAt : earliest
    }, null)
    const timeLeft = nextAvailable ? nextAvailable - now : 0
    const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000))
    const timeHint = hoursLeft > 0 ? ` Next daily in ~${hoursLeft}h.` : ''
    await ctx.sendText(`You've completed all available dailies recently.${timeHint}`, true)
    return
  }

  const daily = availableDailies[Math.floor(Math.random() * availableDailies.length)]!
  const newQuest: QuestProgress = {
    questId: daily.id,
    currentStepId: daily.steps[0]!.id,
    objectiveProgress: {},
    startedAt: new Date().toISOString(),
    choicesMade: [],
  }
  const questState = qs ?? { activeQuests: [], completedQuests: [] }
  questState.activeQuests.push(newQuest)
  await PlayersTable.upsertRows({
    rows: [{ ...profile, questState, version: ((profile.version as number) ?? 0) + 1 }],
    keyColumn: 'discordUserId',
  })
  ctx.invalidateCache()

  const step = daily.steps[0]!
  let dailyText = `${daily.emoji} **Daily Quest: ${daily.name}**\n*${daily.description}*\n\n**Objectives:**`
  for (const obj of step.objectives) {
    dailyText += `\n⬜ ${obj.description} (0/${obj.count})`
  }
  const rewardParts = daily.rewards.map((r) => {
    if (r.type === 'xp') {
      return `+${r.value} XP`
    }
    if (r.type === 'breadcrumbs') {
      return `+${r.value} 🍞`
    }
    return String(r.value)
  })
  dailyText += `\n\n**Rewards:** ${rewardParts.join(', ')}`
  await ctx.sendText(dailyText, true)
}

// --- !abandon ---
const handleAbandon: CommandHandler = async (ctx) => {
  if (!ctx.args[0]) {
    await ctx.sendText('Which quest? Type `!abandon <quest name>`. Check `!quests` for your active quests.')
    return
  }

  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const questInput = ctx.args.join(' ').toLowerCase()
  const qs = parseQuestState(profile.questState)
  if (!qs || qs.activeQuests.length === 0) {
    await ctx.sendText('You have no active quests to abandon.')
    return
  }

  const genQuests = getGeneratedQuestsFromProfile(profile.questState)
  const lookup = buildQuestLookup(genQuests)

  const match = qs.activeQuests.find((q) => {
    const def = lookup(q.questId)
    return def?.name.toLowerCase().includes(questInput) || q.questId.includes(questInput)
  })
  if (!match) {
    await ctx.sendText(`No active quest matching "${ctx.args.join(' ')}". Check \`!quests\`.`)
    return
  }

  qs.activeQuests = qs.activeQuests.filter((q) => q.questId !== match.questId)
  profile.questState = qs as typeof profile.questState
  await saveProfile(profile)

  ctx.invalidateCache()
  const def = lookup(match.questId)
  await ctx.sendText(`Quest **${def?.name ?? match.questId}** abandoned. You can pick it up again later.`, true)
}

// --- Quest choice handler ---
export const handleQuestChoice = async (
  profile: ProfileRow,
  choiceNum: number,
  send: SendFn,
  setState: SetStateFn,
  completeQuestFn: CompleteQuestFn
): Promise<void> => {
  const advState = parseAdventureState(profile.adventureState)
  const questId = advState.pendingQuestId
  if (!questId) {
    await setState(profile, { awaitingChoice: 'none' })
    return
  }

  const qs = parseQuestState(profile.questState)
  const quest = qs?.activeQuests.find((q) => q.questId === questId)
  const genQuests = getGeneratedQuestsFromProfile(profile.questState)
  const lookup = buildQuestLookup(genQuests)
  const def = lookup(questId)
  if (!quest || !def) {
    await setState(profile, { awaitingChoice: 'none' })
    return
  }

  const step = getCurrentStep(quest, def)
  if (!step?.choices || choiceNum < 1 || choiceNum > step.choices.length) {
    await send(`Invalid choice. Pick 1-${step?.choices?.length ?? 1}.`)
    return
  }

  const choice = step.choices[choiceNum - 1]!
  quest.choicesMade.push(choice.label)

  let responseText = choice.narrative

  // Award choice-specific rewards
  if (choice.rewards) {
    for (const reward of choice.rewards) {
      if (reward.type === 'title' && !profile.titlesUnlocked.includes(reward.value as string)) {
        profile.titlesUnlocked = [...profile.titlesUnlocked, reward.value as string]
        responseText += `\n🏆 Title unlocked: **${getTitleName(reward.value as string)}**`
      } else if (reward.type === 'item') {
        const added = addItemToInventory(profile.inventory, reward.value as string)
        if (added) {
          const itemDef = ITEMS[reward.value as keyof typeof ITEMS]
          responseText += `\n📦 Item received: ${itemDef?.emoji ?? '✨'} ${itemDef?.name ?? reward.value}`
        }
      } else if (reward.type === 'breadcrumbs') {
        profile.breadcrumbs = (profile.breadcrumbs ?? 0) + (reward.value as number)
        responseText += `\n+${reward.value} 🍞`
      } else if (reward.type === 'xp') {
        const choiceXpResult = awardXp(profile.xp ?? 0, reward.value as number)
        profile.xp = choiceXpResult.newXp
        profile.level = choiceXpResult.newLevel
        responseText += `\n+${reward.value} XP`
        if (choiceXpResult.leveledUp) {
          responseText += renderLevelUp(choiceXpResult.oldLevel, choiceXpResult.newLevel, choiceXpResult.newXp)
        }
      }
    }
  }

  // Advance to next step
  const advance = advanceToNextStep(quest, def, choice.nextStepId)
  if (advance.completed) {
    const completeMsgs = await completeQuestFn(profile, quest, def)
    responseText += '\n' + completeMsgs.join('\n')
  } else if (advance.nextStep?.dialogueOnStart) {
    responseText += `\n\n📜 ${advance.nextStep.dialogueOnStart}`
  }

  profile.adventureState = {
    ...profile.adventureState,
    awaitingChoice: 'none',
    pendingQuestId: undefined,
    pendingNpcId: undefined,
  }
  profile.questState = qs as typeof profile.questState
  await saveProfile(profile)

  await send(responseText, true)
}

// --- Quest accept handler ---
export const handleQuestAccept = async (profile: ProfileRow, send: SendFn, setState: SetStateFn): Promise<void> => {
  const advState = parseAdventureState(profile.adventureState)
  const questId = advState.pendingQuestId
  if (!questId) {
    await setState(profile, { awaitingChoice: 'none' })
    return
  }

  const def = getQuestById(questId)
  if (!def) {
    await setState(profile, { awaitingChoice: 'none' })
    return
  }

  const newQuest: QuestProgress = {
    questId: def.id,
    currentStepId: def.steps[0]!.id,
    objectiveProgress: {},
    startedAt: new Date().toISOString(),
    choicesMade: [],
  }

  const qs = parseQuestState(profile.questState)
  qs.activeQuests.push(newQuest)

  profile.adventureState = {
    ...profile.adventureState,
    awaitingChoice: 'none',
    pendingQuestId: undefined,
    pendingNpcId: undefined,
  }
  profile.questState = qs as typeof profile.questState
  await saveProfile(profile)

  const firstStep = def.steps[0]!
  let acceptText = `📜 **Quest accepted: ${def.emoji} ${def.name}**`
  if (firstStep.dialogueOnStart) {
    acceptText += `\n\n${firstStep.dialogueOnStart}`
  }
  acceptText += `\n\n**Objective:** ${firstStep.description}`
  for (const obj of firstStep.objectives) {
    acceptText += `\n⬜ ${obj.description} (0/${obj.count})`
  }

  await send(acceptText, true)
}

export const questCommands = new Map<string, CommandHandler>([
  ['!quests', handleQuests],
  ['!journal', handleQuests],
  ['!talk', handleTalk],
  ['!daily', handleDaily],
  ['!abandon', handleAbandon],
])
