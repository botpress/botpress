import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import cx from 'classnames'
import _, { Dictionary } from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { EscalationType } from '../../../../types'
import styles from '../../style.scss'
import CasesIcon from '../../Icons/CasesIcon'

import EscalationItem from './EscalationItem'

interface Props {
  escalations: Dictionary<EscalationType>
  loading: boolean
  itemCount?: number
}

const EscalationList: FC<Props> = props => {
  const [items, setItems] = useState<EscalationType[]>([])

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
        _.values(items).map(escalation => <EscalationItem key={escalation.id} {...escalation}></EscalationItem>)}
    </div>
  )
}

EscalationList.defaultProps = {
  itemCount: 5
}

export default EscalationList
