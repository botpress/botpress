import { IntegrationDefinition } from '@botpress/sdk'
import { casing } from '../../utils'
import * as consts from '../consts'
import { Module } from '../module'

export const secretEnvVariableName = (secretName: string) => `SECRET_${casing.to.screamingSnakeCase(secretName)}`

export class IntegrationSecretIndexModule extends Module {
  public constructor(private _integration: IntegrationDefinition) {
    super({ exportName: 'secrets', path: consts.INDEX_FILE })
  }

  public async getContent() {
    let content = consts.GENERATED_HEADER
    content += 'class Secrets {\n'
    for (const [secretName, { optional }] of Object.entries(this._integration.secrets ?? {})) {
      const envVariableName = secretEnvVariableName(secretName)
      const fieldName = casing.to.screamingSnakeCase(secretName)

      if (optional) {
        content += `  public get ${fieldName}(): string | undefined {\n`
        content += `    const envVarValue = process.env.${envVariableName}\n`
        content += '    return envVarValue\n'
        content += '  }\n'
      } else {
        content += `  public get ${fieldName}(): string {\n`
        content += `    const envVarValue = process.env.${envVariableName}\n`
        content += `    if (!envVarValue) throw new Error('Missing required secret "${secretName}"')\n`
        content += '    return envVarValue\n'
        content += '  }\n'
      }
    }
    content += '}\n'
    content += 'export const secrets = new Secrets()\n'
    return content
  }
}
