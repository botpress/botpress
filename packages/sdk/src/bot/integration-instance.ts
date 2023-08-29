export type IntegrationInstance<TName extends string> = {
  id: string | null
  enabled?: boolean
  configuration?: Record<string, any>

  name: TName
  version: string
}
