export interface TextareaProps {
  rows: number
  className?: string
  placeholder?: string
  isFocused?: boolean
  onChange: (value: string) => void
  onBlur: () => void
  onKeyDown: () => void
  value: string
}
