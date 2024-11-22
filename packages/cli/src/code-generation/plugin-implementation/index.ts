import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import * as types from '../typings'
import { PluginImplementationModule } from './plugin-implementation'

const generatePluginImplementationCls = async (
  sdkPluginDefinition: sdk.PluginDefinition,
  implPath: string
): Promise<types.File[]> => {
  const indexModule = new PluginImplementationModule(sdkPluginDefinition)
  indexModule.unshift(implPath)
  return indexModule.flatten()
}

const generatePluginIndex = async (implPath: string): Promise<types.File> => {
  let content = ''
  content += `export * from './${implPath}'\n`
  return {
    path: consts.INDEX_FILE,
    content,
  }
}

export const generatePluginImplementation = async (
  sdkPluginDefinition: sdk.PluginDefinition
): Promise<types.File[]> => {
  const implPath = consts.fromOutDir.implementationDir
  const typingFiles = await generatePluginImplementationCls(sdkPluginDefinition, implPath)
  const indexFile = await generatePluginIndex(implPath)
  return [...typingFiles, indexFile]
}
