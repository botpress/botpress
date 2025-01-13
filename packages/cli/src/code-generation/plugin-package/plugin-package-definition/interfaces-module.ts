import * as consts from '../../consts'
import * as mod from '../../module'
import * as types from './typings'

export class InterfacesModule extends mod.Module {
  public constructor(private _interfaces: Record<string, types.InterfaceDefinition>) {
    super({ exportName: 'interfaces', path: 'index.ts' })
  }

  public async getContent() {
    return [
      consts.GENERATED_HEADER,
      'export const interfaces = {',
      ...Object.entries(this._interfaces).map(([k, { id, name, version }]) => {
        const keyStr = JSON.stringify(k)
        const valueStr = JSON.stringify({ id, name, version })
        return `  [${keyStr}]: ${valueStr},`
      }),
      '}',
    ].join('\n')
  }
}
