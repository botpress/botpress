import type * as sdk from '@botpress/sdk'
import { BotTypingsIndexModule } from './bot-typings'
import { INDEX_FILE } from './const'
import { IntegrationSecretIndexModule } from './integration-secret'
import { IntegrationTypingsIndexModule } from './integration-typings'
import * as mapIntegration from './map-integration'
import type * as types from './typings'

export { File } from './typings'
export { secretEnvVariableName } from './integration-secret'
export const INTEGRATION_JSON = 'integration.json'

export const generateIntegrationTypings = async (
  sdkIntegrationDefinition: sdk.IntegrationDefinition,
  typingsPath: string
): Promise<types.File[]> => {
  const integration = mapIntegration.from.sdk(sdkIntegrationDefinition)
  const indexModule = await IntegrationTypingsIndexModule.create(integration)
  indexModule.unshift(typingsPath)
  return indexModule.flatten()
}

export const generateIntegrationSecrets = async (
  sdkIntegrationDefinition: sdk.IntegrationDefinition,
  secretsPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationSecretIndexModule.create(sdkIntegrationDefinition)
  indexModule.unshift(secretsPath)
  return indexModule.flatten()
}

export const generateIntegrationIndex = async (typingsPath: string, secretsPath: string): Promise<types.File> => {
  let content = ''
  content += `export * from './${typingsPath}'\n`
  content += `export * from './${secretsPath}'\n`
  return {
    path: INDEX_FILE,
    content,
  }
}

export const generateBotTypings = async (
  sdkBotDefinition: sdk.BotDefinition,
  typingsPath: string
): Promise<types.File[]> => {
  const indexModule = await BotTypingsIndexModule.create(sdkBotDefinition)
  indexModule.unshift(typingsPath)
  return indexModule.flatten()
}

export const generateBotIndex = async (typingsPath: string): Promise<types.File> => {
  let content = ''
  content += `export * from './${typingsPath}'\n`
  return {
    path: INDEX_FILE,
    content,
  }
}
