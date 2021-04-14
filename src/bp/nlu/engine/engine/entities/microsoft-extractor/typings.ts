import { ModelResult } from '@microsoft/recognizers-text'

export interface MicrosoftValue {
  value: string
  unit?: string
  type?: string
  score?: number
  otherResults?: any[]
}

export interface MicrosoftTimeValues {
  timex: string
  type: string
  start?: string
  end?: string
  value?: string
  Mod?: string
  sourceEntity?: string
}

export interface MicrosoftValues {
  values: MicrosoftTimeValues[]
}

export type MicrosoftResolution = MicrosoftValue | MicrosoftValues

export interface MicrosoftEntity extends ModelResult {
  start: number
  end: number
  resolution: MicrosoftResolution
  text: string
  typeName: string
}

export type MicrosoftSupportedLanguage = 'zh' | 'nl' | 'en' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'es'
