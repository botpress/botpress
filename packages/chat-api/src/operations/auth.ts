import { Parameter } from '@bpinternal/opapi'

export const authHeaders = {
  'x-user-key': {
    in: 'header',
    type: 'string',
    description: 'Authentication Key',
    required: true,
  },
} satisfies Record<string, Parameter>
