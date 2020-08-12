export interface TextFieldsArrayProps {
  addBtnLabel: string
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  validationPattern?: RegExp
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
}
