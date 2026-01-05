import type {
  ZodArray,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodTuple,
  ZodTupleItems,
  ZodRawShape,
  ZodTypeAny,
} from '../index'
export namespace partialUtil {
  export type DeepPartial<T extends ZodTypeAny> =
    T extends ZodObject<ZodRawShape>
      ? ZodObject<{ [k in keyof T['shape']]: ZodOptional<DeepPartial<T['shape'][k]>> }, T['_def']['unknownKeys']>
      : T extends ZodArray<infer Type, infer Card>
        ? ZodArray<DeepPartial<Type>, Card>
        : T extends ZodOptional<infer Type>
          ? ZodOptional<DeepPartial<Type>>
          : T extends ZodNullable<infer Type>
            ? ZodNullable<DeepPartial<Type>>
            : T extends ZodTuple<infer Items>
              ? {
                  [k in keyof Items]: Items[k] extends ZodTypeAny ? DeepPartial<Items[k]> : never
                } extends infer PI
                ? PI extends ZodTupleItems
                  ? ZodTuple<PI>
                  : never
                : never
              : T
}
