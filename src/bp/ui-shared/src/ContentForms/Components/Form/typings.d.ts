export interface FormProps {
  formData: { [key: string]: string }
  contentType: string
  onUpdate: (data: { [key: string]: string }) => void
}
