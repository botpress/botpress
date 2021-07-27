import moment from 'moment'

export interface IDates {
  now: Date
  thisWeek: Date
  lastWeekStart: Date
  lastWeekEnd: Date
  thisMonth: Date
  lastMonthStart: Date
  lastMonthEnd: Date
  thisYear: Date
  lastYearStart: Date
  lastYearEnd: Date
  last7days: Date
}

export const dates: IDates = {
  now: new Date(),
  thisWeek: moment()
    .startOf('week')
    .toDate(),
  lastWeekStart: moment()
    .subtract(1, 'weeks')
    .startOf('week')
    .toDate(),
  lastWeekEnd: moment()
    .subtract(1, 'weeks')
    .endOf('week')
    .toDate(),
  thisMonth: moment()
    .startOf('month')
    .toDate(),
  lastMonthStart: moment()
    .subtract(1, 'months')
    .startOf('month')
    .toDate(),
  lastMonthEnd: moment()
    .subtract(1, 'months')
    .endOf('month')
    .toDate(),
  thisYear: moment()
    .startOf('year')
    .toDate(),
  lastYearStart: moment()
    .subtract(1, 'years')
    .startOf('year')
    .toDate(),
  lastYearEnd: moment()
    .subtract(1, 'years')
    .endOf('year')
    .toDate(),
  last7days: moment()
    .subtract(7, 'days')
    .toDate()
}
