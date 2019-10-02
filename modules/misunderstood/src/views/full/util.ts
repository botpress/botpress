import { FLAGGED_MESSAGE_STATUS, RESOLUTION_TYPE, FLAG_REASON } from '../../types'

export const STATUSES = [
  {
    key: FLAGGED_MESSAGE_STATUS.new,
    label: 'New'
  },
  {
    key: FLAGGED_MESSAGE_STATUS.pending,
    label: 'Pending'
  },
  {
    key: FLAGGED_MESSAGE_STATUS.applied,
    label: 'Done'
  },
  {
    key: FLAGGED_MESSAGE_STATUS.deleted,
    label: 'Ignored'
  }
]

export const REASONS = {
  [FLAG_REASON.auto_hook]: {
    title: 'Flagged by hook',
    icon: 'build'
  },
  [FLAG_REASON.action]: {
    title: 'Flagged by action',
    icon: 'code'
  }
}

export const RESOLUTION = {
  [RESOLUTION_TYPE.qna]: 'QnA',
  [RESOLUTION_TYPE.intent]: 'Intent'
}
