import { IDateRangeShortcut } from '@blueprintjs/datetime'
import { dates, IDates } from 'common/dates'

import { lang } from '../translations'

const {
  lastMonthEnd,
  lastMonthStart,
  lastWeekEnd,
  lastWeekStart,
  lastYearEnd,
  lastYearStart,
  now,
  thisMonth,
  thisWeek,
  thisYear
} = dates

export const createDateRangeShortcuts = (): IDateRangeShortcut[] => [
  {
    dateRange: [thisWeek, now],
    label: lang('timespan.thisWeek')
  },
  {
    dateRange: [lastWeekStart, lastWeekEnd],
    label: lang('timespan.lastWeek')
  },
  {
    dateRange: [thisMonth, now],
    label: lang('timespan.thisMonth')
  },
  {
    dateRange: [lastMonthStart, lastMonthEnd],
    label: lang('timespan.lastMonth')
  },
  {
    dateRange: [thisYear, now],
    label: lang('timespan.thisYear')
  },
  {
    dateRange: [lastYearStart, lastYearEnd],
    label: lang('timespan.lastYear')
  }
]

export const relativeDates = dates
