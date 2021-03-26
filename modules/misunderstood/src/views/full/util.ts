import { lang } from 'botpress/shared'

import { FLAGGED_MESSAGE_STATUS, FLAG_REASON, RESOLUTION_TYPE } from '../../types'

export const STATUSES = [
  {
    key: FLAGGED_MESSAGE_STATUS.new,
    label: lang.tr('module.misunderstood.new')
  },
  {
    key: FLAGGED_MESSAGE_STATUS.pending,
    label: lang.tr('module.misunderstood.pending')
  },
  {
    key: FLAGGED_MESSAGE_STATUS.applied,
    label: lang.tr('module.misunderstood.done')
  },
  {
    key: FLAGGED_MESSAGE_STATUS.deleted,
    label: lang.tr('module.misunderstood.ignored')
  }
]

export const REASONS = {
  [FLAG_REASON.auto_hook]: {
    title: lang.tr('module.misunderstood.flaggedByHook'),
    icon: 'build'
  },
  [FLAG_REASON.action]: {
    title: lang.tr('module.misunderstood.flaggedByAction'),
    icon: 'code'
  },
  [FLAG_REASON.thumbs_down]: {
    title: lang.tr('module.misunderstood.flaggedByThumbsDown'),
    icon: 'thumbs-down'
  }
}

export const RESOLUTION = {
  [RESOLUTION_TYPE.qna]: lang.tr('module.misunderstood.qna'),
  [RESOLUTION_TYPE.intent]: lang.tr('module.misunderstood.intent')
}
