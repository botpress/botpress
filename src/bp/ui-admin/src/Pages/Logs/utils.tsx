import { Classes, InputGroup, MenuItem } from '@blueprintjs/core'
import { DateRange, IDateRangeShortcut } from '@blueprintjs/datetime'
import _ from 'lodash'
import moment from 'moment'
import React from 'react'
import { Filter } from 'react-table'

export const getDateShortcuts = (): IDateRangeShortcut[] => {
  return [
    {
      label: 'Last 15 minutes',
      dateRange: [
        moment()
          .subtract(15, 'm')
          .toDate(),
        new Date()
      ],
      includeTime: true
    },
    {
      label: 'Last 60 minutes',
      dateRange: [
        moment()
          .subtract(1, 'h')
          .toDate(),
        new Date()
      ],
      includeTime: true
    },
    {
      label: 'Last 4 hours',
      dateRange: [
        moment()
          .subtract(6, 'h')
          .toDate(),
        new Date()
      ],
      includeTime: true
    },
    {
      label: 'Last 24 hours',
      dateRange: [
        moment()
          .subtract(24, 'h')
          .toDate(),
        new Date()
      ],
      includeTime: true
    },
    {
      label: 'Today',
      dateRange: [
        moment()
          .startOf('day')
          .toDate(),
        new Date()
      ],
      includeTime: true
    },
    {
      label: 'Yesterday',
      dateRange: [
        moment()
          .startOf('day')
          .subtract(24, 'h')
          .toDate(),
        moment()
          .startOf('day')
          .toDate()
      ],
      includeTime: true
    },
    {
      label: 'This week',
      dateRange: [
        moment()
          .startOf('week')
          .toDate(),
        new Date()
      ],
      includeTime: true
    },
    {
      label: 'Last week',
      dateRange: [
        moment()
          .startOf('week')
          .subtract(7, 'd')
          .toDate(),
        moment()
          .startOf('week')
          .toDate()
      ],
      includeTime: true
    },
    {
      label: 'Last 30 days',
      dateRange: [
        moment()
          .subtract(30, 'd')
          .toDate(),
        new Date()
      ]
    }
  ]
}

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

export const getRangeLabel = (dateRange?: DateRange) => {
  if (!dateRange) {
    return
  }

  const from = moment(dateRange[0])
  const to = moment(dateRange[1])

  return `${from.format(DATE_FORMAT)} to ${to.format(DATE_FORMAT)} - ${to.from(from, true)}`
}

export const dropdownRenderer = (option, { modifiers, handleClick }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.label || option}
      onClick={handleClick}
      text={option.label || option}
    />
  )
}

export const filterText = ({ filter, onChange }): any => (
  <InputGroup value={filter ? filter.value : ''} onChange={event => onChange(event.target.value)} />
)

export const lowercaseFilter = (filter: Filter, row: any, column: any): boolean => {
  if (column.id === 'botId') {
    return row[filter.id] === filter.value
  }

  return (row[filter.id] || '').toLowerCase().includes(filter.value.toLowerCase())
}
