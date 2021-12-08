export interface LangServerInfo {
  version: string
  ready: boolean
  dimentions: number
  domain: string
  readOnly: boolean
}

export interface LanguageSource {
  endpoint: string
  authToken?: string
}
