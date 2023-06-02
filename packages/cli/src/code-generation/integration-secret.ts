import type { IntegrationDefinition } from '@botpress/sdk'
import { casing } from '../utils'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import { Module } from './module'

export const secretEnvVariableName = (secretName: string) => `SECRET_${casing.to.screamingSnakeCase(secretName)}`

export class IntegrationSecretIndexModule extends Module {
  public static async create(integration: IntegrationDefinition): Promise<IntegrationSecretIndexModule> {
    let content = GENERATED_HEADER
    content += 'class Secrets {\n'
    for (const secretName of integration.secrets ?? []) {
      const envVariableName = secretEnvVariableName(secretName)
      const fieldName = casing.to.screamingSnakeCase(secretName)
      content += `  public get ${fieldName}(): string {\n`
      content += `    const envVarValue = process.env.${envVariableName}\n`
      content += `    if (!envVarValue) { throw new Error('Missing environment variable ${envVariableName}') }\n`
      content += '    return envVarValue\n'
      content += '  }\n'
    }
    content += '}\n'
    content += 'export const secrets = new Secrets()\n'
    return new IntegrationSecretIndexModule({ content, exportName: 'secrets', path: INDEX_FILE })
  }
}
