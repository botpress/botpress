import { loadCode } from '../utils/code'
import { formatName } from '../utils/string'
import { createFile } from '../utils/fs'

type GenerateActionParams = {
  path: string
}

export const generateEntity = async ({ path }: GenerateActionParams) => {
  const { pascalCaseName, kebabCaseName } = formatName(path)

  const m = await loadCode(path)
  const schemaZuiType = (m as any).schema.toTypescriptSchema()

  const typesCode = `
export const schema = ${schemaZuiType}

declare global {
  namespace Entities {
    type ${pascalCaseName} = typeof schema;
  }
}

export {}`

  await createFile(`.botpress/entities/${kebabCaseName}/types.ts`, typesCode)
  await createFile(`.botpress/entities/${kebabCaseName}/schema.ts`, schemaZuiType)
}
