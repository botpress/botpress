import { to } from '@botpress/cli/dist/utils/case-utils'
import { parse } from 'path'

export const formatName = (path: string) => {
  const pathInfo = parse(path)

  return {
    pascalCaseName: to.pascalCase(pathInfo.name),
    kebabCaseName: to.kebabCase(pathInfo.name),
    camelcaseName: to.camelCase(pathInfo.name),
  }
}
