import * as transforms from './transforms'
import { ZodBaseTypeImpl } from './z/types'

/**
 * This module prevents circular dependencies between the Zod types and the transforms.
 * The Zod types need to reference the transforms to implement the toJSONSchema and toTypescriptType methods,
 * but the transforms also need to reference the Zod types to perform the transformations.
 *
 * By defining the methods on the prototype of ZodBaseTypeImpl here, we can break the circular dependency.
 * The Zod types can import this module to get the method implementations without importing the transforms directly.
 */

ZodBaseTypeImpl.prototype.toJSONSchema = function () {
  return transforms.toJSONSchema(this)
}

ZodBaseTypeImpl.prototype.toTypescriptType = function (opts) {
  return transforms.toTypescriptType(this, opts)
}

ZodBaseTypeImpl.prototype.toTypescriptSchema = function () {
  return transforms.toTypescriptSchema(this)
}

