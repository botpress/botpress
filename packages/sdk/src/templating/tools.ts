import * as casing from './case-utils'

export type Tool = (str: string) => string
export const toUpperCase: Tool = (str) => str.toUpperCase()
export const toLowerCase: Tool = (str) => str.toLowerCase()
export const pascalCase: Tool = (str) => casing.to.pascalCase(str)
export const kebabCase: Tool = (str) => casing.to.kebabCase(str)
export const snakeCase: Tool = (str) => casing.to.snakeCase(str)
export const screamingSnakeCase: Tool = (str) => casing.to.screamingSnakeCase(str)
export const camelCase: Tool = (str) => casing.to.camelCase(str)
