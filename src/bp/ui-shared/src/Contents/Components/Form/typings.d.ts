import { BotEvent, FlowVariable, FormData, FormField } from 'botpress/sdk'

export interface FormProps {
  axios?: any
  currentLang?: string
  mediaPath?: string
  overrideFields?: {[field: string]: (props: any) => JSX.Element}
  fields: FormField[]
  advancedSettings?: FormField[]
  formData?: FormData
  onUpdate: (data: { [key: string]: string }) => void
  onUpdateVariables?: (variable: FlowVariable ) => void
  variables?: FlowVariable[]
  superInputOptions?: {
    enabled?: boolean
    eventsOnly?: boolean
    variablesOnly?: boolean
  }
  events?: BotEvent[]
}
