import { z } from '../../zui'

export type BaseConfig = z.ZuiObjectSchema
export type BaseConfigs = Record<string, BaseConfig>
export type BaseEvents = Record<string, z.ZuiObjectSchema>
export type BaseActions = Record<string, z.ZuiObjectSchema>
export type BaseMessages = Record<string, z.ZuiObjectSchema>
export type BaseChannels = Record<string, BaseMessages>
export type BaseStates = Record<string, z.ZuiObjectSchema>
export type BaseEntities = Record<string, z.ZuiObjectSchema>
