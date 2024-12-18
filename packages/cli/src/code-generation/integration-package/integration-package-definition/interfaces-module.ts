import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as types from './typings'

export class InterfaceModule extends Module {
  public constructor(name: string, private _interface: types.ApiInterfaceExtension) {
    const interfaceName = strings.importAlias(name)
    const exportName = strings.varName(interfaceName)
    super({ path: `${interfaceName}.ts`, exportName })
  }

  public async getContent() {
    return `export const ${this.exportName} = ${JSON.stringify(this._interface, null, 2)}`
  }
}

export class InterfacesModule extends ReExportVariableModule {
  public constructor(interfaces: Record<string, types.ApiInterfaceExtension>) {
    super({ exportName: strings.varName('interfaces') })
    for (const [interfaceName, intrface] of Object.entries(interfaces)) {
      const module = new InterfaceModule(interfaceName, intrface)
      this.pushDep(module)
    }
  }
}
