import { IconName } from '@blueprintjs/core'

export interface MenuItem {
  name: string
  path: string
  tooltip?: string | JSX.Element
  icon: IconName | JSX.Element
}

export interface MainMenuProps {
  className?: string
  items?: MenuItem[]
}
