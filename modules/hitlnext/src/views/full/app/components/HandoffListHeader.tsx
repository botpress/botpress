import { Checkbox } from '@blueprintjs/core'
import { lang, MainLayout, ToolbarButtonProps } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../../style.scss'

export interface FilterType {
  unassigned: boolean
  assignedMe: boolean
  assignedOther: boolean
  resolved: boolean
  rejected: boolean
  expired: boolean
  tags: string[]
}

export type SortType = 'mostRecent' | 'leastRecent'

interface Props {
  filterOptions: FilterType
  tags: string[]
  sortOption: SortType
  setFilterOptions: (value: FilterType) => void
  setSortOption: (value: SortType) => void
  disabled: boolean
}

const HandoffListHeader: FC<Props> = ({
  filterOptions,
  tags,
  sortOption,
  setFilterOptions,
  setSortOption,
  disabled
}) => {
  const defaultFilterOptions: ToolbarButtonProps['optionsItems'] = [
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
    },
    {
      content: (
        <Checkbox
          checked={filterOptions.rejected}
          label={lang.tr('module.hitlnext.filter.rejected')}
          onChange={() => setFilterOptions({ ...filterOptions, rejected: !filterOptions.rejected })}
        />
      )
    },
    {
      content: (
        <Checkbox
          checked={filterOptions.expired}
          label={lang.tr('module.hitlnext.filter.expired')}
          onChange={() => setFilterOptions({ ...filterOptions, expired: !filterOptions.expired })}
        />
      )
    }
  ]

  const renderOptions = (tags: string[]): ToolbarButtonProps['optionsItems'] => {
    if (tags && tags.length) {
      const tagOptions: ToolbarButtonProps['optionsItems'] = tags.map(tag => {
        return {
          content: (
            <Checkbox
              checked={filterOptions.tags.includes(tag)}
              label={tag}
              onChange={() =>
                setFilterOptions({
                  ...filterOptions,
                  tags:
                    filterOptions.tags && filterOptions.tags.includes(tag)
                      ? _.pull(filterOptions.tags, tag)
                      : [...filterOptions.tags, tag]
                })
              }
            />
          )
        }
      })
      return defaultFilterOptions.concat(tagOptions)
    } else {
      return defaultFilterOptions
    }
  }

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
      optionsItems: renderOptions(tags),
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
