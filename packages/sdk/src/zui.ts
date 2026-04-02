import '@bpinternal/zui'

declare module '@bpinternal/zui' {
  export namespace z {
    export type GenericZuiSchema<
      A extends Record<string, z.ZodType> = Record<string, z.ZodType>,
      R extends z.ZodType = z.ZodType,
    > = (typeArguments: A) => R

    export type ZuiObjectSchema = z.ZodObject | z.ZodRecord
    export type ZuiObjectOrRefSchema = ZuiObjectSchema | z.ZodRef
  }
}

export { z } from '@bpinternal/zui'
