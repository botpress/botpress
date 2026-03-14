import { Table, z } from '@botpress/runtime'

export const PlayersTable = new Table({
  name: 'PlayersTable',
  keyColumn: 'discordUserId',
  columns: {
    discordUserId: z.string().describe('Discord user ID'),
    displayName: z.string().describe('Player display name'),
    guildId: z.string().optional().describe('Primary guild ID'),
    adventureActive: z.boolean().default(false).describe('Whether the player has an active adventure'),
    totalWins: z.number().default(0).describe('Total tournament wins'),
    totalLosses: z.number().default(0).describe('Total tournament losses'),
    totalKills: z.number().default(0).describe('Lifetime eliminations'),
    currentLocation: z.string().default('coliseum').describe('Current adventure location ID'),
    level: z.number().default(1).describe('Player level (1-10)'),
    xp: z.number().default(0).describe('Total experience points'),
    breadcrumbs: z.number().default(0).describe('Breadcrumb currency'),
    title: z.string().default('Fledgling').describe('Active display title'),
    titlesUnlocked: z.array(z.string()).default(['Fledgling']).describe('All unlocked titles'),
    unlockedLocations: z
      .array(z.string())
      .default(['coliseum', 'puddle', 'highway', 'quackatoa', 'parkBench', 'frozenPond'])
      .describe('Accessible location IDs'),
    inventory: z
      .array(
        z.object({
          itemId: z.string(),
          name: z.string(),
          type: z.enum([
            'hpPotion',
            'energyDrink',
            'shieldToken',
            'damageBoost',
            'mirrorShard',
            'quackGrenade',
            'breadcrumbMagnet',
            'fogBomb',
          ]),
          quantity: z.number().default(1),
        })
      )
      .default([])
      .describe('Player inventory (max 6 slots)'),
    adventureState: z
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
        lastEncounterResetAt: z.string().optional(),
        lastMilestoneIndex: z.number().default(-1),
        breadcrumbBoostActive: z.boolean().default(false),
      })
      .default({
        encounterStep: 0,
        encountersCompleted: [],
        awaitingChoice: 'none',
        visitedGatedLocations: [],
        lastMilestoneIndex: -1,
        breadcrumbBoostActive: false,
      })
      .describe('Current adventure/encounter state'),
    version: z.number().default(0).describe('Optimistic concurrency version counter'),
    questState: z
      .object({
        activeQuests: z
          .array(
            z.object({
              questId: z.string(),
              currentStepId: z.string(),
              objectiveProgress: z.record(z.string(), z.number()).default({}),
              startedAt: z.string(),
              choicesMade: z.array(z.string()).default([]),
            })
          )
          .default([]),
        completedQuests: z
          .array(
            z.object({
              questId: z.string(),
              completedAt: z.string(),
              choicesMade: z.array(z.string()).default([]),
            })
          )
          .default([]),
        dailyResetAt: z.string().optional(),
        lastBountyCompletedAt: z.string().optional(),
        generatedQuestsJson: z.string().default('[]'),
      })
      .default({ activeQuests: [], completedQuests: [] })
      .describe('Quest progress and completion state'),
  },
})
