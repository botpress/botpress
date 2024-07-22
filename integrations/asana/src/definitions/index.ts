import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export { actions } from './actions'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    apiToken: z.string().min(1).describe('API Token'),
    workspaceGid: z.string().min(1).describe('Workspace Global ID'),
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
