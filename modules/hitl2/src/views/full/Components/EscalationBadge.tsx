import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'

import sharedStyle from '../../../../../../src/bp/ui-shared-lite/style.scss'

import { AgentType } from './../../../types'

interface Props {
  status: string
  assignedToAgent: Partial<AgentType>
  currentAgent?: AgentType
}

const EscalationBadge: FC<Props> = props => {
  switch (props.status) {
    case 'assigned':
      if (props.assignedToAgent?.id === props.currentAgent?.id) {
        return (
          <div className={cx(sharedStyle.badge, sharedStyle.ocean)}>
            {lang.tr('module.hitl2.escalation.assignment.me')}
          </div>
        )
      } else {
        return (
          <div className={cx(sharedStyle.badge, sharedStyle.white)}>
            {lang.tr('module.hitl2.escalation.assignment.other', { name: props.assignedToAgent?.fullName })}
          </div>
        )
      }
    default:
      return (
        <div className={cx(sharedStyle.badge, sharedStyle.warning)}>
          {lang.tr(`module.hitl2.escalation.status.${props.status}`)}
        </div>
      )
  }
}

export default EscalationBadge
