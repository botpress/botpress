import { type JSONSchema, type LinkedJSONSchema } from './types/JSONSchema'
import { traverse } from './utils'

type Rule = (schema: JSONSchema) => boolean | void
const rules = new Map<string, Rule>()

rules.set('Enum members and tsEnumNames must be of the same length', (schema) => {
  if (schema.enum && schema.tsEnumNames && schema.enum.length !== schema.tsEnumNames.length) {
    return false
  }
})

rules.set('tsEnumNames must be an array of strings', (schema) => {
  if (schema.tsEnumNames && schema.tsEnumNames.some((_) => typeof _ !== 'string')) {
    return false
  }
})

rules.set('When both maxItems and minItems are present, maxItems >= minItems', (schema) => {
  const { maxItems, minItems } = schema
  if (typeof maxItems === 'number' && typeof minItems === 'number') {
    return maxItems >= minItems
  }
})

rules.set('When maxItems exists, maxItems >= 0', (schema) => {
  const { maxItems } = schema
  if (typeof maxItems === 'number') {
    return maxItems >= 0
  }
})

rules.set('When minItems exists, minItems >= 0', (schema) => {
  const { minItems } = schema
  if (typeof minItems === 'number') {
    return minItems >= 0
  }
})

rules.set('deprecated must be a boolean', (schema) => {
  const typeOfDeprecated = typeof schema.deprecated
  return typeOfDeprecated === 'boolean' || typeOfDeprecated === 'undefined'
})

export function validate(schema: LinkedJSONSchema, filename: string): string[] {
  const errors: string[] = []
  rules.forEach((rule, ruleName) => {
    traverse(schema, (schema, key) => {
      if (rule(schema) === false) {
        errors.push(`Error at key "${key}" in file "${filename}": ${ruleName}`)
      }
      return schema
    })
  })
  return errors
}
