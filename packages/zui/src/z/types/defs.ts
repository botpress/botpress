import type {
  ZodAnyDef,
  ZodArrayDef,
  ZodBigIntDef,
  ZodBooleanDef,
  ZodBrandedDef,
  ZodCatchDef,
  ZodDateDef,
  ZodDefaultDef,
  ZodDiscriminatedUnionDef,
  ZodEnumDef,
  ZodFunctionDef,
  ZodIntersectionDef,
  ZodLazyDef,
  ZodLiteralDef,
  ZodMapDef,
  ZodNativeEnumDef,
  ZodNeverDef,
  ZodNullDef,
  ZodNullableDef,
  ZodNumberDef,
  ZodObjectDef,
  ZodOptionalDef,
  ZodPipelineDef,
  ZodPromiseDef,
  ZodReadonlyDef,
  ZodRecordDef,
  ZodStringDef,
  ZodEffectsDef,
  ZodTupleDef,
  ZodUndefinedDef,
  ZodUnionDef,
  ZodUnknownDef,
  ZodVoidDef,
  ZodRefDef,
  ZodSetDef,
} from './index'

export type ZodDef =
  | ZodStringDef
  | ZodNumberDef
  | ZodBigIntDef
  | ZodBooleanDef
  | ZodDateDef
  | ZodUndefinedDef
  | ZodNullDef
  | ZodDefaultDef // contains functions
  | ZodCatchDef // contains functions
  | ZodReadonlyDef
  | ZodDiscriminatedUnionDef
  | ZodBrandedDef
  | ZodPipelineDef
  | ZodAnyDef
  | ZodUnknownDef
  | ZodNeverDef
  | ZodVoidDef
  | ZodArrayDef
  | ZodObjectDef // contains functions
  | ZodUnionDef
  | ZodIntersectionDef
  | ZodTupleDef
  | ZodRecordDef
  | ZodMapDef
  | ZodFunctionDef
  | ZodLazyDef // contains functions
  | ZodLiteralDef
  | ZodEnumDef
  | ZodEffectsDef // contains functions
  | ZodNativeEnumDef
  | ZodOptionalDef
  | ZodNullableDef
  | ZodPromiseDef
  | ZodRefDef
  | ZodSetDef

export enum ZodFirstPartyTypeKind {
  ZodString = 'ZodString',
  ZodNumber = 'ZodNumber',
  ZodNaN = 'ZodNaN',
  ZodBigInt = 'ZodBigInt',
  ZodBoolean = 'ZodBoolean',
  ZodDate = 'ZodDate',
  ZodSymbol = 'ZodSymbol',
  ZodUndefined = 'ZodUndefined',
  ZodNull = 'ZodNull',
  ZodAny = 'ZodAny',
  ZodUnknown = 'ZodUnknown',
  ZodNever = 'ZodNever',
  ZodVoid = 'ZodVoid',
  ZodArray = 'ZodArray',
  ZodObject = 'ZodObject',
  ZodUnion = 'ZodUnion',
  ZodDiscriminatedUnion = 'ZodDiscriminatedUnion',
  ZodIntersection = 'ZodIntersection',
  ZodTuple = 'ZodTuple',
  ZodRecord = 'ZodRecord',
  ZodRef = 'ZodRef',
  ZodMap = 'ZodMap',
  ZodSet = 'ZodSet',
  ZodFunction = 'ZodFunction',
  ZodLazy = 'ZodLazy',
  ZodLiteral = 'ZodLiteral',
  ZodEnum = 'ZodEnum',
  ZodEffects = 'ZodEffects',
  ZodNativeEnum = 'ZodNativeEnum',
  ZodOptional = 'ZodOptional',
  ZodNullable = 'ZodNullable',
  ZodDefault = 'ZodDefault',
  ZodCatch = 'ZodCatch',
  ZodPromise = 'ZodPromise',
  ZodBranded = 'ZodBranded',
  ZodPipeline = 'ZodPipeline',
  ZodReadonly = 'ZodReadonly',
}

export type KindToDef<T extends ZodFirstPartyTypeKind> = T extends ZodFirstPartyTypeKind.ZodString
  ? ZodStringDef
  : T extends ZodFirstPartyTypeKind.ZodNumber
    ? ZodNumberDef
    : T extends ZodFirstPartyTypeKind.ZodBigInt
      ? ZodBigIntDef
      : T extends ZodFirstPartyTypeKind.ZodBoolean
        ? ZodBooleanDef
        : T extends ZodFirstPartyTypeKind.ZodDate
          ? ZodDateDef
          : T extends ZodFirstPartyTypeKind.ZodUndefined
            ? ZodUndefinedDef
            : T extends ZodFirstPartyTypeKind.ZodNull
              ? ZodNullDef
              : T extends ZodFirstPartyTypeKind.ZodAny
                ? ZodAnyDef
                : T extends ZodFirstPartyTypeKind.ZodUnknown
                  ? ZodUnknownDef
                  : T extends ZodFirstPartyTypeKind.ZodNever
                    ? ZodNeverDef
                    : T extends ZodFirstPartyTypeKind.ZodVoid
                      ? ZodVoidDef
                      : T extends ZodFirstPartyTypeKind.ZodArray
                        ? ZodArrayDef
                        : T extends ZodFirstPartyTypeKind.ZodObject
                          ? ZodObjectDef
                          : T extends ZodFirstPartyTypeKind.ZodUnion
                            ? ZodUnionDef
                            : T extends ZodFirstPartyTypeKind.ZodIntersection
                              ? ZodIntersectionDef
                              : T extends ZodFirstPartyTypeKind.ZodTuple
                                ? ZodTupleDef
                                : T extends ZodFirstPartyTypeKind.ZodRecord
                                  ? ZodRecordDef
                                  : T extends ZodFirstPartyTypeKind.ZodMap
                                    ? ZodMapDef
                                    : T extends ZodFirstPartyTypeKind.ZodFunction
                                      ? ZodFunctionDef
                                      : T extends ZodFirstPartyTypeKind.ZodLazy
                                        ? ZodLazyDef
                                        : T extends ZodFirstPartyTypeKind.ZodLiteral
                                          ? ZodLiteralDef
                                          : T extends ZodFirstPartyTypeKind.ZodEnum
                                            ? ZodEnumDef
                                            : T extends ZodFirstPartyTypeKind.ZodEffects
                                              ? ZodEffectsDef
                                              : T extends ZodFirstPartyTypeKind.ZodNativeEnum
                                                ? ZodNativeEnumDef
                                                : T extends ZodFirstPartyTypeKind.ZodOptional
                                                  ? ZodOptionalDef
                                                  : T extends ZodFirstPartyTypeKind.ZodNullable
                                                    ? ZodNullableDef
                                                    : T extends ZodFirstPartyTypeKind.ZodPromise
                                                      ? ZodPromiseDef
                                                      : T extends ZodFirstPartyTypeKind.ZodDiscriminatedUnion
                                                        ? ZodDiscriminatedUnionDef<any>
                                                        : T extends ZodFirstPartyTypeKind.ZodCatch
                                                          ? ZodCatchDef
                                                          : T extends ZodFirstPartyTypeKind.ZodDefault
                                                            ? ZodDefaultDef
                                                            : T extends ZodFirstPartyTypeKind.ZodBranded
                                                              ? ZodBrandedDef<any>
                                                              : T extends ZodFirstPartyTypeKind.ZodPipeline
                                                                ? ZodPipelineDef<any, any>
                                                                : T extends ZodFirstPartyTypeKind.ZodReadonly
                                                                  ? ZodReadonlyDef
                                                                  : never
