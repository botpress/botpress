import { BotEvent, FlowVariable } from 'botpress/sdk'

export interface SuperInputProps {
  setCanOutsideClickClose?: (canOutsideClick: boolean) => void
  variables?: FlowVariable[]
  events?: BotEvent[]
  multiple?: boolean
  canAddElements?: boolean
}
