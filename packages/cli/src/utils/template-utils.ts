import hb from 'handlebars'
import * as casing from './case-utils'

hb.registerHelper('toUpperCase', (s) => s.toUpperCase())
hb.registerHelper('toLowerCase', (s) => s.toLowerCase())
hb.registerHelper('pascalCase', casing.to.pascalCase)
hb.registerHelper('kebabCase', casing.to.kebabCase)
hb.registerHelper('snakeCase', casing.to.snakeCase)
hb.registerHelper('screamingSnakeCase', casing.to.screamingSnakeCase)
hb.registerHelper('camelCase', casing.to.camelCase)

export const formatHandleBars = (templateStr: string, data: Record<string, string>): string => {
  const template = hb.compile(templateStr)
  return template(data)
}
