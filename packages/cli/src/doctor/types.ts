export type DiagnosticStatus = 'ok' | 'warning' | 'error'

export type DiagnosticCategory =
  | 'env'
  | 'project'
  | 'sdk'
  | 'auth'
  | 'network'
  | 'dependencies'
  | 'secrets'
  | 'configuration'
  | 'security'

export type DiagnosticIssue = {
  id: string
  category: DiagnosticCategory
  status: DiagnosticStatus
  message: string
  details?: Record<string, any>
  suggestion?: string
}

export type DiagnosticResult = {
  issues: DiagnosticIssue[]
  summary: {
    total: number
    ok: number
    warnings: number
    errors: number
  }
}

export type DiagnosticChecker = () => Promise<DiagnosticIssue[]>
