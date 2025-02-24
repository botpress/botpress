import { readFile, writeFile } from 'fs/promises'
import { loadCode } from '../utils/code'
import glob from 'glob'
import { parse } from 'path'
import { to } from '../utils/string'

type GenerateActionParams = {
  path: string
}

export const generateAction = async ({ path }: GenerateActionParams) => {
  const { pascalCaseName, kebabCaseName } = getActionInfo(path)

  const m = await loadCode(path)
  const inputTypescriptType = (m as any).input.toTypescript()
  const outputTypescriptType = (m as any).output.toTypescript()

  const code = `export type Input = ${inputTypescriptType}\n\nexport type Output = ${outputTypescriptType}\n\nexport type Action = (input: Input) => Promise<Output> | Output\n\ndeclare global {namespace Actions {type ${pascalCaseName} = Action}}\n\nexport {}`

  await writeFile(`.botpress/actions/${kebabCaseName}.ts`, code)
}

export const generateGlobalActions = async () => {
  const actionFiles = glob.sync('src/actions/*.ts')

  const actionInfos = []

  for (const actionFile of actionFiles) {
    actionInfos.push(getActionInfo(actionFile))
  }

  await writeFile(
    `.botpress/global-actions.ts`,
    `declare global { var actions: { \n${actionInfos.map((actionInfo) => `${actionInfo.camelcaseName}: Actions.${actionInfo.pascalCaseName}`).join('\n')} } } export {}`
  )
}

const getActionInfo = (path: string) => {
  const pathInfo = parse(path)

  return {
    pascalCaseName: to.pascalCase(pathInfo.name),
    kebabCaseName: to.kebabCase(pathInfo.name),
    camelcaseName: to.camelCase(pathInfo.name),
  }
}

export const initAction = async (path: string) => {
  const { pascalCaseName } = getActionInfo(path)

  const content = await readFile(path, 'utf-8')

  if (content.trim()) {
    return
  }

  const code = `export const input = z.object({})

export const output = z.object({})

export const action: Actions.${pascalCaseName} = async ({  }) => {}\n`

  await writeFile(path, code)
}
