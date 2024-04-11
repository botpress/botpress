import * as z from './z'
import { UIComponentDefinitions } from './ui/types'
export type { BaseType, UIComponentDefinitions, ZuiComponentMap, AsBaseType, ZuiReactComponent } from './ui/types'
export { ZuiForm, type ZuiFormProps } from './ui'

import { jsonSchemaToZui } from './transforms/json-schema-to-zui'
import { zuiToJsonSchema } from './transforms/zui-to-json-schema'
import { objectToZui } from './transforms/object-to-zui'
import { toTypescriptTypings } from './transforms/zui-to-typescript'

export const transforms = {
  jsonSchemaToZui,
  zuiToJsonSchema,
  objectToZui,
  zuiToTypescriptTypings: toTypescriptTypings,
}

export interface ComponentDefinitions {}

export type GlobalComponentDefinitions = ComponentDefinitions extends {
  components: infer TComponentMap extends UIComponentDefinitions
}
  ? TComponentMap
  : any

export { z }
export default z
