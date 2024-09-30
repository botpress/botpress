import hb from 'handlebars'
import * as tools from './tools'

hb.registerHelper('toUpperCase', tools.toUpperCase)
hb.registerHelper('toLowerCase', tools.toLowerCase)
hb.registerHelper('pascalCase', tools.pascalCase)
hb.registerHelper('kebabCase', tools.kebabCase)
hb.registerHelper('snakeCase', tools.snakeCase)
hb.registerHelper('screamingSnakeCase', tools.screamingSnakeCase)
hb.registerHelper('camelCase', tools.camelCase)

export const formatHandleBars = (templateStr: string, data: Record<string, string>): string => {
  const template = hb.compile(templateStr)
  return template(data)
}
