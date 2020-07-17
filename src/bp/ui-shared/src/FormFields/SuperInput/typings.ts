import { BotEvent, FlowVariable } from 'botpress/sdk'

export interface SuperInputProps {
  addVariable?: (variable: FlowVariable) => void
  setCanOutsideClickClose?: (canOutsideClick: boolean) => void
  variables?: FlowVariable[]
  defaultVariableType?: string
  events?: BotEvent[]
  className?: string
  multiple?: boolean
  isFocused?: boolean
  canPickEvents?: boolean
  canAddElements?: boolean
}
