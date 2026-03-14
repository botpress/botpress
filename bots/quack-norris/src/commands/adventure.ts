import type {
  CommandContext,
  CommandHandler,
  ProfileRow,
  SendFn,
  SetStateFn,
  QuestAdvanceFn,
} from '../lib/command-context'
import { rollEncounter, resolveEncounterChoice, getEncounterById, formatEncounter } from '../lib/encounters'
import { ITEMS, addItemToInventory } from '../lib/items'
import { ALL_LOCATION_IDS, formatLocationList, getLocationByIndex, TOLL_RATES, type LocationId } from '../lib/locations'
import { getNpcsAtLocation, formatNpcList } from '../lib/npcs'
import { parseAdventureState } from '../lib/profile'
import {
  awardXp,
  renderLevelUp,
  XP_AWARDS,
  BREADCRUMB_AWARDS,
  checkTitleUnlocks,
  getTitleName,
  checkMilestones,
} from '../lib/progression'
import { getQuestById, type QuestProgress } from '../lib/quests'
import { saveProfile } from '../lib/save-profile'

// --- !startGame ---
const handleStartGame: CommandHandler = async (ctx) => {
  const displayName = await ctx.getDisplayName()
  const result = await ctx.actions.startAdventure({
    discordUserId: ctx.discordUserId,
    displayName,
    guildId: ctx.guildId,
    force: false,
  })
  await ctx.sendText(result.message)
  if (result.success && result.tutorialText) {
    const p = await ctx.loadProfile()
    if (p) {
      await ctx.setInteractionState(p, { awaitingChoice: 'encounter' })
    }
    await ctx.sendText(result.tutorialText)
  }
}

// --- !startGameForce ---
const handleStartGameForce: CommandHandler = async (ctx) => {
  const displayName = await ctx.getDisplayName()
  const result = await ctx.actions.startAdventure({
    discordUserId: ctx.discordUserId,
    displayName,
    guildId: ctx.guildId,
    force: true,
  })
  await ctx.sendText(result.message)
  if (result.success && result.tutorialText) {
    const p = await ctx.loadProfile()
    if (p) {
      await ctx.setInteractionState(p, { awaitingChoice: 'encounter' })
    }
    await ctx.sendText(result.tutorialText)
  }
}

// --- Daily encounter refresh (resets non-tutorial encounters every 20 hours) ---
const ENCOUNTER_REFRESH_HOURS = 20
const maybeRefreshEncounters = async (ctx: CommandContext, profile: ProfileRow): Promise<void> => {
  const advState = parseAdventureState(profile.adventureState)
  const lastReset = advState.lastEncounterResetAt
  if (lastReset) {
    const hoursSinceReset = (Date.now() - new Date(lastReset).getTime()) / (1000 * 60 * 60)
    if (hoursSinceReset < ENCOUNTER_REFRESH_HOURS) {
      return
    }
  }
  // Reset all encounters except tutorial
  const kept = (profile.adventureState.encountersCompleted as string[]).filter((id: string) =>
    id.startsWith('tutorial')
  )
  await ctx.withProfile((p) => ({
    ...p,
    adventureState: {
      ...p.adventureState,
      encountersCompleted: kept,
      lastEncounterResetAt: new Date().toISOString(),
    },
  }))
  profile.adventureState = {
    ...profile.adventureState,
    encountersCompleted: kept,
    lastEncounterResetAt: new Date().toISOString(),
  }
}

// --- !explore ---
const handleExplore: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  // Refresh encounters daily so locations never permanently run out
  await maybeRefreshEncounters(ctx, profile)

  const locationId = profile.currentLocation as LocationId
  const qs = profile.questState as { activeQuests?: QuestProgress[] } | undefined
  const activeQuestSteps = (qs?.activeQuests ?? [])
    .map((q) => {
      const def = getQuestById(q.questId)
      return def ? { questId: q.questId, stepId: q.currentStepId } : undefined
    })
    .filter((s): s is { questId: string; stepId: string } => s !== undefined)
  const encounter = rollEncounter(locationId, profile.adventureState.encountersCompleted, activeQuestSteps)

  if (!encounter) {
    await ctx.sendText(
      '*You search every corner but find nothing new.* This area is fully explored for now.\n\n' +
        'Encounters refresh every **20 hours** — try `!travel` to visit a new location, ' +
        'or come back later for fresh encounters!',
      true
    )
    return
  }

  await ctx.withProfile((p) => ({
    ...p,
    adventureState: {
      ...p.adventureState,
      activeEncounterId: encounter.id,
      encounterStep: 1,
      lastExploreAt: new Date().toISOString(),
      awaitingChoice: 'encounter',
    },
  }))

  const formatted = formatEncounter(encounter)
  await ctx.sendText(`${formatted}\n\n*Reply with a number to choose.*`, true)
}

// --- !travel ---
const handleTravel: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const locationId = profile.currentLocation as LocationId
  const locationList = formatLocationList(locationId, profile.unlockedLocations)
  await ctx.setInteractionState(profile, { awaitingChoice: 'travel' })
  await ctx.sendText(`**Where will you go?**\n\n${locationList}\n\n*Reply with a number to travel.*`, true)
}

// --- !look ---
const handleLook: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }
  const npcsHere = getNpcsAtLocation(profile.currentLocation as LocationId)
  if (npcsHere.length === 0) {
    await ctx.sendText('Nobody of interest is here right now.', true)
    return
  }
  await ctx.sendText(`**NPCs here:**\n${formatNpcList(npcsHere)}\n\n*Use \`!talk <name>\` to interact.*`, true)
}

// --- Encounter choice handler ---
export const handleEncounterChoice = async (
  profile: ProfileRow,
  choiceNum: number,
  send: SendFn,
  setState: SetStateFn,
  advanceQuests: QuestAdvanceFn
): Promise<void> => {
  const encounter = getEncounterById(profile.adventureState.activeEncounterId!)
  if (!encounter) {
    await setState(profile, { awaitingChoice: 'none' })
    await send(
      '*The encounter fades into mist...* Something went wrong. Type `!explore` to find a new adventure.',
      true
    )
    return
  }

  const choice = resolveEncounterChoice(encounter, choiceNum)
  if (!choice) {
    await send(`Invalid choice. Pick 1-${encounter.choices.length}.`)
    return
  }

  let resultText = choice.outcome

  // Award item if applicable
  const inventory = [...profile.inventory]
  if (choice.reward) {
    const added = addItemToInventory(inventory, choice.reward)
    const itemDef = ITEMS[choice.reward]
    if (added) {
      resultText += `\n\n**Item acquired:** ${itemDef.emoji} ${itemDef.name} — *${itemDef.effect}*`
      resultText += '\n*Use `!use <name>` during tournament combat to gain an edge!*'
    } else {
      resultText += `\n\n*Your inventory is full! ${itemDef.emoji} ${itemDef.name} was lost... Use \`!drop <item>\` to make room.*`
    }
  }

  // Apply breadcrumb risk/reward from encounter choice
  const bcDelta = choice.breadcrumbDelta ?? 0
  if (bcDelta < 0) {
    const loss = Math.min(Math.abs(bcDelta), profile.breadcrumbs ?? 0)
    profile.breadcrumbs = (profile.breadcrumbs ?? 0) - loss
    if (loss > 0) {
      resultText += `\n\n*Lost ${loss} 🍞 from the ordeal.*`
    }
  } else if (bcDelta > 0) {
    profile.breadcrumbs = (profile.breadcrumbs ?? 0) + bcDelta
    resultText += `\n\n*Gained ${bcDelta} bonus 🍞!*`
  }

  // Apply XP risk/reward from encounter choice
  const xpDelta = choice.xpDelta ?? 0
  if (xpDelta > 0) {
    profile.xp = (profile.xp ?? 0) + xpDelta
    resultText += `\n*Gained ${xpDelta} bonus XP!*`
  } else if (xpDelta < 0) {
    const xpLoss = Math.min(Math.abs(xpDelta), profile.xp ?? 0)
    profile.xp = Math.max(0, (profile.xp ?? 0) - xpLoss)
    if (xpLoss > 0) {
      resultText += `\n*Lost ${xpLoss} XP from the setback.*`
    }
  }

  // Award XP + breadcrumbs for encounter completion (doubled by Breadcrumb Magnet)
  const xpGain = XP_AWARDS.encounter
  const hasBcBoost = profile.adventureState.breadcrumbBoostActive === true
  const bcGain = hasBcBoost ? BREADCRUMB_AWARDS.encounter * 2 : BREADCRUMB_AWARDS.encounter
  const xpResult = awardXp(profile.xp ?? 0, xpGain)
  profile.xp = xpResult.newXp
  profile.breadcrumbs = (profile.breadcrumbs ?? 0) + bcGain
  profile.level = xpResult.newLevel
  if (hasBcBoost) {
    resultText += `\n\n*+${xpGain} XP, +${bcGain} 🍞 (🧲 Breadcrumb Magnet doubled!)*`
  } else {
    resultText += `\n\n*+${xpGain} XP, +${bcGain} 🍞*`
  }
  if (xpResult.leveledUp) {
    resultText += renderLevelUp(xpResult.oldLevel, xpResult.newLevel, xpResult.newXp)
  }

  const completed = [...profile.adventureState.encountersCompleted, encounter.id]
  profile.inventory = inventory
  profile.adventureState = {
    ...profile.adventureState,
    activeEncounterId: undefined,
    encounterStep: 0,
    encountersCompleted: completed,
    awaitingChoice: 'none',
    pendingQuestId: undefined,
    pendingNpcId: undefined,
    breadcrumbBoostActive: false,
  }

  // Check title unlocks before saving
  const newTitles = checkTitleUnlocks(profile as Parameters<typeof checkTitleUnlocks>[0])
  if (newTitles.length > 0) {
    profile.titlesUnlocked = [...(profile.titlesUnlocked ?? []), ...newTitles]
    for (const t of newTitles) {
      resultText += `\n🏆 Title unlocked: **${getTitleName(t)}**`
    }
  }

  // Check milestone celebrations
  const prevMilestone = (profile.adventureState.lastMilestoneIndex as number) ?? -1
  const milestoneResult = checkMilestones(profile as Parameters<typeof checkMilestones>[0], prevMilestone)
  if (milestoneResult.messages.length > 0) {
    resultText += '\n\n' + milestoneResult.messages.join('\n')
    profile.adventureState = {
      ...profile.adventureState,
      lastMilestoneIndex: milestoneResult.newIndex,
    }
  }

  // Single save for all encounter mutations
  await saveProfile(profile)

  // Advance quest objectives (uses withProfile for its own atomic read-modify-write)
  const locationId = profile.currentLocation as LocationId
  const questMsgs = await advanceQuests('completeEncounter', locationId)
  if (questMsgs.length > 0) {
    resultText += '\n' + questMsgs.join('\n')
  }

  // Check for collectItem objectives if item was rewarded
  if (choice.reward) {
    const itemMsgs = await advanceQuests('collectItem', choice.reward)
    if (itemMsgs.length > 0) {
      resultText += '\n' + itemMsgs.join('\n')
    }
  }

  // Post-tutorial onboarding
  if (encounter.id === 'tutorial_basics') {
    resultText += '\n\n---'
    resultText += "\n**Welcome to The Pond Eternal!** Here's what to do next:"
    resultText += '\n'
    resultText += '\n1. `!explore` — Explore the Coliseum for more encounters and loot'
    resultText += "\n2. `!look` — See who's around. Talk to NPCs with `!talk <name>`"
    resultText += '\n3. `!talk duchess` — The Duchess has quests for you (once you hit level 2)'
    resultText += "\n4. `!travel` — Visit other locations when you're ready"
    resultText += '\n5. `!daily` — Pick up a daily quest for bonus rewards'
    resultText += '\n'
    resultText += '\n*Explore and complete encounters to earn XP and level up. Quests unlock at level 2!*'
  } else {
    resultText += '\n\n*Type `!explore` to continue exploring or `!travel` to move on.*'
  }
  await send(resultText, true)
}

// --- Travel choice handler ---
export const handleTravelChoice = async (
  profile: ProfileRow,
  choiceNum: number,
  send: SendFn,
  setState: SetStateFn,
  advanceQuests: QuestAdvanceFn
): Promise<void> => {
  const location = getLocationByIndex(choiceNum)
  if (!location) {
    await send(`Invalid choice. Pick 1-${ALL_LOCATION_IDS.length}.`)
    return
  }

  if (location.id === profile.currentLocation) {
    await send("You're already here! Pick a different destination.")
    return
  }

  // Check if location is unlocked
  const unlocked = profile.unlockedLocations ?? [
    'coliseum',
    'puddle',
    'highway',
    'quackatoa',
    'parkBench',
    'frozenPond',
  ]
  if (!unlocked.includes(location.id)) {
    let lockMsg = `🔒 **${location.name}** is locked.`
    if (location.requiresQuestId) {
      const quest = getQuestById(location.requiresQuestId)
      lockMsg += ` Complete **${quest?.name ?? location.requiresQuestId}** to unlock.`
    }
    if (location.requiresLevel) {
      lockMsg += ` Requires level ${location.requiresLevel}.`
    }
    await send(lockMsg, true)
    return
  }

  // Charge toll for gated locations (first visit after unlocking is free)
  const tollDef = TOLL_RATES[location.id]
  let tollCharged = false
  let tollCost = 0
  if (tollDef) {
    const travelAdvState = parseAdventureState(profile.adventureState)
    const visitedGated = travelAdvState.visitedGatedLocations
    const hasVisitedBefore = visitedGated.includes(location.id)
    if (hasVisitedBefore) {
      const bc = profile.breadcrumbs ?? 0
      tollCost = tollDef.cost
      if (bc < tollCost) {
        await send(
          `Entry to **${location.name}** costs **${tollCost} 🍞**. You only have ${bc} 🍞 — not enough to enter.`,
          true
        )
        return
      }
      profile.breadcrumbs = bc - tollCost
      tollCharged = true
    } else {
      profile.adventureState = {
        ...profile.adventureState,
        visitedGatedLocations: [...visitedGated, location.id],
      }
    }
  }

  profile.currentLocation = location.id
  profile.adventureState = { ...profile.adventureState, awaitingChoice: 'none' }
  await saveProfile(profile)

  // Advance quest objectives (uses withProfile for atomic quest updates)
  const questMsgs = await advanceQuests('visitLocation', location.id)
  let travelText = ''
  if (tollCharged && tollCost > 0) {
    travelText += `*Entry toll: -${tollCost} 🍞 (${profile.breadcrumbs} 🍞 remaining)*\n\n`
  }
  travelText += `${location.arrivalText}\n\n*Type \`!explore\` to look around or \`!travel\` to move on.*`
  if (questMsgs.length > 0) {
    travelText += '\n' + questMsgs.join('\n')
  }

  // Show NPCs at this location
  const npcsHere = getNpcsAtLocation(location.id)
  if (npcsHere.length > 0) {
    travelText += `\n\n**NPCs here:** ${npcsHere.map((n) => `${n.emoji} ${n.name}`).join(', ')} — use \`!talk <name>\``
  }

  await send(travelText, true)
}

// --- !cancel ---
const handleCancel: CommandHandler = async (ctx) => {
  const profile = await ctx.loadProfile()
  if (!profile) {
    await ctx.sendText("You haven't started your adventure yet! Type `!startGame` first.")
    return
  }

  const advState = parseAdventureState(profile.adventureState)
  if (advState.awaitingChoice === 'none' && !advState.activeEncounterId) {
    await ctx.sendText("Nothing to cancel — you're free to roam!", true)
    return
  }

  await ctx.withProfile((p) => ({
    ...p,
    adventureState: {
      ...p.adventureState,
      awaitingChoice: 'none',
      activeEncounterId: undefined,
      pendingQuestId: undefined,
      pendingNpcId: undefined,
    },
  }))

  await ctx.sendText(
    '*You step back and clear your head.* Action cancelled. Type `!help` to see what you can do.',
    true
  )
}

export const adventureCommands = new Map<string, CommandHandler>([
  ['!startGame', handleStartGame],
  ['!startGameForce', handleStartGameForce],
  ['!explore', handleExplore],
  ['!travel', handleTravel],
  ['!look', handleLook],
  ['!cancel', handleCancel],
])
