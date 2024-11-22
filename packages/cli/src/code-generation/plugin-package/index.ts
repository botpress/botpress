import _ from 'lodash'
import * as utils from '../../utils'
import * as consts from '../consts'
import * as mod from '../module'
import * as types from '../typings'

class ImplementationModule extends mod.Module {
  public constructor(private _implementationCode: string) {
    super({
      path: 'implementation.ts',
      exportName: 'default',
    })
  }

  public async getContent(): Promise<string> {
    const base64Str = Buffer.from(this._implementationCode).toString('base64')
    const chunks: string[] = _.chunk(base64Str, 80).map((chunk) => chunk.join(''))

    return [
      //
      'export default Buffer.from([',
      ...chunks.map((chunk) => `  "${chunk}",`),
      '].join(""), "base64")',
    ].join('\n')
  }
}

export const generatePluginPackage = async (pkg: types.PluginInstallablePackage): Promise<types.File[]> => {
  const uri = utils.path.win32.escapeBackslashes(pkg.path)
  const implementationModule = new ImplementationModule(pkg.implementationCode)

  const definitionImport = utils.path.rmExtension(utils.path.join(pkg.path, consts.fromWorkDir.pluginDefinition))
  const implementationImport = './implementation'

  const implementationFiles = await implementationModule.flatten()
  const indexFile: types.File = {
    path: consts.INDEX_FILE,
    content: [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import definition from "${definitionImport}"`,
      `import implementation from "${implementationImport}"`,
      '',
      'export default {',
      '  type: "plugin",',
      `  uri: "${uri}",`,
      '  definition,',
      '  implementation,',
      '} satisfies sdk.PluginPackage',
    ].join('\n'),
  }

  return [...implementationFiles, indexFile]
}
