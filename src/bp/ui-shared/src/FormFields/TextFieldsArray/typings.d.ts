export interface TextFieldsArrayProps {
  addBtnLabel: string
  refValue?: string[]
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  validationPattern?: RegExp
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
}
