export interface FormProps {
  bp?: any
  // TODO add typings
  fields: any
  advancedSettings?: any
  formData?: { [key: string]: string }
  contentType?: string
  onUpdate: (data: { [key: string]: string }) => void
}
