import type * as client from '@botpress/client'
import type { IntegrationDefinition } from '@botpress/sdk'
import pathlib from 'path'
import { casing } from '../utils'
import { INDEX_FILE } from './const'
import { IntegrationImplementationIndexModule } from './integration-impl'
import { IntegrationInstanceIndexModule } from './integration-instance'
import { IntegrationSecretIndexModule } from './integration-secret'
import type * as types from './typings'

export { File } from './typings'
export { secretEnvVariableName } from './integration-secret'
export const INTEGRATION_JSON = 'integration.json'

export const generateIntegrationImplementationTypings = async (
  integration: IntegrationDefinition,
  implementationTypingsPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationImplementationIndexModule.create(integration)
  indexModule.unshift(implementationTypingsPath)
  return indexModule.flatten()
}

export const generateIntegrationSecrets = async (
  integration: IntegrationDefinition,
  secretsPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationSecretIndexModule.create(integration)
  indexModule.unshift(secretsPath)
  return indexModule.flatten()
}

export const generateIntegrationIndex = async (
  implementationTypingsPath: string,
  implementationSecretsPath: string
): Promise<types.File> => {
  let content = ''
  content += `export * from './${implementationTypingsPath}'\n`
  content += `export * from './${implementationSecretsPath}'\n`
  return {
    path: INDEX_FILE,
    content,
  }
}

export type IntegrationInstanceJson = {
  name: string
  version: string
  id: string
}

export const generateIntegrationInstance = async (
  integration: client.Integration,
  installPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationInstanceIndexModule.create(integration)
  const dirname = casing.to.kebabCase(integration.name)
  indexModule.unshift(installPath, dirname)
  const files = indexModule.flatten()

  const { name, version, id } = integration
  const json: IntegrationInstanceJson = {
    name,
    version,
    id,
  }
  files.push({
    path: pathlib.join(installPath, dirname, INTEGRATION_JSON),
    content: JSON.stringify(json, null, 2),
  })

  return files
}

export const generateBotIndex = async (installPath: string, instances: string[]): Promise<types.File> => ({
  path: INDEX_FILE,
  content: instances.map((instance) => `export * from './${installPath}/${instance}'`).join('\n'),
})
