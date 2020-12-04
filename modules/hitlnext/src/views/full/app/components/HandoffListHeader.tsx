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

const HandoffListHeader: FC<Props> = ({ filterOptions, sortOption, setFilterOptions, setSortOption, disabled }) => {
  const buttons: ToolbarButtonProps[] = [
    {
      icon: 'sort',
      optionsItems: [
        {
          label: lang.tr('module.hitlnext.sort.mostRecentlyCreated'),
          selected: sortOption === 'mostRecent',
          action: () => {
            setSortOption('mostRecent')
          }
        },
        {
          label: lang.tr('module.hitlnext.sort.leastRecentlyCreated'),
          selected: sortOption === 'leastRecent',
          action: () => {
            setSortOption('leastRecent')
          }
        }
      ],
      tooltip: lang.tr('module.hitlnext.sortBy'),
      disabled
    },
    {
      icon: 'filter',
      optionsItems: [
        {
          content: (
            <Checkbox
              checked={filterOptions.unassigned}
              label={lang.tr('module.hitlnext.filter.unassigned')}
              onChange={() => setFilterOptions({ ...filterOptions, unassigned: !filterOptions.unassigned })}
            />
          )
        },
        {
          content: (
            <Checkbox
              checked={filterOptions.assignedMe}
              label={lang.tr('module.hitlnext.filter.assignedMe')}
              onChange={() => setFilterOptions({ ...filterOptions, assignedMe: !filterOptions.assignedMe })}
            />
          )
        },
        {
          content: (
            <Checkbox
              checked={filterOptions.assignedOther}
              label={lang.tr('module.hitlnext.filter.assignedOther')}
              onChange={() => setFilterOptions({ ...filterOptions, assignedOther: !filterOptions.assignedOther })}
            />
          )
        },
        {
          content: (
            <Checkbox
              checked={filterOptions.resolved}
              label={lang.tr('module.hitlnext.filter.resolved')}
              onChange={() => setFilterOptions({ ...filterOptions, resolved: !filterOptions.resolved })}
            />
          )
        }
      ],
      tooltip: lang.tr('module.hitlnext.filterBy'),
      disabled
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
