import * as transforms from './transforms'
import { ZodType } from './z'
import { ZodBaseTypeImpl } from './z/types'

export type { JSONSchema7 } from 'json-schema'
export * as json from './transforms/common/json-schema'
export * as transforms from './transforms'
export * from './z'

ZodBaseTypeImpl.prototype.toJSONSchema = function () {
  return transforms.toJSONSchema(this as ZodType)
}

ZodBaseTypeImpl.prototype.toTypescriptType = function (opts) {
  return transforms.toTypescriptType(this as ZodType, opts)
}

ZodBaseTypeImpl.prototype.toTypescriptSchema = function () {
  return transforms.toTypescriptSchema(this as ZodType)
}
