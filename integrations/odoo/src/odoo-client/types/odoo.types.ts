export type OdooContext = Record<string, unknown>

export type OdooDomainCondition = unknown[]
export type OdooDomainOperator = '&' | '|' | '!'
export type OdooDomain = Array<OdooDomainCondition | OdooDomainOperator>

export type OdooRecord = Record<string, unknown> & { id?: number }

export type OdooMany2One = [id: number, displayName: string]
