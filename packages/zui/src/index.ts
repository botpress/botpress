import * as transforms from './transforms'
import { ZodBaseTypeImpl } from './z/types'

export type { JSONSchema7 } from 'json-schema'
export * as json from './transforms/common/json-schema'
export * as transforms from './transforms'
export * from './z'

ZodBaseTypeImpl.prototype.toJSONSchema = function () {
  return transforms.toJSONSchema(this)
}

ZodBaseTypeImpl.prototype.toTypescriptType = function (opts) {
  return transforms.toTypescriptType(this, opts)
}

ZodBaseTypeImpl.prototype.toTypescriptSchema = function () {
  return transforms.toTypescriptSchema(this)
}
