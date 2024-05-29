import * as utils from '../utils'
type StrTransform = (str: string) => string

const apply = (str: string, ...transforms: StrTransform[]) => transforms.reduce((acc, transform) => transform(acc), str)

/**
 *
 * @param input any string
 * @returns the input string with all non-alphanumeric characters (excluding underscore) replaced
 */
const sanitize =
  (replace?: string) =>
  (input: string): string => {
    const pattern = /[^a-zA-Z0-9_]/g
    return input.replace(pattern, replace || '')
  }

export const typeName = (name: string) => apply(name, sanitize(''), utils.casing.to.pascalCase)
export const importAlias = (name: string) => apply(name, utils.casing.to.camelCase, sanitize('_'))
