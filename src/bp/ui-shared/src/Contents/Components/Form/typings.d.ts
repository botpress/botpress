import { FormAdvancedSetting, FormField } from '../../utils/typings'
import { FormData } from 'common/typings'

export interface FormProps {
  bp?: any
  fields: FormField[]
  advancedSettings?: FormAdvancedSetting[]
  formData?: FormData
  contentType?: string
  onUpdate: (data: { [key: string]: string }) => void
}
