import _ from 'lodash'
import React, { FC } from 'react'

import { EscalationType } from '../../../../types'
import { EscalationsMapType } from '../../Store'

import { Spinner } from '@blueprintjs/core'
import CasesIcon from './../../Icons/CasesIcon'
import { EmptyState, lang } from 'botpress/shared'
import EscalationItem from './EscalationItem'

interface Props {
  escalations: EscalationsMapType
  loading: boolean
}

const EscalationList: FC<Props> = props => {
  return (
    <div>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && _.isEmpty(props.escalations) && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitl2.sidebar.escalations.empty')}></EmptyState>
      )}

      {!_.isEmpty(props.escalations) && (
        <ul>
          {_.values(props.escalations).map((escalation: EscalationType) => (
            <EscalationItem key={escalation.id} {...escalation}></EscalationItem>
          ))}
        </ul>
      )}
    </div>
  )
}

export default EscalationList
