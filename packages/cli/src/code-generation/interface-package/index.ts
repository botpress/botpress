import * as consts from '../consts'
import * as gen from '../generators'
import * as types from '../typings'
import { InterfacePackageDefinitionModule } from './interface-package-definition'

const generateInterfacePackageModule = (definitionImport: string, pkg: types.InterfaceInstallablePackage): string => {
  const id = pkg.interface.id
  const uri = pkg.path

  const tsId = gen.primitiveToTypescriptValue(id)
  const tsUri = gen.primitiveToTypescriptValue(uri)
  const tsName = gen.primitiveToTypescriptValue(pkg.name)
  const tsVersion = gen.primitiveToTypescriptValue(pkg.version)
  return [
    consts.GENERATED_HEADER,
    'import * as sdk from "@botpress/sdk"',
    '',
    `import definition from "${definitionImport}"`,
    '',
    'export default {',
    '  type: "interface",',
    `  id: ${tsId},`,
    `  uri: ${tsUri},`,
    `  name: ${tsName},`,
    `  version: ${tsVersion},`,
    '  definition,',
    '} satisfies sdk.InterfacePackage',
  ].join('\n')
}

export const generateInterfacePackage = async (pkg: types.InterfaceInstallablePackage): Promise<types.File[]> => {
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
