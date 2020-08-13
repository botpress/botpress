import { FlowVariable, FormField } from 'botpress/sdk'
import { Variables } from 'common/typings'

export interface VariablePickerProps {
  field: FormField
  data: FormData
  addVariable: (variable: FlowVariable) => void
  variables: Variables
  defaultVariableType?: string
  className?: string
  variableTypes: string[]
}
