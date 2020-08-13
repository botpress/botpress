import { FlowView } from './typings'

export interface ParsedFlowDefinition {
  topic?: string
  /** The display name of the workflow, without topic */
  workflow: string
  /** The full path of the workflow, including topic */
  workflowPath?: string
}

const getName = (name: string, includeExt?: boolean) => (includeExt ? `${name}.flow.json` : name)

export const parseFlowName = (flowName: string, includeExt?: boolean): ParsedFlowDefinition => {
  const chunks = flowName.replace(/\.flow\.json$/i, '').split('/')
  const workflowPath = getName(chunks.join('/'), includeExt)

  if (chunks.length === 1) {
    return {
      workflow: chunks[0],
      workflowPath
    }
  } else {
    return {
      topic: chunks[0],
      workflow: chunks[1],
      workflowPath
    }
  }
}

export const buildFlowName = (
  { topic, workflow }: Partial<ParsedFlowDefinition>,
  includeExt?: boolean
): ParsedFlowDefinition => {
  topic = topic !== undefined ? topic + '/' : ''
  const fullPath = `${topic}${workflow}`
  return parseFlowName(fullPath, includeExt)
}

export const isSkillFlow = (flow: string | FlowView) => {
  if (typeof flow === 'string') {
    return !!(flow?.startsWith('skills/') || flow?.includes('/skills-'))
  } else {
    return !!flow.skillData
  }
}
