import { Button, Card, HTMLSelect, Popover, Position, Tooltip as BpTooltip } from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios from 'axios'
import { Container, ItemList, SidePanel } from 'botpress/ui'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC, useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { MetricEntry } from '../../backend/typings'

import style from './style.scss'

const SECONDS_PER_DAY = 86400

const CHANNEL_COLORS = {
  web: '#FFA83A',
  messenger: '#0196FF',
  slack: '#4A154B',
  telegram: '#2EA6DA'
}

interface State {
  metrics: MetricEntry[]
  dateRange?: DateRange
  pageTitle: string
  selectedChannel: string
  shownSection: string
}

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

    const startDate = moment()
      .subtract(7, 'days')
      .startOf('day')
      .toDate()
    const endDate = moment()
      .startOf('day')
      .toDate()

    dispatch({ type: 'datesSuccess', data: { dateRange: [startDate, endDate] } })
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
    const augmentedMetrics = state.metrics.map(m => ({
      ...m,
      day: moment(m.date).format('DD-MM')
    }))
    const metricsByDate = _.sortBy(augmentedMetrics, 'day')
    const sessionsCountPerDay = metricsByDate.filter(m => m.metric === 'sessions_count')

    return sessionsCountPerDay.map(s => {
      const sentCount = augmentedMetrics.find(
        m => m.metric === 'msg_sent_count' && s.day === m.day && s.channel === m.channel
      )
      const receivedCount = augmentedMetrics.find(
        m => m.metric === 'msg_received_count' && s.day === m.day && s.channel === m.channel
      )
      return {
        value: Math.round((_.get(sentCount, 'value', 0) + _.get(receivedCount, 'value', 0)) / s.value),
        channel: s.channel,
        date: s.date
      }
    })
  }

  const getUnderstoodPercent = () => {
    const received = getMetricCount('msg_received_count')
    const none = getMetricCount('msg_nlu_intent', 'none')
    const percent = ((received - none) / received) * 100
    return getNotNaN(percent, '%')
  }

  const getTopLevelUnderstoodPercent = () => {
    const received = getMetricCount('msg_received_count')
    const none = getMetricCount('top_msg_nlu_none')
    const percent = ((received - none) / received) * 100
    return getNotNaN(percent, '%')
  }

  const getReturningUsers = () => {
    const activeUsersCount = getMetricCount('active_users_count')
    const newUsersCount = getMetricCount('new_users_count')
    const percent = activeUsersCount && (newUsersCount / activeUsersCount) * 100
    return getNotNaN(percent, '%')
  }

  const getNotNaN = (value, suffix = '') => (Number.isNaN(value) ? 'N/A' : `${value.toFixed(2)}${suffix}`)

  const getMetric = metricName => state.metrics.filter(x => x.metric === metricName)

  const renderEngagement = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Active Users', getMetric('active_users_count'))}
        {renderTimeSeriesChart('New Users', getMetric('new_users_count'))}
        {renderNumberMetric('Returning Users', getReturningUsers())}
        {renderTimeSeriesChart('User Activities', getMetric('new_users_count'))}
        <div>
          <h3>Busiest Period</h3>
          <p>Monday fromn 2PM to 4PM</p>
        </div>
      </div>
    )
  }

  const renderConversations = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Sessions', getMetric('sessions_count'))}
        <BpTooltip content="Session Length" position={Position.TOP}>
          {renderTimeSeriesChart('Message Exchanged', getAvgMsgPerSessions())}
        </BpTooltip>
        {renderTimeSeriesChart('Goals Initiated', getMetric('goals_started_count'))}
        {renderTimeSeriesChart('Questions Asked', getMetric('msg_sent_qna_count'))}
        <div>
          <h3>Most Used Workflows</h3>
          <ul>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Most Asked Questions</h3>
          <ul>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  const renderHandlingUnderstanding = () => {
    return (
      <div className={style.metricsContainer}>
        {renderNumberMetric('Understood Messages', getUnderstoodPercent())}
        {renderNumberMetric('Understood Top-Level Messages', getTopLevelUnderstoodPercent())}
        <div>
          <h3>Most Failed Workflows</h3>
          <ul>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Most Failed Questions</h3>
          <ul>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
          </ul>
        </div>
        {renderNumberMetric('Positive QNA Feedback', getMetricCount('feedback_positive_qna'), true)}
      </div>
    )
  }

  const renderDashboard = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Active Users', getMetric('active_users_count'))}
        {renderTimeSeriesChart('New Users', getMetric('new_users_count'))}
        {renderTimeSeriesChart('Sessions', getMetric('sessions_count'))}
        {renderTimeSeriesChart('Average Messages Per Session', getAvgMsgPerSessions())}
        {renderTimeSeriesChart('Messages Received', getMetric('msg_received_count'))}
        {renderNumberMetric('Returning Users', getReturningUsers())}
        {renderTimeSeriesChart('QNA Sent', getMetric('msg_sent_qna_count'))}
        {renderNumberMetric('Understood Messages', getUnderstoodPercent())}
        {renderNumberMetric('Understood Top-Level Messages', getTopLevelUnderstoodPercent())}
      </div>
    )
  }

  const renderNumberMetric = (name: string, value: number | string, isPercentage?: boolean) => {
    return (
      <div className={cx(style.metricWrapper, style.number)}>
        <h3 className={style.metricName}>
          <span>{name}</span>
        </h3>
        <Card className={style.numberMetric}>
          <h2 className={style.numberMetricValue}>
            <span>{value}</span>
          </h2>
        </Card>
      </div>
    )
  }

  const mapDataForCharts = (data: MetricEntry[]) => {
    const chartsData = data.map(metric => ({
      time: moment(metric.date)
        .startOf('day')
        .unix(),
      [metric.channel]: metric.value
    }))

    return _.sortBy(chartsData, 'time')
  }

  const formatTick = timestamp => moment.unix(timestamp).format('DD-MM')

  const getTickCount = () => {
    const startDate = moment(state.dateRange[0]).unix()
    const endDate = moment(state.dateRange[1]).unix()
    return (startDate - endDate) / SECONDS_PER_DAY
  }

  const renderTimeSeriesChart = (name: string, data: MetricEntry[] | any, desc?: string) => {
    const tickCount = getTickCount()

    return (
      <div className={cx(style.metricWrapper, { [style.empty]: !data.length })}>
        <h3 className={style.metricName}>
          <span>{name}</span>
        </h3>
        <div className={cx(style.chartMetric, { [style.empty]: !data.length })}>
          {!data.length && <p className={style.emptyState}>No data available</p>}
          {!!data.length && (
            <ResponsiveContainer>
              <AreaChart data={mapDataForCharts(data)}>
                <Tooltip labelFormatter={formatTick} />
                <XAxis height={18} dataKey="time" tickFormatter={formatTick} tickCount={tickCount} />
                <YAxis width={30} />
                {channels
                  .filter(x => x !== 'all')
                  .map((channel, idx) => (
                    <Area
                      key={idx}
                      stackId={idx}
                      type="monotone"
                      dataKey={channel}
                      stroke={CHANNEL_COLORS[channel]}
                      fill={CHANNEL_COLORS[channel]}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    )
  }

  if (!isLoaded()) {
    return null
  }

  return (
    <div className={style.mainWrapper}>
      <div className={style.innerWrapper}>
        <div className={style.header}>
          <h1 className={style.pageTitle}>Analytics</h1>
          <div>
            <BpTooltip content="Filter channels" position={Position.LEFT}>
              <div style={{ marginRight: 5 }}>
                <HTMLSelect onChange={handleChannelChange} value={state.selectedChannel}>
                  {channels.map(channel => {
                    return (
                      <option key={channel} value={channel}>
                        {capitalize(channel)}
                      </option>
                    )
                  })}
                </HTMLSelect>
              </div>
            </BpTooltip>

            <Popover>
              <Button icon="calendar">Date Range</Button>
              <DateRangePicker onChange={handleDateChange} maxDate={new Date()} value={state.dateRange} />
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
