import React, { FC } from 'react'
import { Checkbox } from '@blueprintjs/core'
import { MainContent, HeaderButtonProps, lang } from 'botpress/shared'

export interface FilterType {
  unassigned: boolean
  assignedMe: boolean
  assignedOther: boolean
}

export type SortType = 'mostRecent' | 'leastRecent' | 'unread' | 'read'

interface Props {
  filterOptions: FilterType
  sortOption: SortType
  setFilterOptions: (value) => void
  setSortOption: (value) => void
}

const EscalationListFilter: FC<Props> = props => {
  const buttons: HeaderButtonProps[] = [
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
        },
        {
          label: lang.tr('module.hitl2.sort.unread'),
          selected: props.sortOption === 'unread',
          action: () => {
            props.setSortOption('unread')
          }
        },
        {
          label: lang.tr('module.hitl2.sort.read'),
          selected: props.sortOption === 'read',
          action: () => {
            props.setSortOption('read')
          }
        }
      ],
      tooltip: lang.tr('module.hitl2.sortBy')
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
        }
      ],
      tooltip: lang.tr('module.hitl2.filterBy')
    }
  ]

  return <MainContent.Header buttons={buttons}></MainContent.Header>
}

export default EscalationListFilter
