import * as sdk from '@botpress/sdk'
import { apiActionDefinitions } from './api-actions'
import { caseActionDefinitions } from './case-actions'
import { contactActionDefinitions } from './contact-actions'
import { leadActionDefinitions } from './lead-actions'

export const actionDefinitions = {
  ...contactActionDefinitions,
  ...leadActionDefinitions,
  ...apiActionDefinitions,
  ...caseActionDefinitions,
} satisfies sdk.IntegrationDefinitionProps['actions']
