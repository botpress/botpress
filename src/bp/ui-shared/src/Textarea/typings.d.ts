export interface TextareaProps {
  rows: number
  className?: string
  placeholder?: string
  isFocused?: boolean
  onChange: () => void
  onKeyDown: () => void
  value: string
}
