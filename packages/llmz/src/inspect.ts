import bytes from 'bytes'
import { chain, isEmpty, uniq, isEqual, uniqWith, filter, mapKeys, countBy, orderBy, isNil } from 'lodash-es'

import { escapeString, getTokenizer } from './utils.js'

const SUBTITLE_LN = '--------------'
const SECTION_SEP = '\n'
const NUMBER_LOCALE = new Intl.NumberFormat('en-US')

const LONG_TEXT_LENGTH = 4096

type PreviewOptions = {
  tokens: number
}

const DEFAULT_OPTIONS: PreviewOptions = {
  tokens: 100_000,
}

type PrintResult = {
  output: string
  truncated: boolean
}

function printLimitedJson(obj: any, maxDepth: number, maxLength: number, maxKeys: number): PrintResult {
  const indent = 2
  let currentLength = 0
  let wasTruncated = false

  function recurse(currentObj: any, depth: number, currentIndent: number): string {
    if (depth > maxDepth || currentLength >= maxLength) {
      wasTruncated = true
      return '...'
    }

    if (typeof currentObj === 'object' && currentObj instanceof Date) {
      currentIndent += 3
      try {
        return currentObj.toISOString()
      } catch (err: any) {
        return `<Date: ${err?.message ?? 'Invalid Date'}>`
      }
    }

    if (typeof currentObj !== 'object' || currentObj === null) {
      const value = JSON.stringify(currentObj)
      currentLength += getTokenizer().count(value)

      return value
    }

    const indentation = ' '.repeat(currentIndent)

    if (Array.isArray(currentObj)) {
      let result = '[\n'
      for (let i = 0; i < currentObj.length && currentLength < maxLength; i++) {
        if (i > 0) {
          result += ',\n'
        }
        result += indentation + ' '.repeat(indent) + recurse(currentObj[i], depth + 1, currentIndent + indent)
      }
      result += '\n' + indentation + ']'
      currentLength += getTokenizer().count(result)
      return result
    } else {
      let result = '{\n'
      const keys = Object.keys(currentObj)
      const numKeys = keys.length
      for (let i = 0; i < Math.min(numKeys, maxKeys) && currentLength < maxLength; i++) {
        const key = keys[i]!
        if (i > 0) {
          result += ',\n'
        }
        const value = recurse(currentObj[key], depth + 1, currentIndent + indent)
        result += indentation + ' '.repeat(indent) + `"${key}": ${value}`
      }
      if (numKeys > maxKeys) {
        wasTruncated = true
        result += ',\n' + indentation + `... (${numKeys - maxKeys} more keys)`
      }
      result += '\n' + indentation + '}'
      currentLength += getTokenizer().count(result)
      return result
    }
  }

  const output = getTokenizer().truncate(recurse(obj, 0, 0), maxLength)
  return { output, truncated: wasTruncated }
}

export function extractType(value: unknown, generic: boolean = true): string {
  if (value === null) {
    return 'null'
  }

  if (value === undefined || typeof value === 'undefined') {
    return 'undefined'
  }

  if (typeof value === 'object' && Array.isArray(value)) {
    if (!generic) {
      return 'Array'
    }

    if (value.length === 0) {
      return 'Array (empty)'
    }

    if (value.length === 1) {
      return `Array<${extractType(value[0])}>`
    }

    const types = new Map()
    for (const element of value) {
      const type = extractType(element, false)
      types.set(type, (types.get(type) || 0) + 1)
    }

    if (types.size <= 3) {
      return `Array<${Array.from(types.keys()).join(' | ')}>`
    }

    return 'Array'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  if (typeof value === 'boolean') {
    return 'boolean'
  }

  if (typeof value === 'bigint') {
    return 'bigint'
  }

  if (typeof value === 'function') {
    return 'function'
  }

  if (typeof value === 'object' && value instanceof Date) {
    return 'date'
  }

  if (typeof value === 'object' && value instanceof RegExp) {
    return 'regexp'
  }

  if (value instanceof Error) {
    return 'error'
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return '<empty string>'
  }

  return typeof value
}

function previewValue(value: unknown, length: number = LONG_TEXT_LENGTH) {
  if (value === null) {
    return '<nil>'
  }

  if (value === undefined) {
    return '<undefined>'
  }

  const previewStr = (str: string) => {
    if (str.length > length) {
      return escapeString(str.slice(0, length)) + ' ... <truncated>'
    }
    return escapeString(str)
  }

  const previewObj = (obj: any) => {
    const mapped = mapKeys(obj, (_value, key) => previewStr(key))
    return JSON.stringify(mapped)
  }

  if (typeof value === 'string') {
    return '<string> ' + previewStr(value)
  }

  if (typeof value === 'object' && Array.isArray(value)) {
    return '<array> ' + previewStr(JSON.stringify(value))
  }

  if (typeof value === 'object' && value instanceof Date) {
    return '<date> ' + value.toISOString()
  }

  if (typeof value === 'object' && value instanceof RegExp) {
    return '<regexp> ' + value.toString()
  }

  if (typeof value === 'object') {
    return '<object> ' + previewObj(value)
  }

  if (typeof value === 'bigint') {
    return '<bigint> ' + value.toString()
  }

  if (typeof value === 'function') {
    return '<function> ' + value.toString()
  }

  if (typeof value === 'boolean') {
    return '<boolean> ' + value.toString()
  }

  if (value instanceof Error) {
    return '<error> ' + previewError(value)
  }

  if (typeof value === 'number') {
    return '<number> ' + value.toString()
  }

  if (typeof value === 'symbol') {
    return '<symbol> ' + value.toString()
  }

  return `${typeof value} ` + (value?.toString() ?? '<unknown>')
}

function previewError(err: Error) {
  const lines: string[] = []

  lines.push('Error: ' + err.name)
  lines.push(SUBTITLE_LN)
  lines.push(previewValue(err.message))
  lines.push(SECTION_SEP)
  lines.push('Stack Trace:')
  lines.push(SUBTITLE_LN)
  lines.push(previewValue(err.stack ?? '<no stack trace>'))

  return lines.join('\n')
}

function previewArray(arr: unknown) {
  if (!Array.isArray(arr)) {
    throw new Error('Expected an array')
  }

  const lines: string[] = []
  const getItemPreview = (value: unknown, index: number) => `[${index}]`.padEnd(15) + `  ${previewValue(value)}`

  if (arr.length === 0) {
    lines.push('// Array Is Empty (0 element)')
    return lines.join('\n').replace(/\n{2,}/g, SECTION_SEP)
  }

  if (arr.length <= 10) {
    lines.push('// Full Array Preview')
    lines.push(SUBTITLE_LN)
    lines.push(...arr.map(getItemPreview))
    return lines.join('\n').replace(/\n{2,}/g, SECTION_SEP)
  }

  lines.push('// Analysis Summary')
  lines.push(SUBTITLE_LN)

  const typesCount = countBy(arr, (item) => extractType(item, false))
  const ordered = orderBy(
    arr.filter((item) => !isNil(item) && JSON.stringify(item).length < 100),
    (item) => JSON.stringify(item),
    'asc'
  )
  const minValues = ordered.slice(0, 3).map((item) => previewValue(item, 10))
  const maxValues = ordered.slice(-3).map((item) => previewValue(item, 10))
  const uniqueItems = uniqWith(arr, isEqual)
  const nullValues = filter(arr, isNil).length
  const memoryUsage = bytes(JSON.stringify(arr).length)

  lines.push(`Total Items:     ${arr.length}`)
  lines.push(`Unique Items:    ${uniqueItems.length}`)
  lines.push(`Types:           ${JSON.stringify(typesCount)}`)
  lines.push(`Minimum Values:  [${minValues.join(', ')}]`)
  lines.push(`Maximum Values:  [${maxValues.join(', ')}]`)
  lines.push(`Memory Usage:    ${memoryUsage}`)
  lines.push(`Nil Values:      ${nullValues}`)

  lines.push('// Array Preview (truncated)')
  lines.push(SUBTITLE_LN)

  lines.push(...arr.map(getItemPreview))

  return lines.join('\n').replace(/\n{2,}/g, SECTION_SEP)
}

function previewObject(obj: unknown, options: PreviewOptions) {
  if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
    throw new Error('Expected an object')
  }

  const lines: string[] = []

  const { output, truncated } = printLimitedJson(obj, 10, options.tokens, 20)

  if (truncated) {
    lines.push(SECTION_SEP)
    lines.push('// Analysis Summary')
    lines.push(SUBTITLE_LN)

    const entries = Object.entries(obj)
    const typesCount = chain(entries)
      .countBy(([, value]) => extractType(value, false))
      .entries()
      .orderBy(1, 'desc')
      .filter(([, count]) => count > 1)
      .slice(0, 3)
      .fromPairs()
      .value()

    const keys = Object.keys(obj)
    const uniqueEntries = uniq(Object.values(obj))
    const nilValues = filter(entries, ([, value]) => isNil(value)).length
    const memoryUsage = bytes(JSON.stringify(obj).length)

    lines.push(`Total Entries:   ${NUMBER_LOCALE.format(entries.length)}`)
    lines.push(`Keys:            ${previewValue(keys)}`)
    lines.push(`Popular Types:   ${previewValue(typesCount)}`)
    lines.push(`Unique Values:   ${NUMBER_LOCALE.format(uniqueEntries.length)}`)
    lines.push(`Nil Values:      ${NUMBER_LOCALE.format(nilValues)}`)
    lines.push(`Memory Usage:    ${memoryUsage}`)
  }

  if (isEmpty(obj)) {
    lines.push('// Empty Object {}')
  } else {
    lines.push(truncated ? '// Object Preview (truncated)' : '// Full Object Preview')
    // Preview Object

    lines.push(SUBTITLE_LN)
    lines.push(output)
  }

  return lines.join('\n').replace(/\n{2,}/g, SECTION_SEP)
}

function previewLongText(text: string, length: number = LONG_TEXT_LENGTH) {
  const lines: string[] = []

  // Regex patterns to match URLs and email addresses
  const urlPattern = /https?:\/\/[^\s]+/g
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

  // SAMPLES
  lines.push('// The string is too long to fully display, here is a preview:')

  const previewStr = (str: string) => {
    if (str.length > length) {
      return str.slice(0, length) + ' ... <truncated>'
    }
    return str
  }

  lines.push(previewStr(text))
  lines.push(SUBTITLE_LN)
  lines.push('// Analysis Summary')
  lines.push(SUBTITLE_LN)

  const words = text.split(/\s+/)
  const wordCount = words.length
  const uniqueWords = uniq(words).length
  const wordFrequency = countBy(words)

  const mostCommonWords = chain(wordFrequency)
    .toPairs()
    .orderBy(1, 'desc')
    .filter(([, count]) => count > 1)
    .take(20)
    .map(([word, count]) => `"${word}" ${count} times`)
    .value()
    .join('\n' + ' '.repeat(22))

  // Extract URLs and Emails
  const urls = text.match(urlPattern) || []
  const emails = text.match(emailPattern) || []

  // Add URL and email details to the analysis summary
  if (urls.length > 0) {
    lines.push(`Found URLs:           ${urls.length}`)
    lines.push(`URLs:                ${urls.join(', ')}`)
  }

  if (emails.length > 0) {
    lines.push(`Found Emails:         ${emails.length}`)
    lines.push(`Emails:              ${emails.join(', ')}`)
  }

  lines.push(`Length:               ${NUMBER_LOCALE.format(text.length)} chars`)
  lines.push(`Word Count:           ${NUMBER_LOCALE.format(wordCount)} words`)
  lines.push(`Unique Words:         ${NUMBER_LOCALE.format(uniqueWords)}`)
  lines.push(`Most Common Words:    ${mostCommonWords}`)

  return lines.join('\n').replace(/\n{2,}/g, SECTION_SEP)
}

export const inspect = (value: unknown, name?: string, options: PreviewOptions = DEFAULT_OPTIONS) => {
  options ??= DEFAULT_OPTIONS
  options.tokens ??= DEFAULT_OPTIONS.tokens

  try {
    const genericType = extractType(value, false)

    let header = ''

    if (name) {
      header = `// const ${name}: ${genericType}\n`
    }

    if (genericType === 'Array') {
      return header + previewArray(value)
    } else if (genericType === 'error') {
      return header + previewError(value as Error)
    } else if (genericType === 'object') {
      return header + previewObject(value, options)
    } else if (genericType === 'boolean') {
      return header + previewValue(value)
    } else if (typeof value === 'string') {
      if (getTokenizer().count(value) < options.tokens) {
        return header + previewValue(value)
      } else {
        return header + previewLongText(value)
      }
    }

    return header + previewValue(value)
  } catch (err: any) {
    return `Error: ${err?.message ?? 'Unknown Error'}`
  }
}
