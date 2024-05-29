import * as utils from '../utils'
type StrTransform = (str: string) => string

const apply = (str: string, ...transforms: StrTransform[]) => transforms.reduce((acc, transform) => transform(acc), str)

export const typeName = (name: string) => apply(name, utils.casing.to.pascalCase)
export const importAlias = (name: string) => apply(name, utils.casing.to.camelCase)
