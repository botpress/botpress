import { FLAGGED_MESSAGE_STATUS } from '../../types'

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
  auto_hook: {
    title: 'Flagged by hook',
    icon: 'build'
  },
  action: {
    title: 'Flagged by action',
    icon: 'code'
  }
}
