import { FormAdvancedSetting, FormField } from '../../utils/typings'
import { FormData } from 'botpress/sdk'

export interface FormProps {
  bp?: any
  overrideFields?: {[field: string]: (props: any) => JSX.Element}
  fields: FormField[]
  advancedSettings?: FormAdvancedSetting[]
  formData?: FormData
  contentType?: string
  onUpdate: (data: { [key: string]: string }) => void
}
