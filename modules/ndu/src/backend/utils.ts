import sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

export const getTriggerId = (trigger: sdk.NDU.Trigger) => {
  switch (trigger.type) {
    case 'workflow':
      return `wf/${trigger.workflowId}/${trigger.nodeId}`
    case 'faq':
      return `faq/${trigger.topicName}/${trigger.faqId}`
    case 'contextual':
      return `contextual/${trigger.workflowId}/${trigger.nodeId}/${trigger.name}`
    case 'node':
      return `node/${trigger.workflowId}/${trigger.nodeId}${trigger.name ? `/${trigger.name}` : ''}`
    default:
      return `invalid_trigger/${_.random(10 ^ 9, false)}`
  }
}

export const stringToVec = (choices: string[], value: string) => {
  const arr = Array(choices.length).fill(0)
  const idx = choices.indexOf(value)
  if (idx >= 0) {
    arr[idx] = 1
  }
  return arr
}

export const WfIdToTopic = (wfId: string): string | undefined => {
  if (wfId === 'n/a' || wfId.startsWith('skills/')) {
    return
  }

  return wfId.split('/')[0]
}

export function computeModelHash(data: any): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify({ data }))
    .digest('hex')
}
