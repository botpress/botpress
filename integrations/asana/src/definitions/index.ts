import type { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

export { actions } from './actions'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    apiToken: z.string().describe('API Token'),
    workspaceGid: z.string().describe('Workspace Global ID'),
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
