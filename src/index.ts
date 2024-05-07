import { jsonSchemaToZui } from './transforms/json-schema-to-zui'
import { zuiToJsonSchema } from './transforms/zui-to-json-schema'
import { objectToZui } from './transforms/object-to-zui'
import { toTypescriptTypings } from './transforms/zui-to-typescript'

export type {
  BaseType,
  UIComponentDefinitions,
  ZuiComponentMap,
  AsBaseType,
  ZuiReactComponent,
  DefaultComponentDefinitions,
  ZuiReactComponentProps,
  JSONSchema,
  JSONSchemaOfType,
  MergeUIComponentDefinitions,
} from './ui/types'
export type { BoundaryFallbackComponent } from './ui/ErrorBoundary'
export { ZuiForm, type ZuiFormProps } from './ui'
export * from './z'

export const transforms = {
  jsonSchemaToZui,
  zuiToJsonSchema,
  objectToZui,
  zuiToTypescriptTypings: toTypescriptTypings,
}
