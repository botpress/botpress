export interface SuperInputArrayProps {
  addBtnLabel: string
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  variableTypes?: string[]
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
  onUpdateVariables?: (variable: FlowVariable) => void
  canPickEvents?: boolean
  canPickVariables?: boolean
  variables?: FlowVariable[]
  events?: BotEvent[]
}
