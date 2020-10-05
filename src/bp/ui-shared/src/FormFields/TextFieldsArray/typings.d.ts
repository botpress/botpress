export interface TextFieldsArrayProps {
  addBtnLabel: string
  addBtnLabelTooltip?: string
  refValue?: string[]
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  data?: any
  validation?: {
    regex?: RegExp | { pattern: string; matchCase?: string }
    list?: any[]
    validator?: (items: any[], newItem: any) => boolean
  }
  minimum: number
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
}
