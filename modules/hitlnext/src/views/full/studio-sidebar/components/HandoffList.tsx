import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import cx from 'classnames'
import _, { Dictionary } from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { IHandoff } from '../../../../types'
import CasesIcon from '../../Icons/CasesIcon'
import styles from '../../style.scss'

import HandoffItem from './HandoffItem'

interface Props {
  handoffs: Dictionary<IHandoff>
  loading: boolean
  itemCount?: number
}

const HandoffList: FC<Props> = ({ handoffs, loading, itemCount }) => {
  const [items, setItems] = useState<IHandoff[]>([])

  useEffect(() => {
    setItems(_.slice(_.orderBy(_.values(handoffs), 'createdAt', 'desc'), 0, itemCount))
  }, [handoffs])

  return (
    <div className={cx(styles.handoffList)}>
      {loading && <Spinner></Spinner>}

      {!loading && _.isEmpty(items) && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitlnext.sidebar.handoffs.empty')}></EmptyState>
      )}

      {!_.isEmpty(items) && _.values(items).map(handoff => <HandoffItem key={handoff.id} {...handoff}></HandoffItem>)}
    </div>
  )
}

HandoffList.defaultProps = {
  itemCount: 5
}

export default HandoffList
