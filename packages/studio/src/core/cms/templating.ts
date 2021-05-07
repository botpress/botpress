import _ from 'lodash'
import Mustache from 'mustache'

const MAX_NESTING_LEVEL = 3
type TemplateItem = Object | Object[] | string[] | string

export function renderRecursive(item: TemplateItem, context: any): any {
  if (_.isArray(item)) {
    return _.map(item, val => renderRecursive(val, context))
  } else if (typeof item === 'object') {
    return _.mapValues(item, val => renderRecursive(val, context))
  } else if (typeof item === 'string') {
    return renderTemplate(item, context)
  } else {
    return item
  }
}

export function renderTemplate(template: string, context: any): string {
  let i = 0
  while (i < MAX_NESTING_LEVEL && containsTemplate(template)) {
    template = Mustache.render(template, context)
    i++
  }
  return template
}

function containsTemplate(value: string) {
  return _.isString(value) && value.indexOf('{{') < value.indexOf('}}')
}
