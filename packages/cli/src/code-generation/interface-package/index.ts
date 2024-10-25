import * as utils from '../../utils'
import * as consts from '../consts'
import * as types from '../typings'
import { InterfacePackageDefinitionModule } from './interface-package-definition'

const generateInterfacePackageModule = (definitionImport: string, pkg: types.InterfaceInstallablePackage): string => {
  const refLine =
    pkg.source === 'local' ? `uri: "${utils.path.win32.escapeBackslashes(pkg.path)}"` : `id: "${pkg.interface.id}"`
  return [
    consts.GENERATED_HEADER,
    'import * as sdk from "@botpress/sdk"',
    '',
    `import definition from "${utils.path.win32.escapeBackslashes(definitionImport)}"`,
    '',
    'export default {',
    '  type: "interface",',
    `  ${refLine},`,
    '  definition,',
    '} satisfies sdk.InterfacePackage',
  ].join('\n')
}

const generateInterfacePackageFromRemote = async (
  pkg: Extract<types.InterfaceInstallablePackage, { source: 'remote' }>
): Promise<types.File[]> => {
  const definitionDir = 'definition'
  const definitionModule = new InterfacePackageDefinitionModule(pkg.interface)
  definitionModule.unshift(definitionDir)

  const definitionFiles = await definitionModule.flatten()
  return [
    ...definitionFiles,
    {
      path: consts.INDEX_FILE,
      content: generateInterfacePackageModule(`./${definitionDir}`, pkg),
    },
  ]
}

const generateInterfacePackageFromLocal = async (
  pkg: Extract<types.InterfaceInstallablePackage, { source: 'local' }>
): Promise<types.File[]> => {
  let definitionImport: string = utils.path.join(pkg.path, consts.fromWorkDir.interfaceDefinition)
  definitionImport = utils.path.rmExtension(definitionImport)
  return [
    {
      path: consts.INDEX_FILE,
      content: generateInterfacePackageModule(definitionImport, pkg),
    },
  ]
}

export const generateInterfacePackage = async (pkg: types.InterfaceInstallablePackage): Promise<types.File[]> => {
  if (pkg.source === 'remote') {
    return generateInterfacePackageFromRemote(pkg)
  }
  return generateInterfacePackageFromLocal(pkg)
}
