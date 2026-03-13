import { Action, z } from '@botpress/runtime'
import { TUTORIAL_ENCOUNTER, formatEncounter } from '../lib/encounters'
import { LOCATIONS } from '../lib/locations'
import { PlayersTable } from '../tables/Players'

export const startAdventure = new Action({
  name: 'startAdventure',
  description: 'Create a player profile and return welcome + tutorial text for the guild channel',

  input: z.object({
    discordUserId: z.string().describe('Discord user ID'),
    displayName: z.string().describe('Player display name'),
    guildId: z.string().optional().describe('Guild ID where !startGame was typed'),
    force: z.boolean().default(false).describe('Force-restart adventure (reset adventure state, keep stats)'),
  }),

  output: z.object({
    success: z.boolean(),
    message: z.string(),
    tutorialText: z.string().optional(),
  }),

  async handler({ input }) {
    // Check if player already exists
    const { rows } = await PlayersTable.findRows({
      filter: { discordUserId: input.discordUserId },
      limit: 1,
    })
    const existingProfile = rows[0]

    if (existingProfile?.adventureActive && !input.force) {
      return {
        success: false,
        message:
          "You're already on an adventure! Use `!startGameForce` to reset, or try `!explore`, `!travel`, `!profile`.",
      }
    }

    // Create or update player profile — preserve existing stats
    const adventureState = input.force
      ? {
          encounterStep: 0,
          encountersCompleted: existingProfile?.adventureState?.encountersCompleted ?? [],
          awaitingChoice: 'none' as const,
        }
      : (existingProfile?.adventureState ?? { encounterStep: 0, encountersCompleted: [], awaitingChoice: 'none' })

    const baseProfile = {
      discordUserId: input.discordUserId,
      displayName: input.displayName,
      guildId: input.guildId,
      adventureActive: true,
      totalWins: existingProfile?.totalWins ?? 0,
      totalLosses: existingProfile?.totalLosses ?? 0,
      totalKills: existingProfile?.totalKills ?? 0,
      currentLocation: input.force ? 'coliseum' : (existingProfile?.currentLocation ?? 'coliseum'),
      inventory: existingProfile?.inventory ?? [],
      adventureState,
      level: existingProfile?.level ?? 1,
      xp: existingProfile?.xp ?? 0,
      breadcrumbs: existingProfile?.breadcrumbs ?? 0,
      title: existingProfile?.title ?? 'Fledgling',
      titlesUnlocked: existingProfile?.titlesUnlocked ?? ['Fledgling'],
      unlockedLocations: existingProfile?.unlockedLocations ?? [
        'coliseum',
        'puddle',
        'highway',
        'quackatoa',
        'parkBench',
        'frozenPond',
      ],
      questState: existingProfile?.questState ?? { activeQuests: [], completedQuests: [] },
    }

    await PlayersTable.upsertRows({
      rows: [baseProfile],
      keyColumn: 'discordUserId',
    })

    // Build welcome text
    const startLocation = LOCATIONS.coliseum
    const welcome = [
      '**The Great Mallard sneezed, and the universe quacked into existence.**',
      '',
      'You open your eyes. Breadcrumb dust swirls in beams of golden light. The roar of ten thousand ducks shakes the stone beneath your webbed feet.',
      '',
      `You stand at the gates of ${startLocation.emoji} **${startLocation.name}** — the legendary arena where crumbs become legends and legends become crumbs.`,
      '',
      'Above, in a nest of pure gold, **Chuck Norris** adjusts his tiny sunglasses and glances your way. He nods once. Just once.',
      '',
      '*You are now a citizen of The Pond Eternal.*',
      '',
      '**Commands:**',
      '`!explore` — Explore your surroundings',
      '`!travel` — Travel to a new location',
      '`!inventory` — Check your items',
      '`!profile` — View your stats',
      '`!help` — See all commands',
    ].join('\n')

    // Build tutorial text
    const tutorialText = `${formatEncounter(TUTORIAL_ENCOUNTER)}\n\n*Reply with a number to choose.*`

    // Set tutorial as active encounter
    await PlayersTable.upsertRows({
      rows: [
        {
          ...baseProfile,
          adventureState: {
            ...adventureState,
            activeEncounterId: TUTORIAL_ENCOUNTER.id,
            encounterStep: 1,
          },
        },
      ],
      keyColumn: 'discordUserId',
    })

    return {
      success: true,
      message: welcome,
      tutorialText,
    }
  },
})
