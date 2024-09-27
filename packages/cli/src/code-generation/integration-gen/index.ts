import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import { IntegrationImplementationModule } from '../integration-gen/integration-implementation'
import { IntegrationSecretIndexModule } from '../integration-gen/integration-secret'
import * as types from '../typings'

const generateIntegrationImplementation = async (
  sdkIntegrationDefinition: sdk.IntegrationDefinition,
  implPath: string
): Promise<types.File[]> => {
  const indexModule = new IntegrationImplementationModule(sdkIntegrationDefinition)
  indexModule.unshift(implPath)
  return indexModule.flatten()
}

const generateIntegrationSecrets = async (
  sdkIntegrationDefinition: sdk.IntegrationDefinition,
  secretsPath: string
): Promise<types.File[]> => {
  const indexModule = new IntegrationSecretIndexModule(sdkIntegrationDefinition)
  indexModule.unshift(secretsPath)
  return indexModule.flatten()
}

const generateIntegrationIndex = async (implPath: string, secretsPath: string): Promise<types.File> => {
  let content = ''
  content += `export * from '../${implPath}'\n`
  content += `export * from '../${secretsPath}'\n`
  return {
    path: consts.INDEX_FILE,
    content,
  }
}

export const generateIntegration = async (
  sdkIntegrationDefinition: sdk.IntegrationDefinition
): Promise<types.File[]> => {
  const implPath = consts.fromOutDir.implementationDir
  const secretsPath = consts.fromOutDir.secretsDir
  const implFiles = await generateIntegrationImplementation(sdkIntegrationDefinition, implPath)
  const secretFiles = await generateIntegrationSecrets(sdkIntegrationDefinition, secretsPath)
  const indexFile = await generateIntegrationIndex(implPath, secretsPath)
  return [...implFiles, ...secretFiles, indexFile]
}
