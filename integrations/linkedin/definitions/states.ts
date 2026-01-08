import { z } from '@botpress/sdk'

export const states = {
  oauthCredentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.object({
        token: z.string().secret(),
        issuedAt: z.string().datetime(),
        expiresAt: z.string().datetime(),
      }),
      refreshToken: z
        .object({
          token: z.string().secret(),
          issuedAt: z.string().datetime(),
        })
        .optional(),
      grantedScopes: z.array(z.string()),
      linkedInUserId: z.string(),
    }),
  },
} as const
