import { ZuiObjectSchema } from '../../zui'

export type BaseConfig = ZuiObjectSchema
export type BaseConfigs = Record<string, BaseConfig>
export type BaseEvents = Record<string, ZuiObjectSchema>
export type BaseActions = Record<string, ZuiObjectSchema>
export type BaseMessages = Record<string, ZuiObjectSchema>
export type BaseChannels = Record<string, BaseMessages>
export type BaseStates = Record<string, ZuiObjectSchema>
export type BaseEntities = Record<string, ZuiObjectSchema>
