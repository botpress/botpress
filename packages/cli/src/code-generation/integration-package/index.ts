import * as utils from '../../utils'
import * as consts from '../consts'
import * as gen from '../generators'
import * as types from '../typings'
import { IntegrationPackageDefinitionModule } from './integration-package-definition'

const generateIntegrationPackageModule = (
  definitionImport: string,
  pkg: types.IntegrationInstallablePackage
): string => {
  const id = pkg.source === 'remote' ? pkg.integration.id : pkg.devId
  const uri = pkg.source === 'local' ? utils.path.toNormalizedPosixPath(pkg.path) : undefined

  const tsId = gen.primitiveToTypescriptValue(id)
  const tsUri = gen.primitiveToTypescriptValue(uri)
  const tsName = gen.primitiveToTypescriptValue(pkg.name)
  const tsVersion = gen.primitiveToTypescriptValue(pkg.version)

  return [
    consts.GENERATED_HEADER,
    'import * as sdk from "@botpress/sdk"',
    '',
    `import definition from "${utils.path.toNormalizedPosixPath(definitionImport)}"`,
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

const generateIntegrationPackageFromRemote = async (
  pkg: Extract<types.IntegrationInstallablePackage, { source: 'remote' }>
): Promise<types.File[]> => {
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

const generateIntegrationPackageFromLocal = async (
  pkg: Extract<types.IntegrationInstallablePackage, { source: 'local' }>
): Promise<types.File[]> => {
  let definitionImport: string = utils.path.join(pkg.path, consts.fromWorkDir.integrationDefinition)
  definitionImport = utils.path.rmExtension(definitionImport)
  return [
    {
      path: consts.INDEX_FILE,
      content: generateIntegrationPackageModule(definitionImport, pkg),
    },
  ]
}

export const generateIntegrationPackage = async (pkg: types.IntegrationInstallablePackage): Promise<types.File[]> => {
  if (pkg.source === 'remote') {
    return generateIntegrationPackageFromRemote(pkg)
  }
  return generateIntegrationPackageFromLocal(pkg)
}
