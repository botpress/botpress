import _ from 'lodash'
import Mustache from 'mustache'

const MAX_NESTING_LEVEL = 3
type TemplateItem = Object | Object[] | string[] | string

// Shady method to convert objects to the correct translation, then apply templates
export function renderRecursiveTranslated(item: TemplateItem, context: any, lang: string, defaultLang: string): any {
  if (_.isArray(item)) {
    return _.map(item, val => renderRecursiveTranslated(val, context, lang, defaultLang))
  } else if (typeof item === 'object') {
    return _.mapValues(item, val => {
      // TODO because of different formats for content nodes vs prompt content
      const oldFormat = item[lang] ?? item[defaultLang]
      if (oldFormat) {
        return renderRecursiveTranslated(oldFormat ?? val, context, lang, defaultLang)
      }
      return renderRecursiveTranslated(val?.[lang] ?? val?.[defaultLang] ?? val, context, lang, defaultLang)
    })
  } else if (typeof item === 'string') {
    return renderTemplate(item, context)
  } else {
    return item
  }
}

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
  if (typeof template === 'string') {
    const variables = template.match(/\$[a-zA-Z][a-zA-Z0-9_-]*/g) ?? []
    for (const match of variables) {
      const name = match.replace('$', '')
      template = template.replace(match, `{{workflow.variables.${name}}}`)
    }
  }

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
