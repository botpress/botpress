import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useEffect, useState } from 'react'

import { IHandoff } from '../../../../types'
import CasesIcon from '../../Icons/CasesIcon'
import { Context } from '../Store'

import HandoffItem from './HandoffItem'
import HandoffListHeader, { FilterType, SortType } from './HandoffListHeader'

import style from '../../style.scss'
interface Props {
  handoffs: object
  loading: boolean
}

const HandoffList: FC<Props> = ({ handoffs, loading }) => {
  const { state, dispatch } = useContext(Context)

  const [items, setItems] = useState<IHandoff[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterType>({
    unassigned: true,
    assignedMe: true,
    assignedOther: false,
    resolved: false
  })
  const [sortOption, setSortOption] = useState<SortType>('mostRecent')

  function filterBy(item: IHandoff): boolean {
    const conditions = {
      unassigned: item.agentId == null,
      assignedMe: item.status === 'assigned' && item.agentId === state.currentAgent?.agentId,
      assignedOther: item.status === 'assigned' && item.agentId !== state.currentAgent?.agentId,
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
    const filtered = _.chain(_.values(handoffs))
      .filter(filterBy)
      .orderBy(...orderConditions())
      .value()

    // Unselect current handoff when excluded from list
    if (!_.includes(_.map(filtered, 'id'), state.selectedHandoffId)) {
      dispatch({ type: 'setSelectedHandoffId', payload: null })
    }

    setItems(filtered)
  }, [filterOptions, sortOption, handoffs, loading])

  const displayHandoffList = () => {
    return (
      <div className={style.handoffList}>
        {items.map(handoff => (
          <HandoffItem key={handoff.id} {...handoff}></HandoffItem>
        ))}
      </div>
    )
  }

  return (
    <Fragment>
      <HandoffListHeader
        filterOptions={filterOptions}
        sortOption={sortOption}
        setFilterOptions={setFilterOptions}
        setSortOption={setSortOption}
        disabled={_.isEmpty(handoffs)}
      ></HandoffListHeader>

      {loading && <Spinner></Spinner>}

      {!loading && _.isEmpty(items) && (
        <EmptyState icon={<CasesIcon />} text={lang.tr('module.hitlnext.handoffs.empty')}></EmptyState>
      )}

      {!loading && !_.isEmpty(items) && displayHandoffList()}
    </Fragment>
  )
}

export default HandoffList
