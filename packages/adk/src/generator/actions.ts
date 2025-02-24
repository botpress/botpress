import { readFile } from 'fs/promises'
import { loadCode } from '../utils/code'
import { formatName } from '../utils/string'
import { createFile } from '../utils/fs'

type GenerateActionParams = {
  path: string
}

export const generateAction = async ({ path }: GenerateActionParams) => {
  const { pascalCaseName, kebabCaseName } = formatName(path)

  const entities = await readFile('.botpress/entities.ts', 'utf-8')

  const m = await loadCode(path, entities)
  const inputTypescriptType = (m as any).input.toTypescript()
  const outputTypescriptType = (m as any).output.toTypescript()

  const code = `export type Input = ${inputTypescriptType}\n\nexport type Output = ${outputTypescriptType}\n\nexport type Action = (input: Input) => Promise<Output> | Output\n\ndeclare global {namespace Actions {type ${pascalCaseName} = Action}}\n\nexport {}`

  await createFile(`.botpress/actions/${kebabCaseName}.ts`, code)
}

export const initAction = async (path: string) => {
  const { pascalCaseName } = formatName(path)

  const content = await readFile(path, 'utf-8')

  if (content.trim()) {
    return
  }

  const code = `export const input = z.object({})

export const output = z.object({})

export const action: Actions.${pascalCaseName} = async ({  }) => {}\n`

  await createFile(path, code)
}
