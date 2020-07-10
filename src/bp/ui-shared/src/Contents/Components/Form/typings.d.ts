import { FormData, FormField } from 'botpress/sdk'

export interface FormProps {
  axios?: any
  currentLang?: string
  mediaPath?: string
  overrideFields?: {[field: string]: (props: any) => JSX.Element}
  fields: FormField[]
  advancedSettings?: FormField[]
  formData?: FormData
  onUpdate: (data: { [key: string]: string }) => void
}
