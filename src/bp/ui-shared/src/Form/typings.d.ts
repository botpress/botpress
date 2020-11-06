import { BotEvent } from 'botpress/sdk'
import { ControlForm } from 'common/controls'

export interface InvalidField {
  field: string
  message: string
}

export type FormProps = {
  fields: ControlForm
  formData?: any
  fieldsError?: { [field: string]: string }
  onUpdate: (data: { [key: string]: any }, changedKey: string) => void
  getCustomPlaceholder?: (field: string, index) => string
  invalidFields?: InvalidField[]
} & CommonProps

interface CommonProps {
  axios?: any
  defaultLang?: string
  currentLang?: string
  mediaPath?: string
  overrideFields?: { [field: string]: (props: any) => JSX.Element }
  events?: BotEvent[]
  onCodeEdit?: (value: string | undefined, onChange: (data: string) => void, template?: string | CustomTemplate) => void
}

export type SingleControlProps = {
  control: Control
  value: any
  onChange: (value) => void
  fieldError?: string
} & CommonProps
