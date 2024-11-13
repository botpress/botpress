import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import * as types from '../typings'
import { BotImplementationModule } from './bot-implementation'

const generatePluginInstances = async (
  sdkBotDefinition: sdk.BotDefinition,
  pluginPath: string
): Promise<types.File[]> => {
  const files: types.File[] = []
  for (const [pluginName, plugin] of Object.entries(sdkBotDefinition.plugins ?? {})) {
    const implementationCodeBase64 = plugin.implementation.code
    const implementationCode = Buffer.from(implementationCodeBase64, 'base64').toString('utf-8')

    files.push({
      path: `${pluginPath}/${pluginName}/index.js`,
      content: implementationCode,
    })

    const pluginTypes = [
      //
      "import * as sdk from '@botpress/sdk'",
      'export default new sdk.Plugin({})',
    ].join('\n')

    files.push({
      path: `${pluginPath}/${pluginName}/index.d.ts`,
      content: pluginTypes,
    })
  }

  files.push({
    path: `${pluginPath}/${consts.INDEX_FILE}`,
    content: [
      //
      'export const hello = "world"', // TODO: rm
      ...Object.keys(sdkBotDefinition.plugins ?? {}).flatMap((pluginName) => [
        `import ${pluginName} from './${pluginName}'`,
        `export { ${pluginName} }`,
      ]),
    ].join('\n'),
  })

  return files
}

const generateBotImplementationCls = async (
  sdkBotDefinition: sdk.BotDefinition,
  implPath: string
): Promise<types.File[]> => {
  const indexModule = new BotImplementationModule(sdkBotDefinition)
  indexModule.unshift(implPath)
  return indexModule.flatten()
}

const generateBotIndex = async (pluginPath: string, implPath: string): Promise<types.File> => {
  let content = ''
  content += `export * from './${pluginPath}'\n`
  content += `export * from './${implPath}'\n`
  return {
    path: consts.INDEX_FILE,
    content,
  }
}

export const generateBotImplementation = async (sdkBotDefinition: sdk.BotDefinition): Promise<types.File[]> => {
  const pluginPath = consts.fromOutDir.pluginsDir
  const pluginFiles = await generatePluginInstances(sdkBotDefinition, pluginPath)
  const implPath = consts.fromOutDir.implementationDir
  const typingFiles = await generateBotImplementationCls(sdkBotDefinition, implPath)
  const indexFile = await generateBotIndex(pluginPath, implPath)
  return [...pluginFiles, ...typingFiles, indexFile]
}
