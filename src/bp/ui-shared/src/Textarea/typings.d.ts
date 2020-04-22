export interface TextareaProps {
  rows: number
  className?: string
  onChange: () => void
  onKeyDown: () => void
  value: string
}
