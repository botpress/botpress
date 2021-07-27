// @ts-nocheck
import { ChangeEvent } from 'react'
export interface CheckboxProps {
  fieldKey?: string
  className?: string
  label: string | JSX.Element
  checked: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  children?: JSX.Element
}
