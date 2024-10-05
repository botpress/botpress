import * as client from '@botpress/client'
import * as consts from '../consts'
import { Module } from '../module'
import * as strings from '../strings'
import * as types from '../typings'
import { InterfacePackageDefinitionModule } from './interface-package-definition'

class InterfacePackageModule extends Module {
  private _definitionModule: InterfacePackageDefinitionModule

  public constructor(private _interface: client.Interface) {
    super({
      path: consts.INDEX_FILE,
      exportName: strings.varName(_interface.name),
    })

    this._definitionModule = new InterfacePackageDefinitionModule(_interface)
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
      '  type: "interface",',
      `  id: "${this._interface.id}",`,
      `  definition: ${definitionModule.name}.${definitionModule.exportName},`,
      '} satisfies sdk.InterfacePackage',
    ].join('\n')
  }
}

export const generateInterfacePackage = async (apiInterface: client.Interface): Promise<types.File[]> => {
  const module = new InterfacePackageModule(apiInterface)
  const files = await module.flatten()
  return files
}
