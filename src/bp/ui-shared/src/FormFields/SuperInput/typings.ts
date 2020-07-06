interface Events {
  [key: string]: string | Events
}

export interface SuperInputProps {
  setCanOutsideClickClose?: (canOutsideClick: boolean) => void
  variables: string[]
  events: Events
  canAddElements?: boolean
}
