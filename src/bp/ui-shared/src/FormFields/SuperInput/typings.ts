import { BotEvent, FlowVariable } from 'botpress/sdk'
import { Variables } from 'common/typings'

export interface SuperInputProps {
  addVariable?: (variable: FlowVariable) => void
  variables?: Variables
  defaultVariableType?: string
  events?: BotEvent[]
  className?: string
  isPartOfArray?: boolean
  variableTypes?: string[]
  multiple?: boolean
  isFocused?: boolean
  canPickEvents?: boolean
  canPickVariables?: boolean
  canAddElements?: boolean
}
