import {
  Button,
  Card,
  HTMLSelect,
  Icon,
  IconName,
  MaybeElement,
  Popover,
  Position,
  Tooltip as BpTooltip
} from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios from 'axios'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Text,
  Tooltip,
  XAxis
} from 'recharts'

import { MetricEntry } from '../../backend/typings'

import { fakeMetrics } from './metrics'
import style from './style.scss'

const CHANNEL_COLORS = {
  web: '#1F8FFA',
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

interface Extras {
  icon?: IconName | MaybeElement
  iconBottom?: IconName | MaybeElement
  className?: string
}

const fetchReducer = (state: State, action): State => {
  if (action.type === 'datesSuccess') {
    const { dateRange } = action.data

    return {
      ...state,
      dateRange
    }
  } else if (action.type === 'receivedMetrics') {
    // const { metrics } = action.data

    return {
      ...state,
      metrics: fakeMetrics
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
    const sentCount = state.metrics.reduce((acc, m) => (m.metric === 'msg_sent_count' ? acc + m.value : acc), 0)
    const receivedCount = state.metrics.reduce((acc, m) => (m.metric === 'msg_received_count' ? acc + m.value : acc), 0)

    return sentCount + receivedCount
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

  const getNewUsersPercent = () => {
    const existingUsersCount = 150 // TODO get this number from database
    const newUsersCount = getMetricCount('new_users_count')
    const percent = newUsersCount && (existingUsersCount / newUsersCount) * 100

    return getNotNaN(percent, '%')
  }

  const getNotNaN = (value, suffix = '') => (Number.isNaN(value) ? 'N/A' : `${Math.round(value)}${suffix}`)

  const getMetric = metricName => state.metrics.filter(x => x.metric === metricName)

  const renderEngagement = () => {
    return (
      <div className={style.metricsContainer}>
        {renderNumberMetric('Active Users', getMetricCount('active_users_count'), { icon: 'user' })}
        {renderNumberMetric(`${getMetricCount('new_users_count')} New Users`, getNewUsersPercent(), {
          icon: 'trending-down'
        })}
        {renderNumberMetric(`${getMetricCount('active_users_count')} Returning Users`, getReturningUsers(), {
          icon: 'trending-up'
        })}
        {renderTimeSeriesChart('User Activities', getMetric('new_users_count'), { className: style.fullGrid })}
        <Card className={cx(style.genericMetric, style.inline)}>
          <h3 className={style.metricName}>Busiest Period</h3>
          <p>Monday fromn 2PM to 4PM</p>
        </Card>
      </div>
    )
  }

  const renderConversations = () => {
    return (
      <div className={style.metricsContainer}>
        {renderTimeSeriesChart('Sessions', getMetric('sessions_count'), { className: style.threeQuarterGrid })}
        {renderNumberMetric('Message Exchanged', getAvgMsgPerSessions(), { iconBottom: 'chat' })}
        {renderNumberMetric('Goals Initiated', getMetricCount('goals_started_count'), { className: style.half })}
        {renderNumberMetric('Questions Asked', getMetricCount('msg_sent_qna_count'), { className: style.half })}
        <div className={cx(style.genericMetric, style.half, style.list)}>
          <h3 className={style.metricName}>Most Used Workflows</h3>
          {/* Max 10 items */}
          <ol>
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
          </ol>
        </div>
        <div className={cx(style.genericMetric, style.half, style.list)}>
          <h3 className={style.metricName}>Most Asked Questions</h3>
          {/* Max 10 items */}
          <ol>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
            <li>
              <BpTooltip content="What do you get when you put something where it shouldn't be">
                <a href="#">What do you get when you put something where it shouldn't be</a>
              </BpTooltip>
            </li>
          </ol>
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
          {/* Max 3 items */}
          <ol>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
            <li>
              <a href="#">Academics</a>
            </li>
          </ol>
        </div>
        <div>
          <h3>Most Failed Questions</h3>
          {/* Max 3 items */}
          <ol>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
            <li>
              <a href="#">What do you get when you put something where it shouldn't be</a>
            </li>
          </ol>
        </div>
        {renderRadialMetric('Positive QNA Feedback', getMetricCount('feedback_positive_qna'))}
      </div>
    )
  }

  const renderRadialMetric = (name: string, value: number | string, { icon, iconBottom, className }: Extras = {}) => {
    const data = [{ name: 'L1', value: 100 }]

    const circleSize = 130

    return (
      <Card className={cx(style.genericMetric, className, { [style.wIcon]: icon || iconBottom })}>
        <RadialBarChart
          width={circleSize}
          height={circleSize}
          innerRadius={circleSize / 2 - 4}
          outerRadius={circleSize / 2}
          barSize={4}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background clockWise dataKey="value" cornerRadius={circleSize / 2} fill="#0F9960" />
          <text
            x={circleSize / 2}
            y={circleSize / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="progress-label"
          >
            Test
          </text>
        </RadialBarChart>
      </Card>
    )
  }

  const renderNumberMetric = (name: string, value: number | string, { icon, iconBottom, className }: Extras = {}) => {
    return (
      <Card className={cx(style.genericMetric, className, { [style.wIcon]: icon || iconBottom })}>
        {icon && <Icon color="#5C7080" iconSize={20} icon={icon} />}
        <div>
          <p className={style.numberMetricValue}>{value}</p>
          <h3 className={style.metricName}>{name}</h3>
        </div>
        {iconBottom && <Icon color="#5C7080" iconSize={20} icon={iconBottom} />}
      </Card>
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

  const formatTick = timestamp =>
    moment
      .unix(timestamp)
      .format('ddd')
      .substr(0, 1)
  const formatTootilTick = timestamp => moment.unix(timestamp).format('dddd, MMMM Do YYYY')

  const renderTimeSeriesChart = (name: string, data: MetricEntry[] | any, { className }: Extras = {}) => {
    return (
      <div className={cx(style.metricWrapper, { [style.empty]: !data.length }, className)}>
        <div className={cx(style.chartMetric, { [style.empty]: !data.length })}>
          <h3 className={style.metricName}>
            <span>{name}</span>
          </h3>
          {!data.length && <p className={style.emptyState}>No data available</p>}
          {!!data.length && (
            <ResponsiveContainer height={160}>
              <AreaChart data={mapDataForCharts(data)}>
                <defs>
                  <linearGradient id="gradientBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1F90FA" stopOpacity={0.31} />
                    <stop offset="45%" stopColor="#1F90FA" stopOpacity={0.34} />
                    <stop offset="73%" stopColor="#1F90FA" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1F90FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip labelFormatter={formatTootilTick} />
                <XAxis
                  tickMargin={10}
                  height={28}
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatTick}
                  tickCount={data.length}
                />
                {channels
                  .filter(x => x !== 'all')
                  .map((channel, idx) => (
                    <Area
                      key={idx}
                      type="monotone"
                      dataKey={channel}
                      strokeWidth={3}
                      stroke={CHANNEL_COLORS[channel]}
                      fill="url(#gradientBg)"
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
