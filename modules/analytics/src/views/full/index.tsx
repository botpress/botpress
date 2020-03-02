import { Button, Card, HTMLSelect } from '@blueprintjs/core'
import { DateRange, DateRangeInput } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios from 'axios'
import { style as sharedStyle } from 'botpress/shared'
import { Container, ItemList, SidePanel } from 'botpress/ui'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC, useEffect, useReducer, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import style from './style.scss'

const {
  TooltipStyle: { botpressTooltip }
} = sharedStyle
const COLOR_SLACK = '#4A154B'
const COLOR_MESSENGER = '#0196FF'
const COLOR_WEB = '#FFA83A'
const COLOR_TELEGRAM = '#2EA6DA'
const SECONDS_PER_DAY = 86400
const sideList = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'agentUsage', label: 'Agent Usage' },
  { key: 'engagement', label: 'Engagement & Retention' },
  { key: 'understanding', label: 'Understanding' }
]

const fetchReducer = (state, action) => {
  if (action.type === 'datesSuccess') {
    const { startDate, endDate, metrics } = action.data
    return {
      ...state,
      startDate,
      endDate,
      metrics
    }
  } else if (action.type === 'channelSuccess') {
    const { selectedChannel, metrics } = action.data
    return {
      ...state,
      selectedChannel,
      metrics
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
  const [channels, setChannels] = useState(['all'])
  const [showFilters, setShowFilters] = useState(false)

  const [state, dispatch] = React.useReducer(fetchReducer, {
    endDate: undefined,
    metrics: [],
    pageTitle: 'Dashboard',
    selectedChannel: 'all',
    shownSection: 'dashboard',
    startDate: undefined
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
      .unix()
    const endDate = moment()
      .startOf('day')
      .unix()

    fetchAnalytics(state.selectedChannel, startDate, endDate).then(({ data: { metrics } }) => {
      dispatch({ type: 'datesSuccess', data: { startDate, endDate, metrics } })
    })
  }, [])

  const fetchAnalytics = (channel, startDate, endDate) => {
    return bp.axios.get(`mod/analytics/channel/${channel}`, {
      params: {
        start: startDate,
        end: endDate
      }
    })
  }

  const handleChannelChange = async ({ target: { value: selectedChannel } }) => {
    const {
      data: { metrics }
    } = await fetchAnalytics(selectedChannel, state.startDate, state.endDate)
    dispatch({ type: 'channelSuccess', data: { metrics, selectedChannel } })
  }

  const handleDateChange = async (dateRange: DateRange) => {
    const startDate = moment(dateRange[0]).unix()
    const endDate = moment(dateRange[1]).unix()

    const {
      data: { metrics }
    } = await fetchAnalytics(state.selectedChannel, startDate, endDate)
    dispatch({ type: 'datesSuccess', data: { startDate, endDate, metrics } })
  }

  const isLoaded = () => {
    return state.metrics && state.startDate && state.endDate
  }

  const capitalize = str => str.substring(0, 1).toUpperCase() + str.substring(1)

  const renderDateInput = () => {
    const startDate = moment.unix(state.startDate).toDate()
    const endDate = moment.unix(state.endDate).toDate()
    return (
      <div className={style.filtersInputWrapper}>
        <span className={style.inputLabel}>Date Range</span>
        <DateRangeInput
          closeOnSelection={true}
          formatDate={date => moment(date).format('MM-DD-YYYY')}
          maxDate={new Date()}
          parseDate={str => new Date(str)}
          onChange={handleDateChange}
          value={[startDate, endDate]}
        />
      </div>
    )
  }

  const getMetricCount = metricName =>
    state.metrics.filter(m => m.metric === metricName).reduce((acc, cur) => acc + cur.value, 0)

  const getAvgMsgPerSessions = () => {
    const augmentedMetrics = state.metrics.map(m => ({
      ...m,
      day: moment(m.created_on).format('DD-MM')
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
        created_on: s.created_on
      }
    })
  }

  const getUnderstoodPercent = () => {
    const received = getMetricCount('msg_received_count')
    const none = getMetricCount('msg_nlu_none')
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

  const renderDashboard = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Average Messages Per Session', getAvgMsgPerSessions())}
        {renderTimeSeriesChart('Active Users', getMetric('active_users_count'))}
        {renderTimeSeriesChart('New Users', getMetric('new_users_count'))}
        {renderNumberMetric('Positive QNA Feedback', getMetricCount('feedback_positive_qna'), true)}
        {renderNumberMetric('Understood Messages', getUnderstoodPercent())}
      </div>
    )
  }

  const renderAgentUsage = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Sessions', getMetric('sessions_count'))}
        {renderTimeSeriesChart('Messages Received', getMetric('msg_received_count'))}
        {renderTimeSeriesChart('Goals Started', getMetric('goals_started_count'))}
        {renderTimeSeriesChart('Goals Completed', getMetric('goals_completed_count'))}
        {renderTimeSeriesChart('QNA Sent', getMetric('msg_sent_qna_count'))}
      </div>
    )
  }

  const renderEngagement = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Average Messages Per Session', getAvgMsgPerSessions())}
        {renderTimeSeriesChart('Active Users', getMetric('active_users_count'))}
        {renderTimeSeriesChart('New Users', getMetric('new_users_count'))}
        {renderNumberMetric('Returning Users', getReturningUsers())}
      </div>
    )
  }

  const renderUnderstanding = () => {
    const goalsOutcome = getMetricCount('goals_completed_count') / getMetricCount('goals_started_count') || 0

    return (
      <div className={style.metricsContainer}>
        {renderNumberMetric('Positive Goals Outcome', goalsOutcome + '%')}
        {renderNumberMetric('Positive QNA Feedback', getMetricCount('feedback_positive_qna'), true)}
        {renderNumberMetric('Understood Messages', getUnderstoodPercent())}
        {renderNumberMetric('Understood Top-Level Messages', getTopLevelUnderstoodPercent())}
      </div>
    )
  }

  const renderNumberMetric = (name, value, isPercentage = false) => {
    return (
      <div className={cx(style.metricWrapper, style.number)}>
        <h4 className={cx(style.metricName, botpressTooltip)} data-tooltip={name}>
          <span>{name}</span>
        </h4>
        <Card className={style.numberMetric}>
          <h2
            className={cx(style.numberMetricValue, {
              [botpressTooltip]: isPercentage && value.toString().length > 6
            })}
            data-tooltip={value}
          >
            <span>{value}</span>
          </h2>
        </Card>
      </div>
    )
  }

  const mapDataForCharts = (data: any[]) => {
    const chartsData = data.map(metric => ({
      time: moment(metric.created_on)
        .startOf('day')
        .unix(),
      [metric.channel]: metric.value
    }))

    return _.sortBy(chartsData, 'time')
  }

  const formatTick = timestamp => moment.unix(timestamp).format('DD-MM')

  const renderTimeSeriesChart = (name: string, data) => {
    const tickCount = (state.endDate - state.startDate) / SECONDS_PER_DAY

    return (
      <div className={cx(style.metricWrapper, { [style.empty]: !data.length })}>
        <h4 className={cx(style.metricName, botpressTooltip)} data-tooltip={name}>
          <span>{name}</span>
        </h4>
        <div className={cx(style.chartMetric, { [style.empty]: !data.length })}>
          {!data.length && <p className={style.emptyState}>No data available</p>}
          {!!data.length && (
            <ResponsiveContainer>
              <AreaChart data={mapDataForCharts(data)}>
                <Tooltip labelFormatter={formatTick} />
                <XAxis height={18} dataKey="time" tickFormatter={formatTick} tickCount={tickCount} />
                <YAxis width={30} />
                <Area stackId={1} type="monotone" dataKey="web" stroke={COLOR_WEB} fill={COLOR_WEB} />
                <Area stackId={2} type="monotone" dataKey="messenger" stroke={COLOR_MESSENGER} fill={COLOR_MESSENGER} />
                <Area stackId={3} type="monotone" dataKey="slack" stroke={COLOR_SLACK} fill={COLOR_SLACK} />
                <Area stackId={4} type="monotone" dataKey="telegram" stroke={COLOR_TELEGRAM} fill={COLOR_TELEGRAM} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    )
  }

  const mapSideListToListItem = ({ key, label }) => {
    return {
      key,
      label,
      value: key,
      selected: key === state.shownSection
    }
  }

  const onSideItemClick = item => {
    dispatch({ type: 'sectionChange', data: { shownSection: item.key, pageTitle: item.label } })
  }

  if (!isLoaded()) {
    return null
  }

  const startDate = moment(moment.unix(state.startDate).toDate()).format('MMMM Do YYYY')
  const endDate = moment(moment.unix(state.endDate).toDate()).format('MMMM Do YYYY')

  return (
    <Container>
      <SidePanel>
        <ItemList items={sideList.map(mapSideListToListItem)} onElementClicked={onSideItemClick} />
      </SidePanel>
      <div className={style.mainWrapper}>
        <div className={style.header}>
          <h1 className={style.pageTitle}>{state.pageTitle}</h1>
          <Button onClick={() => setShowFilters(!showFilters)} icon="filter" className={style.filtersButton}>
            Filters
          </Button>
        </div>
        {showFilters && (
          <div className={style.filtersWrapper}>
            <label className={style.filtersInputWrapper}>
              <span className={style.inputLabel}>Channel</span>
              <HTMLSelect onChange={handleChannelChange} value={state.selectedChannel}>
                {channels.map(channel => {
                  return (
                    <option key={channel} value={channel}>
                      {capitalize(channel)}
                    </option>
                  )
                })}
              </HTMLSelect>
            </label>
            {renderDateInput()}
          </div>
        )}
        <h2 className={cx(style.appliedFilters, { [style.filtersShowing]: showFilters })}>
          {capitalize(state.selectedChannel)} - {startDate} to {endDate}
        </h2>
        {state.shownSection === 'dashboard' && renderDashboard()}
        {state.shownSection === 'agentUsage' && renderAgentUsage()}
        {state.shownSection === 'engagement' && renderEngagement()}
        {state.shownSection === 'understanding' && renderUnderstanding()}
      </div>
    </Container>
  )
}

export default Analytics
