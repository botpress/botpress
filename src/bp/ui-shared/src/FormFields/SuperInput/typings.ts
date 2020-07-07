import { FlowVariable } from "botpress/sdk"

interface Events {
  [key: string]: string | Events
}

export interface SuperInputProps {
  setCanOutsideClickClose?: (canOutsideClick: boolean) => void
  variables?: FlowVariable[]
  events: Events
  canAddElements?: boolean
}
