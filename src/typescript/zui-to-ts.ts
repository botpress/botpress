import type { Options } from 'json-schema-to-typescript'

type ToTsOptions = Partial<Options>

export type { ToTsOptions }
/**
 * WARNING: Do not add node-specific libraries outside the below method
 */
export const toTypescriptTypings = async (jsonSchema: any, options?: { schemaName: string } & ToTsOptions) => {
  const module = await import('json-schema-to-typescript')

  const generatedType = await module.compile(jsonSchema, options?.schemaName ?? 'Schema', {
    bannerComment: '',
    ...options,
  })

  return !options?.schemaName
    ? generatedType.replace('export interface Schema ', '').replace('export type Schema = ', '')
    : generatedType
}
