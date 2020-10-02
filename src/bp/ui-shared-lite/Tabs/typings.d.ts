// @ts-nocheck
export interface Tab {
  id: string
  disabled?: boolean
  className?: string
  title: string | JSX.Element
}

export interface TabsProps {
  tabs: Tab[]
  className?: string
  shouldFloat?: boolean // CSS float to align with another element
  tabChange?: (tab: string) => void
  currentTab?: string
}
