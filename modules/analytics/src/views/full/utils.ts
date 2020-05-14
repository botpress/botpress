import _ from 'lodash'
import moment from 'moment'

import { MetricEntry } from '../../backend/typings'

const enumerateDaysBetweenDates = (startDate: moment.Moment, endDate: moment.Moment) => {
  const dates = []
  while (startDate <= endDate) {
    dates.push(startDate.format('YYYY-MM-DD'))
    startDate = startDate.add(1, 'days')
  }
  return dates
}

export const fillMissingValues = (metrics: MetricEntry[], dateFrom: Date, dateTo: Date): Partial<MetricEntry>[] => {
  const channels = _.uniqBy(metrics, 'channel').map(x => x.channel)
  const dates = enumerateDaysBetweenDates(moment(dateFrom), moment(dateTo))

  return _.flatMap(channels, channel =>
    dates.map(date => metrics.find(x => x.date === date && x.channel === channel) ?? { date, channel, value: 0 })
  )
}

export const mergeDataForCharts = (metrics: MetricEntry[]) => {
  const dates = _.uniqBy(metrics, 'date').map(x => x.date)
  const channels = _.uniqBy(metrics, 'channel').map(x => x.channel)

  const chartsData = dates.map(date => ({
    time: moment(date)
      .startOf('day')
      .unix(),
    ...channels.reduce((acc, channel) => {
      acc[channel] = metrics.find(x => x.date === date && x.channel === channel)?.value
      return acc
    }, {})
  }))

  return _.sortBy(chartsData, 'time')
}
