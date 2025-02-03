import * as utils from '../utils'
type StrTransform = (str: string) => string

const TYPESCRIPT_RESERVED_TOKENS = new Set([
  'break',
  'as',
  'any',
  'case',
  'implements',
  'boolean',
  'catch',
  'interface',
  'constructor',
  'class',
  'let',
  'declare',
  'const',
  'package',
  'get',
  'continue',
  'private',
  'module',
  'debugger',
  'protected',
  'require',
  'default',
  'public',
  'number',
  'delete',
  'static',
  'set',
  'do',
  'yield',
  'string',
  'else',
  'symbol',
  'enum',
  'type',
  'export',
  'from',
  'extends',
  'of',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
])

const SPECIAL_FILE_NAME_CHARS = /[^a-zA-Z0-9_\-\.]/g

const escapeTypescriptReserved = (str: string): string => {
  if (TYPESCRIPT_RESERVED_TOKENS.has(str)) {
    return `_${str}`
  }
  return str
}

const escapeFileNameSpecialChars = (str: string): string => str.replace(SPECIAL_FILE_NAME_CHARS, '-')

const apply = (str: string, ...transforms: StrTransform[]) => transforms.reduce((acc, transform) => transform(acc), str)

export const typeName = (name: string) => apply(name, utils.casing.to.pascalCase)
export const importAlias = (name: string) => apply(name, utils.casing.to.camelCase, escapeTypescriptReserved)
export const varName = (name: string) => apply(name, utils.casing.to.camelCase, escapeTypescriptReserved)
export const fileName = (name: string) => apply(name, escapeFileNameSpecialChars)
