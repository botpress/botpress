import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { Context } from '../Store'

import { EscalationType } from './../../../../types'
import CasesIcon from './../../Icons/CasesIcon'
import EscalationItem from './EscalationItem'
import EscalationListHeader, { FilterType, SortType } from './EscalationListHeader'

interface Props {
  escalations: object
  loading: boolean
}

const EscalationList: FC<Props> = props => {
  const { state, dispatch } = useContext(Context)

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
    const filtered = _.chain(_.values(props.escalations))
      .filter(filterBy)
      .orderBy(...orderConditions())
      .value()

    // Unselect current escalation when excluded from list
    if (!_.includes(_.map(filtered, 'id'), state.currentEscalation?.id)) {
      dispatch({ type: 'setCurrentEscalation', payload: null })
    }

    setItems(filtered)
  }, [filterOptions, sortOption, props.escalations])

  return (
    <Fragment>
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

      {!!items.length && items.map(escalation => <EscalationItem key={escalation.id} {...escalation}></EscalationItem>)}
    </Fragment>
  )
}

export default EscalationList
