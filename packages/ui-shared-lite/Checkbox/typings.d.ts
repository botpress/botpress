import { CheckboxProps as BlueprintCheckboxProps } from '@blueprintjs/core'
import { ChangeEvent } from 'react'
export interface CheckboxProps extends BlueprintCheckboxProps {
  fieldKey?: string
  className?: string
  label: string | JSX.Element
  checked: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  children?: JSX.Element
}
