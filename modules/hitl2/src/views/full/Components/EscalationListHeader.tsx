import { Checkbox } from '@blueprintjs/core'
import { lang, MainLayout, ToolbarButtonProps } from 'botpress/shared'
import React, { FC } from 'react'

import style from '../style.scss'

export interface FilterType {
  unassigned: boolean
  assignedMe: boolean
  assignedOther: boolean
  resolved: boolean
}

export type SortType = 'mostRecent' | 'leastRecent'

interface Props {
  filterOptions: FilterType
  sortOption: SortType
  setFilterOptions: (value) => void
  setSortOption: (value) => void
  disabled: boolean
}

const EscalationListHeader: FC<Props> = props => {
  const buttons: ToolbarButtonProps[] = [
    {
      icon: 'sort',
      optionsItems: [
        {
          label: lang.tr('module.hitl2.sort.mostRecentlyCreated'),
          selected: props.sortOption === 'mostRecent',
          action: () => {
            props.setSortOption('mostRecent')
          }
        },
        {
          label: lang.tr('module.hitl2.sort.leastRecentlyCreated'),
          selected: props.sortOption === 'leastRecent',
          action: () => {
            props.setSortOption('leastRecent')
          }
        }
      ],
      tooltip: lang.tr('module.hitl2.sortBy'),
      disabled: props.disabled
    },
    {
      icon: 'filter',
      optionsItems: [
        {
          content: (
            <Checkbox
              checked={props.filterOptions.unassigned}
              label={lang.tr('module.hitl2.filter.unassigned')}
              onChange={() =>
                props.setFilterOptions({ ...props.filterOptions, unassigned: !props.filterOptions.unassigned })
              }
            />
          )
        },
        {
          content: (
            <Checkbox
              checked={props.filterOptions.assignedMe}
              label={lang.tr('module.hitl2.filter.assignedMe')}
              onChange={() =>
                props.setFilterOptions({ ...props.filterOptions, assignedMe: !props.filterOptions.assignedMe })
              }
            />
          )
        },
        {
          content: (
            <Checkbox
              checked={props.filterOptions.assignedOther}
              label={lang.tr('module.hitl2.filter.assignedOther')}
              onChange={() =>
                props.setFilterOptions({ ...props.filterOptions, assignedOther: !props.filterOptions.assignedOther })
              }
            />
          )
        },
        {
          content: (
            <Checkbox
              checked={props.filterOptions.resolved}
              label={lang.tr('module.hitl2.filter.resolved')}
              onChange={() =>
                props.setFilterOptions({ ...props.filterOptions, resolved: !props.filterOptions.resolved })
              }
            />
          )
        }
      ],
      tooltip: lang.tr('module.hitl2.filterBy'),
      disabled: props.disabled
    }
  ]

  return (
    <MainLayout.Toolbar
      className={style.escalationListHeader}
      tabs={[{ id: 'escalations', title: lang.tr('module.hitl2.sidebar.tab') }]}
      buttons={buttons}
    ></MainLayout.Toolbar>
  )
}

export default EscalationListHeader
