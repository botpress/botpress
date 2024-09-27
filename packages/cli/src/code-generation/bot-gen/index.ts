import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import * as types from '../typings'
import { BotImplementationModule } from './bot-implementation'

const generateBotImplementation = async (
  sdkBotDefinition: sdk.BotDefinition,
  implPath: string
): Promise<types.File[]> => {
  const indexModule = new BotImplementationModule(sdkBotDefinition)
  indexModule.unshift(implPath)
  return indexModule.flatten()
}

const generateBotIndex = async (implPath: string): Promise<types.File> => {
  let content = ''
  content += `export * from '../${implPath}'\n`
  return {
    path: consts.INDEX_FILE,
    content,
  }
}

export const generateBot = async (sdkBotDefinition: sdk.BotDefinition): Promise<types.File[]> => {
  const implPath = consts.fromOutDir.implementationDir
  const typingFiles = await generateBotImplementation(sdkBotDefinition, implPath)
  const indexFile = await generateBotIndex(implPath)
  return [...typingFiles, indexFile]
}
