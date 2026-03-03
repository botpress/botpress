import { ZodNativeTypeName } from './typings'

/**
 * @deprecated - use ZodNativeTypeName instead
 */
export type ZodFirstPartyTypeKind = ZodNativeTypeName
/**
 * @deprecated - use ZodNativeTypeName instead
 */
export const ZodFirstPartyTypeKind = {
  ZodString: 'ZodString',
  ZodNumber: 'ZodNumber',
  ZodNaN: 'ZodNaN',
  ZodBigInt: 'ZodBigInt',
  ZodBoolean: 'ZodBoolean',
  ZodDate: 'ZodDate',
  ZodSymbol: 'ZodSymbol',
  ZodUndefined: 'ZodUndefined',
  ZodNull: 'ZodNull',
  ZodAny: 'ZodAny',
  ZodUnknown: 'ZodUnknown',
  ZodNever: 'ZodNever',
  ZodVoid: 'ZodVoid',
  ZodArray: 'ZodArray',
  ZodObject: 'ZodObject',
  ZodUnion: 'ZodUnion',
  ZodDiscriminatedUnion: 'ZodDiscriminatedUnion',
  ZodIntersection: 'ZodIntersection',
  ZodTuple: 'ZodTuple',
  ZodRecord: 'ZodRecord',
  ZodRef: 'ZodRef',
  ZodMap: 'ZodMap',
  ZodSet: 'ZodSet',
  ZodFunction: 'ZodFunction',
  ZodLazy: 'ZodLazy',
  ZodLiteral: 'ZodLiteral',
  ZodEnum: 'ZodEnum',
  ZodEffects: 'ZodEffects',
  ZodNativeEnum: 'ZodNativeEnum',
  ZodOptional: 'ZodOptional',
  ZodNullable: 'ZodNullable',
  ZodDefault: 'ZodDefault',
  ZodCatch: 'ZodCatch',
  ZodPromise: 'ZodPromise',
  ZodBranded: 'ZodBranded',
  ZodPipeline: 'ZodPipeline',
  ZodReadonly: 'ZodReadonly',
} satisfies {
  [K in ZodNativeTypeName]: K
}
