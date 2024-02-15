import type * as sdk from '@botpress/sdk'
import { validatePropertyNames } from './check-property-names'

export const validateIntegrationDefinition = (i: sdk.IntegrationDefinition): void => {
  validatePropertyNames(i)
}
