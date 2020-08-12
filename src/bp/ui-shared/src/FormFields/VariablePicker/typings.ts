import { FlowVariable, FormField } from 'botpress/sdk'

export interface VariablePickerProps {
  field: FormField
  data: FormData
  addVariable: (variable: FlowVariable) => void
  variables: FlowVariable[]
  defaultVariableType?: string
  className?: string
  variableTypes: string[]
}
