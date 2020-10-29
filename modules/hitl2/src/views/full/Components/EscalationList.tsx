import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang, Tabs } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useContext, useEffect, useState } from 'react'

import { Context, EscalationsMapType } from '../app/Store'
import { ApiType } from '../Api'

import { EscalationType } from './../../../types'
import styles from './../style.scss'
import CasesIcon from './../Icons/CasesIcon'
import EscalationItem from './EscalationItem'
import EscalationListHeader, { FilterType, SortType } from './EscalationListHeader'

interface Props {
  api: ApiType
  escalations: EscalationsMapType
  loading: boolean
}

const EscalationList: FC<Props> = props => {
  const { api } = props

  const { state } = useContext(Context)

  const [items, setItems] = useState([])
  const [filterOptions, setFilterOptions] = useState<FilterType>({
    unassigned: true,
    assignedMe: true,
    assignedOther: true,
    resolved: false
  })
  const [sortOption, setSortOption] = useState<SortType>('mostRecent')

  function filterBy(item: EscalationType): boolean {
    const conditions = {
      unassigned: item.agentId == null,
      assignedMe: item.status == 'assigned' && item.agentId == state.currentAgent?.id,
      assignedOther: item.agentId !== null && item.agentId !== state.currentAgent?.id,
      resolved: item.status == 'resolved'
    }

    return _.some(_.pickBy(conditions), (value, key) => filterOptions[key])
  }

  function orderConditions() {
    switch (sortOption) {
      case 'mostRecent':
        return [['createdAt'], ['desc']]
      case 'leastRecent':
        return [['createdAt'], ['asc']]
      default:
        return
    }
  }

  useEffect(() => {
    setItems(
      _.chain(_.values(props.escalations))
        .filter(filterBy)
        .orderBy(...orderConditions())
        .value()
    )
  }, [filterOptions, sortOption, props.escalations])

  return (
    <div className={cx(styles.escalationList)}>
      <EscalationListHeader
        filterOptions={filterOptions}
        sortOption={sortOption}
        setFilterOptions={setFilterOptions}
        setSortOption={setSortOption}
        disabled={_.isEmpty(props.escalations)}
      ></EscalationListHeader>

      {props.loading && <Spinner></Spinner>}

      {!props.loading && !items.length && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitl2.escalations.empty')}></EmptyState>
      )}

      {!!items.length &&
        items.map((escalation, i) => (
          <EscalationItem key={escalation.id} api={api} escalation={escalation}></EscalationItem>
        ))}
    </div>
  )
}

export default EscalationList
