import { InterfacePackageDefinitionModule } from '../../interface-package/interface-package-definition'
import { ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class InterfaceModule extends ReExportVariableModule {
  public constructor(interfaceName: string, private _intrface: types.ApiInterfaceInstance) {
    super({ exportName: strings.varName(interfaceName) })

    const definitionModule = new InterfacePackageDefinitionModule(_intrface.definition)
    definitionModule.unshift('definition')
    this.pushDep(definitionModule)
  }

  public async getContent() {
    const id: string = this._intrface.definition.id
    return [
      //
      'import * as sdk from "@botpress/sdk"',
      'import definition from "./definition"',
      `export const ${this.exportName} = {`,
      '  type: "interface",',
      `  id: "${id}",`,
      '  definition,',
      '  entities: {},',
      '} satisfies NonNullable<sdk.IntegrationPackage["definition"]["interfaces"]>[string]',
    ].join('\n')
  }
}

export class InterfacesModule extends ReExportVariableModule {
  public constructor(interfaces: Record<string, types.ApiInterfaceInstance>) {
    super({ exportName: strings.varName('interfaces') })
    for (const [interfaceName, intrface] of Object.entries(interfaces)) {
      const module = new InterfaceModule(interfaceName, intrface)
      module.unshift(interfaceName)
      this.pushDep(module)
    }
  }
}
