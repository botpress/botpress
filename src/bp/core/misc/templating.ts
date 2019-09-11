import _ from 'lodash'
import Mustache from 'mustache'

const MAX_NESTING_LEVEL = 3
type TemplateItem = Object | Object[] | string[] | string

export function renderRecursive(item: TemplateItem, context: any, alwaysEscape: boolean = true): any {
  if (_.isArray(item)) {
    return _.map(item, val => renderRecursive(val, context, alwaysEscape))
  } else if (typeof item === 'object') {
    return _.mapValues(item, val => renderRecursive(val, context, alwaysEscape))
  } else if (typeof item === 'string') {
    return renderTemplate(item, context, alwaysEscape)
  } else {
    return item
  }
}

export function renderTemplate(template: string, context: any, alwaysEscape: boolean): string {
  template = alwaysEscape ? stripUnescapeChars(template) : template

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

function stripUnescapeChars(template: string): string {
  return template.replace(/{{{|{{&/g, '{{').replace(/}}}/g, '}}')
}
