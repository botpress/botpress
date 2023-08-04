export type IntegrationInstance<Name extends string> = {
  id: string
  enabled?: boolean
  configuration?: Record<string, any>

  name: Name
  version: string
}
