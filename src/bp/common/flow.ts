import _ from 'lodash'

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

export const nextFlowName = (flows: { name: string }[], topic: string, originalName: string): string => {
  let name: string = ''
  let fullName: string = ''
  let index = 0
  do {
    name = `${originalName}${index ? `-${index}` : ''}`
    fullName = buildFlowName({ topic, workflow: name }, true).workflowPath || ''
    index++
  } while (flows.find(f => f.name === fullName))

  return fullName
}

export const nextTopicName = (topics: { name: string }[], originalName: string) => {
  let name = originalName
  let index = 0

  do {
    name = `${originalName}${index ? `-${index}` : ''}`
    index++
  } while (topics.find(t => t.name === name))

  return name
}

export const sortTriggersByScore = triggers => {
  const result = Object.keys(triggers).map(id => {
    const trigger = triggers[id]
    const values = Object.values<number>(trigger.result)
    const score = values.slice(1).reduce((total, curr) => total * curr, values[0])

    return { id, result: trigger.result, score: isNaN(score) ? -1 : score, trigger: trigger.trigger }
  })

  return _.orderBy(result, 'score', 'desc')
}
