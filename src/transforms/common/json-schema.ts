import { JSONSchema7 } from 'json-schema'
import { util } from '../../z/types/utils'
import z from '../../z'
import { ZuiExtensionObject } from '../../ui/types'

/**
 * Definitions:
 *
 * Mutiple zui schemas map to the same JSON schema; undefined/never, any/unknown, union/discriminated-union
 * Adding some ZodDef to the ZuiExtension allows us to differentiate between them
 */
type NullableDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodNullable }, Partial<z.ZodNullableDef>>
type OptionalDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodOptional }, Partial<z.ZodOptionalDef>>
type UndefinedDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUndefined }, Partial<z.ZodUndefinedDef>>
type UnknownDef = util.Satisfies<{ typeName: z.ZodFirstPartyTypeKind.ZodUnknown }, Partial<z.ZodUnknownDef>>

/**
 * ZuiJSONSchema:
 *
 * A ZUI flavored subset of JSONSchema7
 */

type ZuiExtension<Def extends Partial<z.ZodDef> = {}> = { def?: Def } & ZuiExtensionObject
type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData }
type BaseZuiJSONSchema<Def extends Partial<z.ZodDef> = {}> = util.Satisfies<
  {
    description?: string
    readOnly?: boolean
    default?: JsonData
    ['x-zui']?: ZuiExtension<Def>
  },
  JSONSchema7
>

// From the JSON Schema spec: "Format is not limited to a specific set of valid values or types. Users may define their own custom keywords"
type _ZodSpecificStringFormat = 'cuid' | 'cuid2' | 'emoji' | 'ulid'
type _JSONSchemaStringFormat = 'date-time' | 'email' | 'ipv4' | 'ipv6' | 'uri' | 'uuid'
type _StringSchema = util.Satisfies<
  {
    type: 'string'
    pattern?: string
    format?: _JSONSchemaStringFormat | _ZodSpecificStringFormat
    minLength?: number
    maxLength?: number
  },
  JSONSchema7
>
type _ZodSpecificNumberFormat = 'finite'
type _NumberSchema = util.Satisfies<
  {
    type: 'number' | 'integer'
    minimum?: number
    exclusiveMinimum?: number
    maximum?: number
    exclusiveMaximum?: number
    multipleOf?: number
    format?: _ZodSpecificNumberFormat
  },
  JSONSchema7
>
type _BooleanSchema = util.Satisfies<{ type: 'boolean' }, JSONSchema7>
type _NullSchema = util.Satisfies<{ type: 'null' }, JSONSchema7>
type _UndefinedSchema = util.Satisfies<{ not: true }, JSONSchema7>
type _NeverSchema = util.Satisfies<{ not: true }, JSONSchema7>
type _ArraySchema = util.Satisfies<{ type: 'array'; items: Schema; minItems?: number; maxItems?: number }, JSONSchema7>
type _UnionSchema = util.Satisfies<{ anyOf: Schema[] }, JSONSchema7>
type _DiscriminatedUnionSchema = util.Satisfies<{ anyOf: Schema[] }, JSONSchema7>
type _IntersectionSchema = util.Satisfies<{ allOf: Schema[] }, JSONSchema7>
type _SetSchema = util.Satisfies<
  { type: 'array'; items: Schema; uniqueItems: true; minItems?: number; maxItems?: number },
  JSONSchema7
>
type _EnumSchema = util.Satisfies<{ type: 'string'; enum: string[] }, JSONSchema7>
type _RefSchema = util.Satisfies<{ $ref: string }, JSONSchema7>
type _ObjectSchema = util.Satisfies<
  {
    type: 'object'
    properties: { [key: string]: Schema }
    additionalProperties?: Schema | boolean
    required?: string[]
  },
  JSONSchema7
>
type _TupleSchema = util.Satisfies<{ type: 'array'; items: Schema[]; additionalItems?: Schema }, JSONSchema7>
type _RecordSchema = util.Satisfies<{ type: 'object'; additionalProperties: Schema }, JSONSchema7>
type _LiteralStringSchema = util.Satisfies<{ type: 'string'; const: string }, JSONSchema7>
type _LiteralNumberSchema = util.Satisfies<{ type: 'number'; const: number }, JSONSchema7>
type _LiteralBooleanSchema = util.Satisfies<{ type: 'boolean'; const: boolean }, JSONSchema7>
type _OptionalSchema = util.Satisfies<{ anyOf: [Schema, UndefinedSchema] }, JSONSchema7>
type _NullableSchema = util.Satisfies<{ anyOf: [Schema, NullSchema] }, JSONSchema7>

export type StringSchema = _StringSchema & BaseZuiJSONSchema
export type NumberSchema = _NumberSchema & BaseZuiJSONSchema
export type BooleanSchema = _BooleanSchema & BaseZuiJSONSchema
export type NullSchema = _NullSchema & BaseZuiJSONSchema
export type UndefinedSchema = _UndefinedSchema & BaseZuiJSONSchema<UndefinedDef>
export type NeverSchema = _NeverSchema & BaseZuiJSONSchema
export type AnySchema = BaseZuiJSONSchema
export type UnknownSchema = BaseZuiJSONSchema<UnknownDef>
export type ArraySchema = _ArraySchema & BaseZuiJSONSchema
export type UnionSchema = _UnionSchema & BaseZuiJSONSchema
export type DiscriminatedUnionSchema = _DiscriminatedUnionSchema & BaseZuiJSONSchema
export type IntersectionSchema = _IntersectionSchema & BaseZuiJSONSchema
export type SetSchema = _SetSchema & BaseZuiJSONSchema
export type EnumSchema = _EnumSchema & BaseZuiJSONSchema
export type RefSchema = _RefSchema & BaseZuiJSONSchema
export type ObjectSchema = _ObjectSchema & BaseZuiJSONSchema
export type TupleSchema = _TupleSchema & BaseZuiJSONSchema
export type RecordSchema = _RecordSchema & BaseZuiJSONSchema
export type LiteralStringSchema = _LiteralStringSchema & BaseZuiJSONSchema
export type LiteralNumberSchema = _LiteralNumberSchema & BaseZuiJSONSchema
export type LiteralBooleanSchema = _LiteralBooleanSchema & BaseZuiJSONSchema
export type OptionalSchema = _OptionalSchema & BaseZuiJSONSchema<OptionalDef>
export type NullableSchema = _NullableSchema & BaseZuiJSONSchema<NullableDef>
export type LiteralSchema = LiteralStringSchema | LiteralNumberSchema | LiteralBooleanSchema

/**
 * Zui flavored JSON Schema; a subset of JSONSchema7 that includes Zui extensions
 */
export type Schema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | UndefinedSchema
  | NullSchema
  | AnySchema
  | UnknownSchema
  | NeverSchema
  | ArraySchema
  | ObjectSchema
  | UnionSchema
  | DiscriminatedUnionSchema
  | IntersectionSchema
  | TupleSchema
  | RecordSchema
  | SetSchema
  | LiteralSchema
  | EnumSchema
  | RefSchema
  | OptionalSchema
  | NullableSchema
