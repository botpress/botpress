import type * as sdk from '@botpress/sdk'
import { validateEntitiesSignature } from './check-entities-signature'
import { validatePropertyNames } from './check-property-names'

export const validateIntegrationDefinition = async (i: sdk.IntegrationDefinition): Promise<void> => {
  validatePropertyNames(i)
  await validateEntitiesSignature(i)
}
