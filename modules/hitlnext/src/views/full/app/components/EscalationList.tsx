import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { Context } from '../Store'

import { IHandoff } from './../../../../types'
import CasesIcon from './../../Icons/CasesIcon'
import EscalationItem from './EscalationItem'
import EscalationListHeader, { FilterType, SortType } from './EscalationListHeader'

interface Props {
  handoffs: object
  loading: boolean
}

const HandoffList: FC<Props> = props => {
  const { state, dispatch } = useContext(Context)

  const [items, setItems] = useState<IHandoff[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterType>({
    unassigned: true,
    assignedMe: true,
    assignedOther: true,
    resolved: false
  })
  const [sortOption, setSortOption] = useState<SortType>('mostRecent')

  function filterBy(item: IHandoff): boolean {
    const conditions = {
      unassigned: item.agentId == null,
      assignedMe: item.status === 'assigned' && item.agentId === state.currentAgent?.agentId,
      assignedOther: item.agentId !== null && item.agentId !== state.currentAgent?.agentId,
      resolved: item.status === 'resolved'
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
    const filtered = _.chain(_.values(props.handoffs))
      .filter(filterBy)
      .orderBy(...orderConditions())
      .value()

    // Unselect current handoff when excluded from list
    if (!_.includes(_.map(filtered, 'id'), state.currentHandoff?.id)) {
      dispatch({ type: 'setCurrentHandoff', payload: null })
    }

    setItems(filtered)
  }, [filterOptions, sortOption, props.handoffs, props.loading])

  return (
    <Fragment>
      <EscalationListHeader
        filterOptions={filterOptions}
        sortOption={sortOption}
        setFilterOptions={setFilterOptions}
        setSortOption={setSortOption}
        disabled={_.isEmpty(props.handoffs)}
      ></EscalationListHeader>

      {props.loading && <Spinner></Spinner>}

      {!props.loading && _.isEmpty(items) && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitlnext.handoffs.empty')}></EmptyState>
      )}

      {!props.loading &&
        !_.isEmpty(items) &&
        items.map(handoff => <EscalationItem key={handoff.id} {...handoff}></EscalationItem>)}
    </Fragment>
  )
}

export default HandoffList
