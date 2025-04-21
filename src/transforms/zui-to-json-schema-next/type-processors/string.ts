import { zuiKey } from '../../../ui/constants'
import z from '../../../z'
import { generateDatetimeRegex } from '../../../z/types/string/datetime'
import { regexUtils } from '../../common'
import * as errors from '../../common/errors'
import * as json from '../../common/json-schema'
import { zodPatterns } from '../../zui-to-json-schema/parsers/string'

export const zodStringToJsonString = (zodString: z.ZodString): json.StringSchema => {
  const schema: json.StringSchema = {
    type: 'string',
    description: zodString.description,
    'x-zui': zodString._def['x-zui'],
  }

  if (zodString._def[zuiKey]) {
    schema[zuiKey] = zodString._def[zuiKey]
  }

  for (const check of zodString._def.checks) {
    switch (check.kind) {
      case 'cuid':
        schema.format = 'cuid'
        schema.pattern = zodPatterns.cuid
        break
      case 'cuid2':
        schema.format = 'cuid2'
        schema.pattern = zodPatterns.cuid2
        break
      case 'ulid':
        schema.format = 'ulid'
        schema.pattern = zodPatterns.ulid
        break
      case 'uuid':
        schema.format = 'uuid'
        schema.pattern = zodPatterns.uuid
        break
      case 'emoji':
        schema.format = 'emoji'
        schema.pattern = zodPatterns.emoji
        break
      case 'email':
        schema.format = 'email'
        schema.pattern = zodPatterns.email
        break
      case 'ip':
        schema.format = check.version === 'v6' ? 'ipv6' : 'ipv4'
        schema.pattern = check.version === 'v6' ? zodPatterns.ipv6 : zodPatterns.ipv4
        break
      case 'datetime':
        schema.format = 'date-time'
        schema.pattern = generateDatetimeRegex(check).source
        schema[zuiKey] = { ...schema[zuiKey], precision: check.precision, offset: check.offset }
        break
      case 'url':
        schema.format = 'uri'
        break
      case 'endsWith':
        schema.pattern = `${regexUtils.escapeSpecialChars(check.value)}$`
        break
      case 'startsWith':
        schema.pattern = `^${regexUtils.escapeSpecialChars(check.value)}`
        break
      case 'includes':
        const positionPredicate = check.position && check.position >= 1 ? `^(?:.{${check.position}}).*` : ''
        schema.pattern = `${positionPredicate}${regexUtils.escapeSpecialChars(check.value)}`
        break
      case 'regex':
        schema.pattern = check.regex.source
        break
      case 'length':
        // NOTE: in zod, .length() refers to the exact length
        schema.minLength = schema.maxLength = Math.max(0, check.value)
        break
      case 'min':
        // NOTE: in zod, .min() is always inclusive
        schema.minLength = Math.max(0, check.value)
        break
      case 'max':
        // NOTE: in zod, .max() is always inclusive
        schema.maxLength = Math.max(0, check.value)
        break
      default:
        throw new errors.UnsupportedZuiCheckToJsonSchemaError({
          zodType: z.ZodFirstPartyTypeKind.ZodString,
          checkKind: check.kind,
        })
    }
  }

  return schema
}
