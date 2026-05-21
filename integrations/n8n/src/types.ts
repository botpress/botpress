export type N8nNode = {
  type: string
  parameters?: Record<string, unknown>
}

export type N8nWorkflow = {
  id?: string
  name?: string
  nodes?: N8nNode[]
  activeVersion?: {
    nodes?: N8nNode[]
  }
}

export type N8nConfiguration = {
  baseUrl: string
  accessKey: string
}

export type ListWorkflowsInput = {
  active?: boolean
  name?: string
  tags?: string
  projectId?: string
  excludePinnedData?: boolean
  limit?: number
  cursor?: string
}

export type TriggerWorkflowWebhookInput = {
  workflowIdOrName: string
  body: Record<string, any>
}
