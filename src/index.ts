import { UIComponentDefinitions } from './ui/types'
import { zui } from './zui'
export type {
  BaseType,
  UIComponentDefinitions,
  SchemaResolversMap,
  ZuiComponentMap,
  AsBaseType,
  ZuiReactComponent,
} from './ui/types'
export {
  type ZuiFormProps,
  ZuiForm,
  schemaToUISchema,
  transformZuiComponentsToRenderers,
  defaultUISchemaResolvers,
} from './ui'
export type { Zui, ZuiType, Infer, ZuiExtension, ZuiRawShape, ZuiTypeAny } from './zui'
export type {
  JsonSchema7Type as JsonSchema7,
  JsonSchema7ObjectType as JsonSchema7Object,
} from '@bpinternal/zod-to-json-schema'

export { getZuiSchemas } from './zui-schemas'
export { jsonSchemaToZui } from './json-schema/json-schema-to-zui'
export { ZodError as ZuiError } from 'zod'

export interface ComponentDefinitions {}

export type GlobalComponentDefinitions = ComponentDefinitions extends {
  components: infer TComponentMap extends UIComponentDefinitions
}
  ? TComponentMap
  : any

export { zui } from './zui'
export { zui as z }

export default zui
