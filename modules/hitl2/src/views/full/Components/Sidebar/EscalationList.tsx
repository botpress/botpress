import _ from 'lodash'
import React, { FC } from 'react'

import { EscalationType } from '../../../../types'
import { EscalationsMapType } from '../../Store'

import { Spinner } from '@blueprintjs/core'
import EscalationItem from './EscalationItem'

interface Props {
  escalations: EscalationsMapType
  loading: boolean
}

const EscalationList: FC<Props> = props => {
  return (
    <div>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && (
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
