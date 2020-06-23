interface TextFieldsArrayProps {
  addBtnLabel: string
  items: string[]
  label?: string
  onChange: (items: string[]) => void
  getPlaceholder?: (index: number) => string
}
