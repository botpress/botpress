export interface FormProps {
  bp: any
  formData: { [key: string]: string }
  contentType: string
  onUpdate: (data: { [key: string]: string }) => void
}
