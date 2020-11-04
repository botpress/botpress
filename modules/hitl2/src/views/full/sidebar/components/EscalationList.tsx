import { EmptyState, lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import _, { Dictionary } from 'lodash'

import CasesIcon from './../../Icons/CasesIcon'
import EscalationItem from './EscalationItem'
import { EscalationType } from '../../../../types'
import { Spinner } from '@blueprintjs/core'
import cx from 'classnames'
import styles from './../../style.scss'

interface Props {
  escalations: Dictionary<EscalationType>
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
