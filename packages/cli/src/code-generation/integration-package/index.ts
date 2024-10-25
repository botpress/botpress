import * as utils from '../../utils'
import * as consts from '../consts'
import * as types from '../typings'
import { IntegrationPackageDefinitionModule } from './integration-package-definition'

const generateIntegrationPackageModule = (
  definitionImport: string,
  pkg: types.IntegrationInstallablePackage
): string => {
  const refLine = pkg.source === 'local' ? `uri: "${utils.path.win32.escapeBackslashes(pkg.path)}"` : `id: "${pkg.integration.id}"`
  return [
    consts.GENERATED_HEADER,
    'import * as sdk from "@botpress/sdk"',
    '',
    `import definition from "${utils.path.win32.escapeBackslashes(definitionImport)}"`,
    '',
    'export default {',
    '  type: "integration",',
    `  ${refLine},`,
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
