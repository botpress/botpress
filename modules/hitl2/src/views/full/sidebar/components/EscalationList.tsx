import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import cx from 'classnames'

import { EscalationType } from '../../../../types'
import { EscalationsMapType } from '../../sidebar/Store'

import { Spinner } from '@blueprintjs/core'
import CasesIcon from './../../Icons/CasesIcon'
import { EmptyState, lang } from 'botpress/shared'
import EscalationItem from './EscalationItem'

import styles from './../../style.scss'

interface Props {
  escalations: EscalationsMapType
  loading: boolean
  itemCount?: number
}

const EscalationList: FC<Props> = props => {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(_.slice(_.orderBy(_.values(props.escalations), 'createdAt', 'desc'), 0, props.itemCount))
  }, [props.escalations])

  return (
    <div className={cx(styles.escalationList)}>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && _.isEmpty(items) && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitl2.sidebar.escalations.empty')}></EmptyState>
      )}

      {!_.isEmpty(items) &&
        _.values(items).map((escalation: EscalationType) => (
          <EscalationItem key={escalation.id} {...escalation}></EscalationItem>
        ))}
    </div>
  )
}

EscalationList.defaultProps = {
  itemCount: 5
}

export default EscalationList
