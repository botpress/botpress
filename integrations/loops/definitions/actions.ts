import { ActionDefinition, IntegrationDefinitionProps } from '@botpress/sdk'
import { sendTransactionalEmailInputSchema, sendTransactionalEmailOutputSchema } from './schemas'

const sendTransactionalEmail = {
  title: 'Send Transactional Email',
  description: 'Send a transactional email to a client',
  input: {
    schema: sendTransactionalEmailInputSchema,
  },
  output: {
    schema: sendTransactionalEmailOutputSchema,
  },
} as const satisfies ActionDefinition

export const actions = {
  sendTransactionalEmail,
} as const satisfies IntegrationDefinitionProps['actions']
