import { z } from '@botpress/runtime'

// --- Quest State Schemas ---

const QuestProgressSchema = z.object({
  questId: z.string(),
  currentStepId: z.string(),
  objectiveProgress: z.record(z.string(), z.number()).default({}),
  startedAt: z.string(),
  choicesMade: z.array(z.string()).default([]),
})

const CompletedQuestSchema = z.object({
  questId: z.string(),
  completedAt: z.string(),
  choicesMade: z.array(z.string()).default([]),
})

const QuestStateSchema = z
  .object({
    activeQuests: z.array(QuestProgressSchema).default([]),
    completedQuests: z.array(CompletedQuestSchema).default([]),
    dailyResetAt: z.string().optional(),
    lastBountyCompletedAt: z.string().optional(),
    generatedQuestsJson: z.string().default('[]'),
  })
  .default({ activeQuests: [], completedQuests: [] })

export type QuestState = z.infer<typeof QuestStateSchema>

export const parseQuestState = (raw: unknown): QuestState => {
  return QuestStateSchema.parse(raw ?? {})
}

// --- Adventure State Schemas ---

const AdventureStateSchema = z
  .object({
    activeEncounterId: z.string().optional(),
    encounterStep: z.number().default(0),
    encountersCompleted: z.array(z.string()).default([]),
    lastExploreAt: z.string().optional(),
    currentNpc: z.string().optional(),
    awaitingChoice: z.enum(['encounter', 'travel', 'quest_choice', 'quest_accept', 'shop', 'none']).default('none'),
    pendingQuestId: z.string().optional(),
    pendingNpcId: z.string().optional(),
    visitedGatedLocations: z.array(z.string()).default([]),
  })
  .default({ encounterStep: 0, encountersCompleted: [], awaitingChoice: 'none', visitedGatedLocations: [] })

export type AdventureState = z.infer<typeof AdventureStateSchema>

export const parseAdventureState = (raw: unknown): AdventureState => {
  return AdventureStateSchema.parse(raw ?? {})
}

// --- Message Payload Schema ---

const MessagePayloadSchema = z.object({
  text: z.string().optional(),
})

export const parseMessagePayload = (raw: unknown): { text?: string } => {
  const result = MessagePayloadSchema.safeParse(raw)
  return result.success ? result.data : {}
}
