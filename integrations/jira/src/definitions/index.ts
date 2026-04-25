import type { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

export { actions } from './actions'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    host: z.string().describe('Atlassian Host Domain'),
    email: z.string().describe('Email in Atlassian Account'),
    apiToken: z.string().describe('API Token'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  // voidStateOne: {
  //   type: 'integration',
  //   schema: z.object({
  //     dataField: z.string(),
  //   }),
  // },
  // voidStateTwo: {
  //   type: 'conversation',
  //   schema: z.object({
  //     otherDataField: z.string(),
  //   }),
  // },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    // id: {},
  },
} satisfies IntegrationDefinitionProps['user']
