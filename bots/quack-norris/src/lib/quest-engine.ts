import type { ProfileRow, InteractionState } from './command-context'
import { addItemToInventory, ITEMS } from './items'
import { LOCATIONS, type LocationId } from './locations'
import { parseQuestState } from './profile'
import { awardXp, renderLevelUp, checkTitleUnlocks, getTitleName } from './progression'
import {
  getQuestById,
  getCurrentStep,
  checkObjectiveProgress,
  isStepComplete,
  advanceToNextStep,
  type QuestDefinition,
  type QuestProgress,
  type QuestObjectiveType,
} from './quests'

export type QuestDefLookup = (id: string) => QuestDefinition | undefined

// --- Quest completion (pure profile mutation — no DB writes) ---

export const completeQuestForProfile = (
  profile: ProfileRow,
  quest: QuestProgress,
  def: ReturnType<typeof getQuestById> & object
): string[] => {
  const msgs: string[] = []
  const qs = parseQuestState(profile.questState)

  qs.activeQuests = qs.activeQuests.filter((q) => q.questId !== quest.questId)
  qs.completedQuests.push({
    questId: quest.questId,
    completedAt: new Date().toISOString(),
    choicesMade: quest.choicesMade,
  })
  if (quest.questId.startsWith('bounty_')) {
    ;(qs as Record<string, unknown>).lastBountyCompletedAt = new Date().toISOString()
  }
  profile.questState = qs as typeof profile.questState

  let xpGain = 0
  let bcGain = 0
  for (const reward of def.rewards) {
    if (reward.type === 'xp') {
      xpGain += reward.value as number
    } else if (reward.type === 'breadcrumbs') {
      bcGain += reward.value as number
    } else if (reward.type === 'title') {
      const titleId = reward.value as string
      if (!profile.titlesUnlocked.includes(titleId)) {
        profile.titlesUnlocked = [...profile.titlesUnlocked, titleId]
        msgs.push(`🏆 Title unlocked: **${getTitleName(titleId)}**`)
      }
    } else if (reward.type === 'locationUnlock') {
      const locId = reward.value as string
      if (!profile.unlockedLocations.includes(locId)) {
        profile.unlockedLocations = [...profile.unlockedLocations, locId]
        const loc = LOCATIONS[locId as LocationId]
        msgs.push(`🔓 Location unlocked: **${loc?.emoji ?? ''} ${loc?.name ?? locId}**`)
      }
    } else if (reward.type === 'item') {
      const added = addItemToInventory(profile.inventory, reward.value as string)
      if (added) {
        const itemDef = ITEMS[reward.value as keyof typeof ITEMS]
        msgs.push(`📦 Item received: ${itemDef?.emoji ?? '✨'} ${itemDef?.name ?? reward.value}`)
      }
    }
  }

  const questXpResult = awardXp(profile.xp ?? 0, xpGain)
  profile.xp = questXpResult.newXp
  profile.breadcrumbs = (profile.breadcrumbs ?? 0) + bcGain
  profile.level = questXpResult.newLevel

  if (xpGain > 0 || bcGain > 0) {
    const parts = []
    if (xpGain > 0) {
      parts.push(`+${xpGain} XP`)
    }
    if (bcGain > 0) {
      parts.push(`+${bcGain} 🍞`)
    }
    msgs.push(`🎁 Rewards: ${parts.join(', ')}`)
  }
  if (questXpResult.leveledUp) {
    msgs.push(renderLevelUp(questXpResult.oldLevel, questXpResult.newLevel, questXpResult.newXp))
  }

  const newTitles = checkTitleUnlocks(profile as Parameters<typeof checkTitleUnlocks>[0])
  for (const t of newTitles) {
    if (!profile.titlesUnlocked.includes(t)) {
      profile.titlesUnlocked = [...profile.titlesUnlocked, t]
      msgs.push(`🏆 Title unlocked: **${getTitleName(t)}**`)
    }
  }

  msgs.unshift(`\n🎉 **Quest Complete: ${def.name}!**`)
  return msgs
}

// --- Quest objective advancement (pure profile mutation — no DB writes) ---

export type AdvanceResult = {
  messages: string[]
  changed: boolean
  interactionUpdate?: Partial<InteractionState>
}

export const advanceQuestObjectivesForProfile = (
  profile: ProfileRow,
  eventType: QuestObjectiveType,
  eventTarget?: string,
  questDefLookup?: QuestDefLookup
): AdvanceResult => {
  const messages: string[] = []
  let changed = false
  let interactionUpdate: Partial<InteractionState> | undefined
  const lookup = questDefLookup ?? getQuestById

  if (!profile.questState) {
    return { messages, changed }
  }

  const qs = parseQuestState(profile.questState)

  for (const quest of qs.activeQuests) {
    const def = lookup(quest.questId)
    if (!def) {
      continue
    }
    const result = checkObjectiveProgress(quest, def, eventType, eventTarget)
    if (!result.updated) {
      continue
    }
    changed = true
    if (result.objectiveCompleted) {
      messages.push(`✅ Quest objective complete: *${result.objectiveCompleted}*`)
    }
    if (!isStepComplete(quest, def)) {
      continue
    }
    const step = getCurrentStep(quest, def)
    if (step?.choices && step.choices.length > 0) {
      const choiceLines = step.choices.map((c, i) => `**${i + 1}.** ${c.label}`)
      messages.push(`\n📜 **${def.name}** — ${step.dialogueOnStart ?? 'A choice awaits:'}`)
      messages.push(choiceLines.join('\n'))
      interactionUpdate = {
        awaitingChoice: 'quest_choice',
        pendingQuestId: quest.questId,
      }
    } else {
      if (step?.dialogueOnComplete) {
        messages.push(`\n📜 **${def.name}** — ${step.dialogueOnComplete}`)
      }
      const advance = advanceToNextStep(quest, def)
      if (advance.completed) {
        messages.push(...completeQuestForProfile(profile, quest, def))
      } else if (advance.nextStep?.dialogueOnStart) {
        messages.push(`\n📜 Next: *${advance.nextStep.description}*`)
      }
    }
  }

  if (changed) {
    profile.questState = qs as typeof profile.questState
  }

  return { messages, changed, interactionUpdate }
}
