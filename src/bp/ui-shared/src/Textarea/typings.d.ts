export interface TextareaProps {
  rows: number
  className?: string
  isFocused?: boolean
  onChange: () => void
  onKeyDown: () => void
  value: string
}
