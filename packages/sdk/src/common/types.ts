import * as typeUtils from '../utils/type-utils'
import { z } from '../zui'

// TODO: find a way to make ToTags evaluate to Record<string, never> when TTags is never

export type ToTags<TTags extends string | number | symbol> = typeUtils.Cast<
  Partial<Record<TTags, string>>,
  Record<string, string>
>

export type ToNullableTags<TTags extends string | number | symbol> = typeUtils.Cast<
  Partial<Record<TTags, string | null>>,
  Record<string, string | null>
>

export type SchemaTransformOptions = {
  useLegacyZuiTransformer?: boolean
  toJSONSchemaOptions?: Partial<z.transforms.JSONSchemaGenerationOptions>
}
