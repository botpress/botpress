import { IntegrationDefinitionProps } from '@botpress/sdk'
import { startHITL, stopHitl } from './hitl'
import { updateConversation } from './update-conversation'

export const actions = {
  updateConversation,
  startHITL,
  stopHitl
} satisfies IntegrationDefinitionProps['actions']
