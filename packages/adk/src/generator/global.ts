import * as glob from 'glob'
import { createFile } from '../utils/fs'
import { formatName } from '../utils/string'
import { readFile } from 'fs/promises'

export const generateGlobals = async () => {
  const actionFiles = glob.sync('src/actions/*.ts')
  const entitiesFiles = glob.sync('src/entities/*.ts')

  const schemaFiles = glob.sync('.botpress/entities/*/schema.ts')

  const actionInfos = []

  for (const actionFile of actionFiles) {
    actionInfos.push(formatName(actionFile))
  }

  const entityInfos = []

  for (const entityFile of entitiesFiles) {
    entityInfos.push(formatName(entityFile))
  }

  let entityCode = 'const entities = {\n'

  for (const schemaFile of schemaFiles) {
    const content = await readFile(schemaFile, 'utf-8')
    const { camelcaseName } = formatName(schemaFile.replace('/schema.ts', '.ts'))
    entityCode += `${camelcaseName}: ${content},\n`
  }

  entityCode += '}'

  await createFile(`.botpress/entities.ts`, entityCode)

  const runtimeCode = `
import { z, BotSpecificClient } from '@botpress/sdk'

type Zui = typeof z

declare global {
  var z: Zui;
  var client: BotSpecificClient<{actions: {}, events: {}, integrations: {}, states: {}, tables: {}}>;
  var actions: { \n${actionInfos.map((actionInfo) => `${actionInfo.camelcaseName}: Actions.${actionInfo.pascalCaseName}`).join('\n')} };
  var entities: { \n${entityInfos.map((entityInfo) => `${entityInfo.camelcaseName}: Entities.${entityInfo.pascalCaseName}`).join('\n')} };
}

export {}
`

  await createFile(`.botpress/runtime.ts`, runtimeCode)
}
