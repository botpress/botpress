export interface TextFieldsArrayProps {
  addBtnLabel: string
  items: string[]
  moreInfo?: JSX.Element
  label?: string
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
}
