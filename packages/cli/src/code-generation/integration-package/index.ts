import * as client from '@botpress/client'
import * as types from '../typings'
import { IntegrationPackageModule } from './integration-package'

export const generateIntegrationPackage = async (
  apiIntegrationDefinition: client.Integration
): Promise<types.File[]> => {
  const integrationDefModule = new IntegrationPackageModule(apiIntegrationDefinition)
  return await integrationDefModule.flatten()
}
