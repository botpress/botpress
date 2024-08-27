import { jsonSchemaToZui } from './transforms/json-schema-to-zui'
import { zuiToJsonSchema } from './transforms/zui-to-json-schema'
import { objectToZui } from './transforms/object-to-zui'
import {
  toTypescript,
  UntitledDeclarationError,
  TypescriptGenerationOptions,
} from './transforms/zui-to-typescript-next'

export * from './ui'
export * from './z'

export const transforms = {
  jsonSchemaToZui,
  zuiToJsonSchema,
  objectToZui,
  toTypescript,
}

export { UntitledDeclarationError, type TypescriptGenerationOptions }
