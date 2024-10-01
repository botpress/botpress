import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import pathlib from 'path'
import * as utils from '../utils'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import { IntegrationImplementationIndexModule } from './integration-implementation'
import { IntegrationInstanceIndexModule } from './integration-instance'
import { IntegrationSecretIndexModule } from './integration-secret'
import * as mapIntegration from './map-integration'
import type * as types from './typings'

export { File } from './typings'
export { secretEnvVariableName } from './integration-secret'
export const INTEGRATION_JSON = 'integration.json'

export const generateIntegrationImplementationTypings = async (
  sdkIntegration: sdk.IntegrationDefinition,
  implementationTypingsPath: string
): Promise<types.File[]> => {
  const integration = await mapIntegration.from.sdk(sdkIntegration)
  const indexModule = await IntegrationImplementationIndexModule.create(integration)
  indexModule.unshift(implementationTypingsPath)
  return indexModule.flatten()
}

export const generateIntegrationSecrets = async (
  sdkIntegration: sdk.IntegrationDefinition,
  secretsPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationSecretIndexModule.create(sdkIntegration)
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
  id: string | null
}

export const generateIntegrationInstance = async (
  anyIntegration: client.Integration | sdk.IntegrationDefinition,
  installPath: string
): Promise<types.File[]> => {
  let integration: types.IntegrationDefinition
  if ('id' in anyIntegration) {
    integration = mapIntegration.from.client(anyIntegration)
  } else {
    integration = await mapIntegration.from.sdk(anyIntegration)
  }

  const indexModule = await IntegrationInstanceIndexModule.create(integration)
  const dirname = utils.casing.to.kebabCase(integration.name)
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

export const generateBotIndex = async (
  installPath: string,
  instances: { name: string; dirname: string }[]
): Promise<types.File> => {
  const lines: string[] = [
    GENERATED_HEADER,
    "import * as sdk from '@botpress/sdk'",
    ...instances.map((i) => `import * as ${utils.casing.to.camelCase(i.name)} from './${installPath}/${i.dirname}'`),
    ...instances.map((i) => `export * as ${utils.casing.to.camelCase(i.name)} from './${installPath}/${i.dirname}'`),
    '',
    'type TIntegrations = {',
    ...instances.map(
      (i) => `  "${i.name}": ${utils.casing.to.camelCase(i.name)}.T${utils.casing.to.pascalCase(i.dirname)}`
    ),
    '}',
    '',
    'type BaseStates = sdk.Bot extends sdk.Bot<any, infer TStates, any> ? TStates : never',
    'type BaseEvents = sdk.Bot extends sdk.Bot<any, any, infer TEvents> ? TEvents : never',
    '',
    'export class Bot<',
    '  TStates extends BaseStates,',
    '  TEvents extends BaseEvents',
    '> extends sdk.Bot<',
    '    TIntegrations,',
    '    TStates,',
    '    TEvents',
    '> {}',
  ]

  return {
    path: INDEX_FILE,
    content: lines.join('\n'),
  }
}
