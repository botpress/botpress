import _ from 'lodash'
import * as utils from '../../utils'
import * as consts from '../consts'
import * as types from '../typings'

const generatePluginPackageFromLocal = async (
  pkg: Extract<types.PluginInstallablePackage, { source: 'local' }>
): Promise<types.File[]> => {
  let definitionImport: string = utils.path.join(pkg.path, consts.fromWorkDir.pluginDefinition)
  definitionImport = utils.path.rmExtension(definitionImport)

  const implementationCode = pkg.implementation
  const implementationChunked = _.chunk(implementationCode, 80).map((chunk) => chunk.join(''))

  const refLine = `uri: "${utils.path.win32.escapeBackslashes(pkg.path)}"`
  return [
    {
      path: 'implementation.ts',
      content: [
        'export const code: string = [',
        ...implementationChunked.map((chunk) => `  ${JSON.stringify(chunk)},`),
        "].join('')",
      ].join('\n'),
    },
    {
      path: consts.INDEX_FILE,
      content: [
        consts.GENERATED_HEADER,
        'import * as sdk from "@botpress/sdk"',
        'import * as impl from "./implementation"',
        '',
        `import definition from "${utils.path.win32.escapeBackslashes(definitionImport)}"`,
        '',
        'export default {',
        '  type: "plugin",',
        `  ${refLine},`,
        '  definition,',
        '  implementation: { code: impl.code }',
        '} satisfies sdk.PluginPackage',
      ].join('\n'),
    },
  ]
}

export const generatePluginPackage = async (pkg: types.PluginInstallablePackage): Promise<types.File[]> => {
  return generatePluginPackageFromLocal(pkg)
}
