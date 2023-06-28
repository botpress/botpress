import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'
import { UserProfile } from './schemas'

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string(),
      expiresAt: z.string(),
    }),
  },
  configuration: {
    type: 'integration',
    schema: z.object({
      botUserId: z.string().optional(),
    }),
  },
  profile: {
    type: 'user',
    schema: UserProfile,
    ui: {
      admin: { title: 'Is admin?' },
      archivedAt: { title: 'Archived at' },
      avatarUrl: { title: 'Avatar URL' },
      createdAt: { title: 'Created at' },
      description: { title: 'Profile Description' },
      displayName: { title: 'Display Name', examples: ['louis.moreau', 'sylvain.perron'] },
      guest: { title: 'Is a guest?' },
      email: { title: 'User Email' },
      isMe: { title: 'Is me?' },
      url: { title: 'Profile URL' },
      timezone: { title: 'Timezone', examples: ['Europe/Paris'] },
      name: { title: 'Full Name', examples: ['Louis Moreau', 'Sylvain Perron'] },
      linearId: { title: 'Linear User ID' },
    },
  },
} satisfies IntegrationDefinitionProps['states']
