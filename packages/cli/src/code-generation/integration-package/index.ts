import * as client from '@botpress/client'
import * as consts from '../consts'
import { Module } from '../module'
import * as strings from '../strings'
import * as types from '../typings'
import { IntegrationPackageDefinitionModule } from './integration-package-definition'

class IntegrationPackageModule extends Module {
  private _definitionModule: IntegrationPackageDefinitionModule

  public constructor(private _integration: client.Integration) {
    super({
      path: consts.INDEX_FILE,
      exportName: strings.varName(_integration.name),
    })

    this._definitionModule = new IntegrationPackageDefinitionModule(_integration)
    this._definitionModule.unshift('definition')
    this.pushDep(this._definitionModule)
  }

  public async getContent(): Promise<string> {
    const definitionModule = this._definitionModule
    const definitionImport = definitionModule.import(this)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import * as ${definitionModule.name} from "./${definitionImport}"`,
      `export * as ${definitionModule.name} from "./${definitionImport}"`,
      '',
      `export const ${this.exportName} = {`,
      '  type: "integration",',
      `  id: "${this._integration.id}",`,
      `  definition: ${definitionModule.name}.${definitionModule.exportName},`,
      '} satisfies sdk.IntegrationPackage',
    ].join('\n')
  }
}

export const generateIntegrationPackage = async (
  apiIntegrationDefinition: client.Integration
): Promise<types.File[]> => {
  const integrationDefModule = new IntegrationPackageModule(apiIntegrationDefinition)
  return await integrationDefModule.flatten()
}
