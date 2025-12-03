export type OAuthEndpointStrategy =
  | { type: 'default' } // Uses `${process.env.BP_WEBHOOK_URL}/oauth`
  | { type: 'wizard'; stepName: string } // Uses OAuth wizard URL
  | { type: 'custom'; endpoint: string } // Custom endpoint (for custom apps)

export type GoogleOAuthClientCredentials = {
  clientId: string
  clientSecret: string
}

export type ServiceAccountConfig = {
  clientEmail: string
  privateKey: string
  /** Optional: Email to impersonate (for domain-wide delegation) */
  impersonateEmail?: string
}

export type BaseClientContext = {
  integrationId: string
}

export type GenericBpClient = {
  getState: (input: {
    id: string
    type: 'integration' | 'conversation' | 'user' | 'bot' | 'task' | 'workflow'
    name: string
  }) => Promise<{ state: { payload: Record<string, unknown> } }>
  setState: (input: {
    id: string
    type: 'integration' | 'conversation' | 'user' | 'bot' | 'task' | 'workflow'
    name: string
    payload: Record<string, unknown> | null
    expiry?: number
  }) => Promise<{ state: { payload: Record<string, unknown> } }>
}

export type GoogleOAuthConfig = {
  scopes: string[]
  stateName?: string
  endpointStrategy?: OAuthEndpointStrategy
  credentials: GoogleOAuthClientCredentials
  serviceAccount?: ServiceAccountConfig
}
