import { Checkbox } from '@blueprintjs/core'
import { lang, MainLayout, ToolbarButtonProps } from 'botpress/shared'
import React, { FC } from 'react'

import style from '../../style.scss'

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

const HandoffListHeader: FC<Props> = props => {
  const buttons: ToolbarButtonProps[] = [
    {
      icon: 'sort',
      optionsItems: [
        {
          label: lang.tr('module.hitlnext.sort.mostRecentlyCreated'),
          selected: props.sortOption === 'mostRecent',
          action: () => {
            props.setSortOption('mostRecent')
          }
        },
        {
          label: lang.tr('module.hitlnext.sort.leastRecentlyCreated'),
          selected: props.sortOption === 'leastRecent',
          action: () => {
            props.setSortOption('leastRecent')
          }
        }
      ],
      tooltip: lang.tr('module.hitlnext.sortBy'),
      disabled: props.disabled
    },
    {
      icon: 'filter',
      optionsItems: [
        {
          content: (
            <Checkbox
              checked={props.filterOptions.unassigned}
              label={lang.tr('module.hitlnext.filter.unassigned')}
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
              label={lang.tr('module.hitlnext.filter.assignedMe')}
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
              label={lang.tr('module.hitlnext.filter.assignedOther')}
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
              label={lang.tr('module.hitlnext.filter.resolved')}
              onChange={() =>
                props.setFilterOptions({ ...props.filterOptions, resolved: !props.filterOptions.resolved })
              }
            />
          )
        }
      ],
      tooltip: lang.tr('module.hitlnext.filterBy'),
      disabled: props.disabled
    }
  ]

  return (
    <MainLayout.Toolbar
      className={style.hitlToolBar}
      tabs={[{ id: 'handoffs', title: lang.tr('module.hitlnext.sidebar.tab') }]}
      buttons={buttons}
    ></MainLayout.Toolbar>
  )
}

export default HandoffListHeader
