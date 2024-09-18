import { BaseIntegration } from '../integration/generic'

export type IntegrationInstance<TIntegration extends BaseIntegration> = {
  id: string | null
  enabled?: boolean

  configurationType?: string | null
  configuration?: Record<string, any>

  name: TIntegration['name']
  version: TIntegration['version']
}
