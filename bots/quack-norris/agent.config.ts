import { z, defineConfig } from '@botpress/runtime'

export default defineConfig({
  name: 'quack-norris',
  description: 'A Discord RPG battle bot - turn-based combat between players',

  defaultModels: {
    zai: 'anthropic:claude-sonnet-4-20250514',
    autonomous: 'anthropic:claude-sonnet-4-20250514',
  },

  bot: {
    state: z.object({}),
  },

  user: {
    state: z.object({
      discordUserId: z.string().optional(),
      wins: z.number().default(0),
      losses: z.number().default(0),
    }),
  },

  conversation: {
    tags: {
      gameId: { title: 'Game ID' },
      phase: { title: 'Phase' },
    },
  },

  dependencies: {
    integrations: {
      discord: {
        version: 'shell/discord@0.1.0',
        enabled: true,
        config: {
          botToken: process.env.QUACK_NORRIS_DISCORD_BOT_TOKEN ?? '',
        },
      },
    },
  },
})
