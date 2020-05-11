import {
  Button,
  ButtonGroup,
  HTMLSelect,
  IconName,
  MaybeElement,
  Popover,
  Position,
  Tooltip as BpTooltip
} from '@blueprintjs/core'
import { DateRange, DateRangePicker, IDateRangeShortcut } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import axios from 'axios'
import { lang } from 'botpress/shared'
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
  previousRangeMetrics: MetricEntry[]
  previousDateRange?: DateRange
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
  } else if (action.type === 'receivedPreviousRangeMetrics') {
    const { metrics, dateRange } = action.data

    return {
      ...state,
      previousDateRange: dateRange,
      previousRangeMetrics: metrics
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
  const [channels, setChannels] = useState([
    lang.tr('module.analytics.channels.all'),
    lang.tr('module.analytics.channels.api')
  ])

  const [state, dispatch] = React.useReducer(fetchReducer, {
    dateRange: undefined,
    previousDateRange: undefined,
    metrics: [],
    previousRangeMetrics: [],
    pageTitle: lang.tr('module.analytics.dashboard'),
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

    /* Get the previous range data so we can compare them and see what changed */
    const startDate = moment(state.dateRange[0])
    const endDate = moment(state.dateRange[1])
    const oldEndDate = moment(state.dateRange[0]).subtract(1, 'days')
    const previousRange = [startDate.subtract(endDate.diff(startDate, 'days') + 1, 'days'), oldEndDate]

    // tslint:disable-next-line: no-floating-promises
    fetchAnalytics(state.selectedChannel, previousRange).then(metrics => {
      dispatch({ type: 'receivedPreviousRangeMetrics', data: { dateRange: previousRange, metrics } })
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

  const getPreviousRangeMetricCount = (metricName: string, subMetric?: string) => {
    const previousRangeMetrics = state.previousRangeMetrics.filter(
      m => m.metric === metricName && (!subMetric || m.subMetric === subMetric)
    )
    return _.sumBy(previousRangeMetrics, 'value')
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
    const percent = Math.round((activeUsersCount / (newUsersCount + activeUsersCount)) * 100)

    return getNotNaN(percent, '%')
  }

  const getNewUsersPercent = () => {
    const existingUsersCount = getMetricCount('active_users_count')
    const newUsersCount = getMetricCount('new_users_count')
    const percent = Math.round((newUsersCount / (existingUsersCount + newUsersCount)) * 100)

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
    const newUserCountDiff = getMetricCount('new_users_count') - getPreviousRangeMetricCount('new_users_count')
    const activeUserCountDiff = getMetricCount('active_users_count') - getPreviousRangeMetricCount('active_users_count')

    return (
      <div className={style.metricsContainer}>
        <NumberMetric
          diffFromPreviousRange={newUserCountDiff}
          previousDateRange={state.previousDateRange}
          name={lang.tr('module.analytics.newUsers', { nb: getMetricCount('new_users_count') })}
          value={getNewUsersPercent()}
        />
        <NumberMetric
          diffFromPreviousRange={activeUserCountDiff}
          previousDateRange={state.previousDateRange}
          name={lang.tr('module.analytics.returningUsers', { nb: getMetricCount('active_users_count') })}
          value={getReturningUsers()}
        />
        <TimeSeriesChart
          name={lang.tr('module.analytics.userActivities')}
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
        <NumberMetric
          name={lang.tr('module.analytics.messageExchanged')}
          value={getAvgMsgPerSessions()}
          iconBottom="chat"
        />
        {isNDU && (
          <NumberMetric
            name={lang.tr('module.analytics.workflowsInitiated')}
            value={getMetricCount('workflow_started_count')}
            className={style.half}
          />
        )}
        <NumberMetric
          name={lang.tr('module.analytics.questionsAsked')}
          value={getMetricCount('msg_sent_qna_count')}
          className={style.half}
        />
        <ItemsList
          name={lang.tr('module.analytics.mostUsedWorkflows')}
          items={getTopItems('workflow_started_count', 'workflow')}
          itemLimit={10}
          className={cx(style.genericMetric, style.half, style.list)}
        />
        <ItemsList
          name={lang.tr('module.analytics.mostAskedQuestions')}
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
            <h3 className={style.metricName}>{lang.tr('module.analytics.misunderstoodMessages')}</h3>
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
                name={lang.tr('module.analytics.mostFailedWorkflows')}
                items={getTopItems('workflow_failed_count', 'workflow')}
                itemLimit={3}
                className={style.list}
              />
              <ItemsList
                name={lang.tr('module.analytics.mostFailedQuestions')}
                items={getTopItems('feedback_negative_qna', 'qna')}
                itemLimit={3}
                hasTooltip
                className={style.list}
              />
            </div>
            <RadialMetric
              name={lang.tr('module.analytics.successfulWorkflowCompletions', {
                nb: getMetricCount('workflow_completed_count')
              })}
              value={Math.round(
                (getMetricCount('workflow_completed_count') / getMetricCount('workflow_started_count')) * 100
              )}
              className={style.quarter}
            />
            <RadialMetric
              name={lang.tr('module.analytics.positiveQnaFeedback', { nb: getMetricCount('feedback_positive_qna') })}
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
      label: lang.tr('module.analytics.timespan.thisWeek')
    },
    {
      dateRange: [lastWeekStart, lastWeekEnd],
      label: lang.tr('module.analytics.timespan.lastWeek')
    },
    {
      dateRange: [thisMonth, now],
      label: lang.tr('module.analytics.timespan.thisMonth')
    },
    {
      dateRange: [lastMonthStart, lastMonthEnd],
      label: lang.tr('module.analytics.timespan.lastMonth')
    },
    {
      dateRange: [thisYear, now],
      label: lang.tr('module.analytics.timespan.thisYear')
    },
    {
      dateRange: [lastYearStart, lastYearEnd],
      label: lang.tr('module.analytics.timespan.lastYear')
    }
  ]

  const exportCsv = async () => {
    const data = [
      `"date","botId","channel","metric","subMetric","value"`,
      ...state.metrics.map(entry => {
        return [entry.date, entry.botId, entry.channel, entry.metric, entry.subMetric, entry.value]
          .map(x => (x || 'N/A').toString().replace(/"/g, '\\"'))
          .map(x => `"${x}"`)
          .join(',')
      })
    ].join('\r\n')

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([data]))
    link.download = `analytics.csv`
    link.click()
  }
  const exportJson = () => {
    const { dateRange, metrics, previousDateRange, previousRangeMetrics } = state
    const formatDate = date => moment(date).format('YYYY-MM-DD')

    const json = [
      {
        startDate: formatDate(dateRange?.[0]),
        endDate: formatDate(dateRange?.[1]),
        metrics
      },
      {
        startDate: formatDate(previousDateRange?.[0]),
        endDate: formatDate(previousDateRange?.[1]),
        metrics: previousRangeMetrics
      }
    ]

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(json, undefined, 2)]))
    link.download = `analytics.json`
    link.click()
  }

  return (
    <div className={style.mainWrapper}>
      <div className={style.innerWrapper}>
        <div className={style.header}>
          <h1 className={style.pageTitle}>{lang.tr('module.analytics.title')}</h1>
          <div className={style.filters}>
            <BpTooltip content={lang.tr('module.analytics.filterChannels')} position={Position.LEFT}>
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
                {lang.tr('module.analytics.dateRange')}
              </Button>
              <DateRangePicker
                onChange={handleDateChange}
                allowSingleDayRange={true}
                shortcuts={shortcuts}
                maxDate={new Date()}
                value={state.dateRange}
              />
            </Popover>

            <Popover
              content={
                <div style={{ padding: 5 }}>
                  <ButtonGroup>
                    <Button onClick={exportCsv} text={lang.tr('module.analytics.exportCsv')}></Button>
                    <Button onClick={exportJson} text={lang.tr('module.analytics.exportJson')}></Button>
                  </ButtonGroup>
                </div>
              }
              position={Position.BOTTOM}
            >
              <Button className={style.exportButton} icon="export" text={lang.tr('module.analytics.export')}></Button>
            </Popover>
          </div>
        </div>
        <div className={style.sectionsWrapper}>
          <div className={cx(style.section, style.half)}>
            <h2>{lang.tr('module.analytics.engagement')}</h2>
            {renderEngagement()}
          </div>
          <div className={cx(style.section, style.half)}>
            <h2>{lang.tr('module.analytics.conversations')}</h2>
            {renderConversations()}
          </div>
          <div className={style.section}>
            <h2>{lang.tr('module.analytics.handlingAndUnderstanding')}</h2>
            {renderHandlingUnderstanding()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
