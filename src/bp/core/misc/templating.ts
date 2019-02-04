import _ from 'lodash'
import Mustache from 'mustache'

export function renderRecursive(template: string, context: any): string {
  let i = 0
  while (i < 3 && containsTemplate(template)) {
    template = Mustache.render(template, context)
    i++
  }
  return template
}

function containsTemplate(value: string) {
  return _.isString(value) && value.indexOf('{{') < value.indexOf('}}')
}
