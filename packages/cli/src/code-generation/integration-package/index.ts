import * as consts from '../consts'
import * as gen from '../generators'
import * as types from '../typings'
import { IntegrationPackageDefinitionModule } from './integration-package-definition'

const generateIntegrationPackageModule = (
  definitionImport: string,
  pkg: types.IntegrationInstallablePackage
): string => {
  const id = pkg.integration.id ?? pkg.devId
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
    '  type: "integration",',
    `  id: ${tsId},`,
    `  uri: ${tsUri},`,
    `  name: ${tsName},`,
    `  version: ${tsVersion},`,
    '  definition,',
    '} satisfies sdk.IntegrationPackage',
  ].join('\n')
}

export const generateIntegrationPackage = async (pkg: types.IntegrationInstallablePackage): Promise<types.File[]> => {
  const definitionDir = 'definition'
  const definitionModule = new IntegrationPackageDefinitionModule(pkg.integration)
  definitionModule.unshift(definitionDir)

  const definitionFiles = await definitionModule.flatten()
  return [
    ...definitionFiles,
    {
      path: consts.INDEX_FILE,
      content: generateIntegrationPackageModule(`./${definitionDir}`, pkg),
    },
  ]
}
