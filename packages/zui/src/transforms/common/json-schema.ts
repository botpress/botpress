import { JSONSchema7 } from 'json-schema'
import { ZuiExtensionObject } from '../../ui/types'
import z from '../../z'
import * as utils from '../../z/utils/type-utils'

/**
 * Definitions:
 *
 * Mutiple zui schemas map to the same JSON schema; undefined/never, any/unknown, union/discriminated-union
 * Adding some ZodDef to the ZuiExtension allows us to differentiate between them
 */
type NullableDef = utils.Satisfies<{ typeName: 'ZodNullable' }, Partial<z.ZodNullableDef>>
type OptionalDef = utils.Satisfies<{ typeName: 'ZodOptional' }, Partial<z.ZodOptionalDef>>
type UndefinedDef = utils.Satisfies<{ typeName: 'ZodUndefined' }, Partial<z.ZodUndefinedDef>>
type UnknownDef = utils.Satisfies<{ typeName: 'ZodUnknown' }, Partial<z.ZodUnknownDef>>
type DiscriminatedUnionDef = utils.Satisfies<
  { typeName: 'ZodDiscriminatedUnion'; discriminator?: string },
  Partial<z.ZodDiscriminatedUnionDef>
>

/**
 * ZuiJSONSchema:
 *
 * A ZUI flavored subset of JSONSchema7
 */

type ZuiExtension<Def extends Partial<z.ZodDef> = {}> = { def?: Def } & ZuiExtensionObject
type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData }
type BaseZuiJSONSchema<Def extends Partial<z.ZodDef> = {}> = utils.Satisfies<
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
type _StringSchema = utils.Satisfies<
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
type _NumberSchema = utils.Satisfies<
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
type _BooleanSchema = utils.Satisfies<{ type: 'boolean' }, JSONSchema7>
type _NullSchema = utils.Satisfies<{ type: 'null' }, JSONSchema7>
type _UndefinedSchema = utils.Satisfies<{ not: true }, JSONSchema7>
type _NeverSchema = utils.Satisfies<{ not: true }, JSONSchema7>
type _ArraySchema = utils.Satisfies<{ type: 'array'; items: Schema; minItems?: number; maxItems?: number }, JSONSchema7>
type _UnionSchema = utils.Satisfies<{ anyOf: Schema[] }, JSONSchema7>
type _DiscriminatedUnionSchema = utils.Satisfies<{ anyOf: Schema[] }, JSONSchema7>
type _IntersectionSchema = utils.Satisfies<{ allOf: Schema[] }, JSONSchema7>
type _SetSchema = utils.Satisfies<
  { type: 'array'; items: Schema; uniqueItems: true; minItems?: number; maxItems?: number },
  JSONSchema7
>
type _EnumSchema = utils.Satisfies<{ type: 'string'; enum: string[] }, JSONSchema7>
type _RefSchema = utils.Satisfies<{ $ref: string }, JSONSchema7>
type _ObjectSchema = utils.Satisfies<
  {
    type: 'object'
    properties: { [key: string]: Schema }
    additionalProperties?: Schema | boolean
    required?: string[]
  },
  JSONSchema7
>
type _TupleSchema = utils.Satisfies<{ type: 'array'; items: Schema[]; additionalItems?: Schema }, JSONSchema7>
type _RecordSchema = utils.Satisfies<{ type: 'object'; additionalProperties: Schema }, JSONSchema7>
type _LiteralStringSchema = utils.Satisfies<{ type: 'string'; const: string }, JSONSchema7>
type _LiteralNumberSchema = utils.Satisfies<{ type: 'number'; const: number }, JSONSchema7>
type _LiteralBooleanSchema = utils.Satisfies<{ type: 'boolean'; const: boolean }, JSONSchema7>
type _OptionalSchema = utils.Satisfies<{ anyOf: [Schema, UndefinedSchema] }, JSONSchema7>
type _NullableSchema = utils.Satisfies<{ anyOf: [Schema, NullSchema] }, JSONSchema7>

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
export type DiscriminatedUnionSchema = _DiscriminatedUnionSchema & BaseZuiJSONSchema<DiscriminatedUnionDef>
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
