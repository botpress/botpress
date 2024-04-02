import { UIComponentDefinitions } from './ui/types'
import { zui } from './zui'
export type { BaseType, UIComponentDefinitions, ZuiComponentMap, AsBaseType, ZuiReactComponent } from './ui/types'
export { ZuiForm, type ZuiFormProps } from './ui'
export type { Zui, ZuiType, Infer, ZuiExtension, ZuiRawShape, ZuiTypeAny } from './zui'

export { jsonSchemaToZui } from './transforms/json-schema-to-zui'
export { zuiToJsonSchema } from './transforms/zui-to-json-schema'
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
