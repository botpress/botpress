import { FormAdvancedSetting } from '../../utils/typings'
import { FormData, FormField } from 'botpress/sdk'

export interface FormProps {
  bp?: any
  customFields?: {[field: string]: (props: any) => JSX.Element}
  fields: FormField[]
  advancedSettings?: FormAdvancedSetting[]
  formData?: FormData
  getEmptyData?: (renderType?: string) => FormData
  onUpdate: (data: { [key: string]: string }) => void
}
