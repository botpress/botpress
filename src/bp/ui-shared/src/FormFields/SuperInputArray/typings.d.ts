export interface SuperInputArrayProps {
  addBtnLabel: string
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
  onUpdateVariables?: (variable: FlowVariable) => void
  variables?: FlowVariable[]
  events?: BotEvent[]
}
