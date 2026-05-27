import { z } from '@botpress/sdk'

export type OdooContext = Record<string, unknown>

export type OdooDomainCondition = unknown[]
export type OdooDomainOperator = '&' | '|' | '!'
export type OdooDomain = Array<OdooDomainCondition | OdooDomainOperator>

export const odooRecordSchema = z.record(z.string(), z.unknown()).and(z.object({ id: z.number().optional() }))

export type OdooRecord = z.infer<typeof odooRecordSchema>

export type OdooMany2One = [id: number, displayName: string]
