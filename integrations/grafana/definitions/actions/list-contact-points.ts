import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listContactPoints = {
  title: 'List Contact Points',
  description: 'List all Grafana contact points',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      contactPoints: z
        .array(
          z.object({
            uid: z.string().optional().title('UID').describe('Contact point UID'),
            name: z.string().optional().title('Name').describe('Contact point display name'),
            type: z.string().title('Type').describe('Contact point type (e.g. "webhook", "email")'),
          })
        )
        .title('Contact Points')
        .describe('List of all contact points'),
    }),
  },
} satisfies ActionDef
