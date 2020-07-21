import { BotEvent, FlowVariable } from 'botpress/sdk'

export interface SuperInputProps {
  addVariable?: (variable: FlowVariable) => void
  variables?: FlowVariable[]
  defaultVariableType?: string
  events?: BotEvent[]
  className?: string
  variableTypes?: string[]
  multiple?: boolean
  isFocused?: boolean
  canPickEvents?: boolean
  canPickVariables?: boolean
  canAddElements?: boolean
}
