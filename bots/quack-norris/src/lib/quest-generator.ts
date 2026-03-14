import { adk, z } from '@botpress/runtime'

import { LOCATIONS, type LocationId } from './locations'
import { NPCS, type NpcId } from './npcs'
import { parseQuestState } from './profile'
import { getQuestById, type QuestDefinition, type QuestReward } from './quests'

// --- Zod schema for LLM output (constrains to valid game entities) ---

const GeneratedObjectiveSchema = z.object({
  id: z.string().describe('Unique objective ID, e.g. "bounty_obj_1"'),
  description: z.string().describe('Short player-facing description with duck puns'),
  type: z
    .enum(['talkToNpc', 'visitLocation', 'completeEncounter', 'collectItem'])
    .describe('Objective type — only these 4 are allowed'),
  target: z
    .enum([
      'duchess',
      'chad',
      'gerald',
      'bigmouth',
      'harold',
      'frostbeak',
      'trenchbill',
      'attenbird',
      'coliseum',
      'puddle',
      'highway',
      'quackatoa',
      'parkBench',
      'frozenPond',
      'hpPotion',
      'energyDrink',
      'shieldToken',
      'damageBoost',
      'mirrorShard',
      'quackGrenade',
      'breadcrumbMagnet',
      'fogBomb',
    ])
    .optional()
    .describe('Target NPC, location, or item ID. Omit for "any" target.'),
  count: z.number().min(1).max(5).describe('How many times to complete (1-5)'),
})

const GeneratedStepSchema = z.object({
  id: z.string().describe('Unique step ID, e.g. "bounty_step_1"'),
  description: z.string().describe('Short step description'),
  objectives: z.array(GeneratedObjectiveSchema).min(1).max(2),
  dialogueOnStart: z.string().optional().describe('NPC dialogue when step begins'),
  dialogueOnComplete: z.string().optional().describe('NPC dialogue when step ends'),
})

const GeneratedBountySchema = z.object({
  name: z.string().max(50).describe('Quest name with duck flavor'),
  emoji: z.string().max(4).describe('A single emoji for the quest'),
  description: z.string().max(200).describe('1-2 sentence quest description'),
  steps: z.array(GeneratedStepSchema).min(1).max(3),
  difficultyTier: z.number().min(1).max(3).describe('1=easy, 2=medium, 3=hard'),
  flavorText: z.string().max(300).describe('Opening narrative when quest is offered'),
})

type GeneratedBounty = z.infer<typeof GeneratedBountySchema>

// --- Reward scaling ---

const BOUNTY_REWARD_TABLE: Record<number, { xpBase: number; breadcrumbBase: number }> = {
  1: { xpBase: 25, breadcrumbBase: 15 },
  2: { xpBase: 40, breadcrumbBase: 25 },
  3: { xpBase: 60, breadcrumbBase: 40 },
}

export const computeBountyRewards = (playerLevel: number, difficultyTier: number): QuestReward[] => {
  const base = BOUNTY_REWARD_TABLE[difficultyTier] ?? BOUNTY_REWARD_TABLE[1]!
  const levelMultiplier = 1 + (playerLevel - 1) * 0.15
  return [
    { type: 'xp', value: Math.round(base.xpBase * levelMultiplier) },
    { type: 'breadcrumbs', value: Math.round(base.breadcrumbBase * levelMultiplier) },
  ]
}

// --- Quest generation via zai.extract ---

export const generateBountyQuest = async (
  giverNpcId: NpcId,
  playerLevel: number,
  playerLocation: LocationId,
  completedBountyNames: string[]
): Promise<{ generated: GeneratedBounty; definition: QuestDefinition }> => {
  const npc = NPCS[giverNpcId]
  const locationList = Object.values(LOCATIONS)
    .filter((l) => !l.requiresQuestId)
    .map((l) => `${l.id} (${l.name})`)
    .join(', ')

  const npcList = Object.values(NPCS)
    .map((n) => `${n.id} (${n.name})`)
    .join(', ')

  const prompt = `You are a quest designer for "Quack Norris," a duck-themed RPG set in The Pond Eternal.

WORLD CONTEXT:
- Silly, pun-filled duck RPG. Chuck Norris is an ancient duck deity.
- Absurdist humor meets classic RPG.
- NPCs: ${npcList}
- Locations: ${locationList}

QUEST GIVER: ${npc.name} at ${LOCATIONS[playerLocation]?.name ?? playerLocation}
PLAYER LEVEL: ${playerLevel}
PAST BOUNTIES: ${completedBountyNames.length > 0 ? completedBountyNames.join(', ') : 'None'}

RULES:
- 1-3 steps, 1-2 objectives per step.
- Objective types: talkToNpc, visitLocation, completeEncounter, collectItem ONLY.
- Targets must be real IDs from the lists above.
- Thematic to the quest giver NPC personality.
- Duck puns and silly RPG flavor. Dialogue in character for ${npc.name}.
- Do NOT repeat themes from past bounties.
- Difficulty: tier 1 for lvl 1-3, tier 2 for lvl 4-6, tier 3 for lvl 7+.
- Counts: 1-2 for talkToNpc/visitLocation, 1-3 for completeEncounter, 1 for collectItem.
- Step IDs: bounty_step_1, bounty_step_2, etc. Objective IDs: bounty_obj_1, bounty_obj_2, etc.`

  const generated = await adk.zai.extract(prompt, GeneratedBountySchema)

  const questId = `bounty_${giverNpcId}_${Date.now()}`
  const rewards = computeBountyRewards(playerLevel, generated.difficultyTier)

  const definition: QuestDefinition = {
    id: questId,
    name: generated.name,
    emoji: generated.emoji,
    category: 'side',
    description: generated.description,
    giverNpc: giverNpcId,
    giverLocation: playerLocation,
    levelRequired: 1,
    prerequisiteQuestIds: [],
    steps: generated.steps.map((s) => ({
      ...s,
      choices: undefined,
    })),
    rewards,
    repeatable: false,
  }

  return { generated, definition }
}

// --- Quest lookup that includes generated quests ---

export const buildQuestLookup = (generatedQuests: QuestDefinition[]): ((id: string) => QuestDefinition | undefined) => {
  return (id: string): QuestDefinition | undefined => {
    return getQuestById(id) ?? generatedQuests.find((g) => g.id === id)
  }
}

// --- Helper to extract generated quests from profile questState ---

export const getGeneratedQuestsFromProfile = (questState: unknown): QuestDefinition[] => {
  const qs = parseQuestState(questState)
  const json = (qs as Record<string, unknown>).generatedQuestsJson as string | undefined
  if (!json || json === '[]') {
    return []
  }
  try {
    return JSON.parse(json) as QuestDefinition[]
  } catch {
    return []
  }
}

export const serializeGeneratedQuests = (quests: QuestDefinition[]): string => {
  return JSON.stringify(quests)
}
