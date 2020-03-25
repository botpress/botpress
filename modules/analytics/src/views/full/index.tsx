import { Button, HTMLSelect, IconName, MaybeElement, Popover, Position, Tooltip as BpTooltip } from '@blueprintjs/core'
import { DateRange, DateRangeInput, DateRangePicker, IDateRangeShortcut, TimePrecision } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios from 'axios'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC, Fragment, useEffect, useState } from 'react'

import { MetricEntry } from '../../backend/typings'

import {
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
} from './dates'
import style from './style.scss'
import FlatProgressChart from './FlatProgressChart'
import ItemsList from './ItemsList'
import NumberMetric from './NumberMetric'
import RadialMetric from './RadialMetric'
import TimeSeriesChart from './TimeSeriesChart'

interface State {
  metrics: MetricEntry[]
  dateRange?: DateRange
  pageTitle: string
  selectedChannel: string
  shownSection: string
}

export interface Extras {
  icon?: IconName | MaybeElement
  iconBottom?: IconName | MaybeElement
  className?: string
}

const navigateToElement = (name: string, type: string) => () => {
  let url
  if (type === 'qna') {
    url = `/modules/qna?id=${name.replace('__qna__', '')}`
  } else if (type === 'workflow') {
    url = `/oneflow/${name}`
  }
  window.postMessage({ action: 'navigate-url', payload: url }, '*')
}
const isNDU = window['USE_ONEFLOW']

const fetchReducer = (state: State, action): State => {
  if (action.type === 'datesSuccess') {
    const { dateRange } = action.data

    return {
      ...state,
      dateRange
    }
  } else if (action.type === 'receivedMetrics') {
    const { metrics } = action.data

    return {
      ...state,
      metrics
    }
  } else if (action.type === 'channelSuccess') {
    const { selectedChannel } = action.data

    return {
      ...state,
      selectedChannel
    }
  } else if (action.type === 'sectionChange') {
    const { shownSection, pageTitle } = action.data

    return {
      ...state,
      shownSection,
      pageTitle
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const Analytics: FC<any> = ({ bp }) => {
  const [channels, setChannels] = useState(['All Channels', 'API'])

  const [state, dispatch] = React.useReducer(fetchReducer, {
    dateRange: undefined,
    metrics: [],
    pageTitle: 'Dashboard',
    selectedChannel: 'all',
    shownSection: 'dashboard'
  })

  useEffect(() => {
    void axios.get(`${window.origin + window['API_PATH']}/modules`).then(({ data }) => {
      const channels = data
        .map(x => x.name)
        .filter(x => x.startsWith('channel'))
        .map(x => x.replace('channel-', ''))

      setChannels(prevState => [...prevState, ...channels])
    })

    dispatch({ type: 'datesSuccess', data: { dateRange: [thisWeek, now] } })
  }, [])

  useEffect(() => {
    if (!state.dateRange?.[0] || !state.dateRange?.[1]) {
      return
    }

    // tslint:disable-next-line: no-floating-promises
    fetchAnalytics(state.selectedChannel, state.dateRange).then(metrics => {
      dispatch({ type: 'receivedMetrics', data: { dateRange: state.dateRange, metrics } })
    })
  }, [state.dateRange, state.selectedChannel])

  const fetchAnalytics = async (channel, dateRange): Promise<MetricEntry[]> => {
    const startDate = moment(dateRange[0]).unix()
    const endDate = moment(dateRange[1]).unix()

    const { data } = await bp.axios.get(`mod/analytics/channel/${channel}`, {
      params: {
        start: startDate,
        end: endDate
      }
    })
    return data.metrics
  }

  const handleChannelChange = async ({ target: { value: selectedChannel } }) => {
    dispatch({ type: 'channelSuccess', data: { selectedChannel } })
  }

  const handleDateChange = async (dateRange: DateRange) => {
    dispatch({ type: 'datesSuccess', data: { dateRange } })
  }

  const isLoaded = () => {
    return state.metrics && state.dateRange
  }

  const capitalize = str => str.substring(0, 1).toUpperCase() + str.substring(1)

  const getMetricCount = (metricName: string, subMetric?: string) => {
    const metrics = state.metrics.filter(m => m.metric === metricName && (!subMetric || m.subMetric === subMetric))
    return _.sumBy(metrics, 'value')
  }

  const getAvgMsgPerSessions = () => {
    const sentCount = state.metrics.reduce((acc, m) => (m.metric === 'msg_sent_count' ? acc + m.value : acc), 0)
    const receivedCount = state.metrics.reduce((acc, m) => (m.metric === 'msg_received_count' ? acc + m.value : acc), 0)

    return sentCount + receivedCount
  }

  const getMisunderStoodData = () => {
    const totalMisunderstood = getMetricCount('msg_nlu_intent', 'none')
    const totalMisunderstoodInside =
      ((totalMisunderstood - getMetricCount('sessions_start_nlu_none')) / totalMisunderstood) * 100
    const totalMisunderstoodOutside = (getMetricCount('sessions_start_nlu_none') / totalMisunderstood) * 100

    return {
      total: totalMisunderstood,
      inside: getNotNaN(totalMisunderstoodInside, '%'),
      outside: getNotNaN(totalMisunderstoodOutside, '%')
    }
  }

  const getReturningUsers = () => {
    const activeUsersCount = getMetricCount('active_users_count')
    const newUsersCount = getMetricCount('new_users_count')
    const percent = activeUsersCount && (newUsersCount / activeUsersCount) * 100

    return getNotNaN(percent, '%')
  }

  const getNewUsersPercent = () => {
    const existingUsersCount = getMetricCount('active_users_count')
    const newUsersCount = getMetricCount('new_users_count')
    const percent = newUsersCount && (existingUsersCount / newUsersCount) * 100

    return getNotNaN(percent, '%')
  }

  const getNotNaN = (value, suffix = '') => (Number.isNaN(value) ? 'N/A' : `${Math.round(value)}${suffix}`)

  const getMetric = metricName => state.metrics.filter(x => x.metric === metricName)

  const getTopItems = (metricName: string, type: string) => {
    const grouped = _.groupBy(getMetric(metricName), 'subMetric')
    const results = _.orderBy(
      Object.keys(grouped).map(x => ({ name: x, count: _.sumBy(grouped[x], 'value') })),
      x => x.count,
      'desc'
    )

    return results.map(x => ({
      label: `${x.name} (${x.count})`,
      href: '',
      onClick: navigateToElement(x.name, type)
    }))
  }

  const renderEngagement = () => {
    return (
      <div className={style.metricsContainer}>
        <NumberMetric name="Active Users" value={getMetricCount('active_users_count')} icon="user" />
        <NumberMetric
          name={`${getMetricCount('new_users_count')} New Users`}
          value={getNewUsersPercent()}
          icon="trending-down"
        />
        <NumberMetric
          name={`${getMetricCount('active_users_count')} Returning Users`}
          value={getReturningUsers()}
          icon="trending-up"
        />
        <TimeSeriesChart
          name="User Activities"
          data={getMetric('new_users_count')}
          className={style.fullGrid}
          channels={channels}
        />
      </div>
    )
  }

  const renderConversations = () => {
    return (
      <div className={style.metricsContainer}>
        <TimeSeriesChart
          name="Sessions"
          data={getMetric('sessions_count')}
          className={style.threeQuarterGrid}
          channels={channels}
        />
        <NumberMetric name="Message Exchanged" value={getAvgMsgPerSessions()} iconBottom="chat" />
        {isNDU && (
          <NumberMetric
            name="Workflows Initiated"
            value={getMetricCount('workflow_started_count')}
            className={style.half}
          />
        )}
        <NumberMetric name="Questions Asked" value={getMetricCount('msg_sent_qna_count')} className={style.half} />
        <ItemsList
          name="Most Used Workflows"
          items={getTopItems('enter_flow_count', 'workflow')}
          itemLimit={10}
          className={cx(style.genericMetric, style.half, style.list)}
        />
        <ItemsList
          name="Most Asked Questions"
          items={getTopItems('msg_sent_qna_count', 'qna')}
          itemLimit={10}
          hasTooltip
          className={cx(style.genericMetric, style.half, style.list)}
        />
      </div>
    )
  }

  const renderHandlingUnderstanding = () => {
    const { total, inside, outside } = getMisunderStoodData()

    return (
      <div className={cx(style.metricsContainer, style.fullWidth)}>
        <div className={cx(style.genericMetric, style.quarter)}>
          <div>
            <p className={style.numberMetricValue}>{total}</p>
            <h3 className={style.metricName}>misunderstood messages</h3>
          </div>
          <div>
            <FlatProgressChart value={inside} color="#DE4343" name={`${inside} inside flows`} />
            <FlatProgressChart value={outside} color="#F2B824" name={`${outside} outside flows`} />
          </div>
        </div>
        {isNDU && (
          <Fragment>
            <div className={cx(style.genericMetric, style.quarter, style.list, style.multiple)}>
              <ItemsList
                name="Most Failed Workflows"
                items={getTopItems('workflow_failed_count', 'workflow')}
                itemLimit={3}
                className={style.list}
              />
              <ItemsList
                name="Most Failed Questions"
                items={getTopItems('feedback_negative_qna', 'qna')}
                itemLimit={3}
                hasTooltip
                className={style.list}
              />
            </div>
            <RadialMetric
              name={`${getMetricCount('workflow_completed_count')} successful workflow completions`}
              value={getMetricCount('workflow_completed_count')}
              className={style.quarter}
            />
            <RadialMetric
              name={`${getMetricCount('feedback_positive_qna')} positive QNA feedback`}
              value={getMetricCount('feedback_positive_qna')}
              className={style.quarter}
            />
          </Fragment>
        )}
      </div>
    )
  }

  if (!isLoaded()) {
    return null
  }

  const shortcuts: IDateRangeShortcut[] = [
    {
      dateRange: [thisWeek, now],
      label: 'This Week'
    },
    {
      dateRange: [lastWeekStart, lastWeekEnd],
      label: 'Last Week'
    },
    {
      dateRange: [thisMonth, now],
      label: 'This Month'
    },
    {
      dateRange: [lastMonthStart, lastMonthEnd],
      label: 'Last Month'
    },
    {
      dateRange: [thisYear, now],
      label: 'This Year'
    },
    {
      dateRange: [lastYearStart, lastYearEnd],
      label: 'Last Year'
    }
  ]

  return (
    <div className={style.mainWrapper}>
      <div className={style.innerWrapper}>
        <div className={style.header}>
          <h1 className={style.pageTitle}>Analytics</h1>
          <div className={style.filters}>
            <BpTooltip content="Filter channels" position={Position.LEFT}>
              <HTMLSelect className={style.filterItem} onChange={handleChannelChange} value={state.selectedChannel}>
                {channels.map(channel => {
                  return (
                    <option key={channel} value={channel}>
                      {capitalize(channel)}
                    </option>
                  )
                })}
              </HTMLSelect>
            </BpTooltip>

            <Popover>
              <Button icon="calendar" className={style.filterItem}>
                Date Range
              </Button>
              <DateRangePicker
                onChange={handleDateChange}
                allowSingleDayRange={true}
                shortcuts={shortcuts}
                maxDate={new Date()}
                value={state.dateRange}
              />
            </Popover>
          </div>
        </div>
        <div className={style.sectionsWrapper}>
          <div className={cx(style.section, style.half)}>
            <h2>Engagement</h2>
            {renderEngagement()}
          </div>
          <div className={cx(style.section, style.half)}>
            <h2>Conversations</h2>
            {renderConversations()}
          </div>
          <div className={style.section}>
            <h2>Handling and Understanding</h2>
            {renderHandlingUnderstanding()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
