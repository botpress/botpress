import _ from 'lodash'
import React, { FC, useContext, useState, useEffect } from 'react'

import { ApiType } from '../Api'
import { EscalationType } from './../../../types'

import { Context, EscalationsMapType } from '../app/Store'

import { Spinner } from '@blueprintjs/core'
import { EmptyState, Tabs, lang } from 'botpress/shared'
import CasesIcon from './../Icons/CasesIcon'
import EscalationListFilter, { SortType, FilterType } from './EscalationListFilter'
import EscalationItem from './EscalationItem'

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
    assignedOther: true
  })
  const [sortOption, setSortOption] = useState<SortType>('mostRecent')

  function filterBy(item: EscalationType): boolean {
    const conditions = {
      unassigned: item.agentId == null,
      assignedMe: item.agentId == state.currentAgent?.id,
      assignedOther: item.agentId !== null && item.agentId !== state.currentAgent?.id
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
    <div>
      <Tabs tabs={[{ id: 'escalations', title: lang.tr('module.hitl2.tab') }]} />

      {props.loading && <Spinner></Spinner>}

      {!props.loading && (
        <EscalationListFilter
          filterOptions={filterOptions}
          sortOption={sortOption}
          setFilterOptions={setFilterOptions}
          setSortOption={setSortOption}
          disabled={!items.length}
        ></EscalationListFilter>
      )}

      {!props.loading && !items.length && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitl2.escalations.empty')}></EmptyState>
      )}

      {items.length && (
        <ul>
          {items.map((escalation, i) => (
            <EscalationItem key={escalation.id} api={api} {...escalation}></EscalationItem>
          ))}
        </ul>
      )}
    </div>
  )
}

export default EscalationList
