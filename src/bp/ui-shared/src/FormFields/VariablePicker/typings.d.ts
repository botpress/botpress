import { FlowVariable, FormField } from 'botpress/sdk'
import { Variables } from 'common/typings'

export interface VariablePickerProps {
  field: FormField
  data: { [key: string]: any }
  placeholder?: string
  onChange: (type: string) => void
  addVariable: (variable: FlowVariable) => void
  variables: Variables
  defaultVariableType?: string
  className?: string
  variableTypes: string[]
  /** Custom type for generic variable types */
  variableSubType?: string
}
