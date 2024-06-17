import _ from 'lodash'
export function escapeString(str: string) {
  if (typeof str !== 'string') {
    return ''
  }

  // Use String.raw to get the raw string with escapes preserved
  const rawStr = String.raw`${str}`

  // Determine the appropriate quote style
  if (rawStr.includes('`')) {
    return `"${rawStr.replace(/"/g, '\\"')}"`
  } else if (rawStr.includes("'")) {
    return `'${rawStr.replace(/'/g, "\\'")}'`
  } else {
    return `'${rawStr}'`
  }
}

export const toPropertyKey = (key: string) => {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key
  }

  return escapeString(key)
}

export const getMultilineComment = (description?: string) => {
  const descLines = (description ?? '').split('\n').filter((l) => l.trim().length > 0)
  return descLines.length === 0
    ? ''
    : descLines.length === 1
      ? `/** ${descLines[0]} */`
      : `/**\n * ${descLines.join('\n * ')}\n */`
}

export const toValidFunctionName = (str: string) => {
  let name = _.deburr(str)
  name = name.replace(/[^a-zA-Z0-9_$]/g, '')

  if (!/^[a-zA-Z_$]/.test(name)) {
    name = `_${name}`
  }

  return _.camelCase(name)
}
