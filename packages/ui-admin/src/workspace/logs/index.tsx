import { Button, Checkbox, Popover } from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import * as sdk from 'botpress/sdk'
import { Dropdown, lang, Option, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import queryString from 'query-string'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import ReactTable, { Column } from 'react-table'

import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'
import { fetchBots } from '~/workspace/bots/reducer'

import style from './style.scss'
import { filterText, getDateShortcuts, getRangeLabel, lowercaseFilter } from './utils'

type Props = ConnectedProps<typeof connector>

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const Logs: FC<Props> = props => {
  const LEVELS: Option[] = [
    { label: lang.tr('admin.logs.level.all'), value: '' },
    { label: lang.tr('admin.logs.level.info'), value: 'info' },
    { label: lang.tr('admin.logs.level.warning'), value: 'warn' },
    { label: lang.tr('admin.logs.level.error'), value: 'error' },
    { label: lang.tr('admin.logs.level.critical'), value: 'critical' }
  ]

  const EVERYTHING: Option[] = [{ label: lang.tr('admin.logs.level.everything'), value: '' }]

  const [data, setData] = useState<sdk.LoggerEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<Option>(LEVELS[0])
  const [botFilter, setBotFilter] = useState<Option>(EVERYTHING[0])
  const [hostFilter, setHostFilter] = useState<Option>(EVERYTHING[0])
  const [dateRange, setDateRange] = useState<DateRange>()
  const [filters, setFilters] = useState<any>()
  const [hostNames, setHostNames] = useState<string[]>([])

  const [onlyWorkspace, setOnlyWorkspace] = useState(!props.profile || !props.profile.isSuperAdmin)
  const [botIds, setBotIds] = useState<string[]>([])

  useEffect(() => {
    if (!props.bots) {
      props.fetchBots()
    }

    if (!dateRange) {
      setDateRange(getDateShortcuts()[1].dateRange)
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchLogs()
  }, [dateRange, onlyWorkspace, props.currentWorkspace])

  useEffect(() => {
    const params = queryString.parse(window.location.search)
    if (params.botId) {
      setBotFilter({ label: params.botId, value: params.botId })
      setFilters([{ id: 'botId', value: params.botId }])
    } else {
      setBotFilter(EVERYTHING[0])
      setFilters([])
    }
  }, [botIds, props.bots])

  const updateBotIdUrl = (botId: string) => {
    const url = new URL(window.location.href)
    if (botId) {
      url.searchParams.set('botId', botId)
    } else {
      url.searchParams.delete('botId')
    }
    window.history.pushState(window.history.state, '', url.toString())
  }

  const fetchLogs = async (isRefreshing?: boolean) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return
    }

    try {
      const args = `fromDate=${dateRange[0].getTime()}&toDate=${dateRange[1].getTime()}&onlyWorkspace=${onlyWorkspace}`
      const logs = (await api.getSecured().get(`/admin/workspace/logs?${args}`)).data

      setData(logs)
      setBotIds(_.uniq(logs.map(x => x.botId).filter(Boolean)))
      setHostNames(_.uniq(logs.map(x => x.hostname).filter(Boolean)))

      if (isRefreshing) {
        toast.success(lang.tr('admin.logs.refreshed'))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filterHostname = ({ onChange }): any => {
    if (!hostNames) {
      return null
    }

    const items = [...EVERYTHING, ...hostNames.map(id => ({ label: id, value: id }))]

    return (
      <Dropdown
        items={items}
        defaultItem={hostFilter}
        onChange={option => {
          setHostFilter(option)
          onChange(option.value)
        }}
      />
    )
  }

  const filterBot = ({ onChange }) => {
    if (!props.bots) {
      return null
    }

    const items = [...EVERYTHING, ...botIds.map(id => ({ label: id, value: id }))]

    return (
      <Dropdown
        items={items}
        defaultItem={botFilter}
        onChange={option => {
          setBotFilter(option)
          onChange(option.value)
          updateBotIdUrl(option.value)
        }}
      />
    )
  }

  const filterLevel = ({ onChange }) => {
    return (
      <Dropdown
        items={LEVELS}
        defaultItem={levelFilter}
        onChange={option => {
          setLevelFilter(option)
          onChange(option.value)
        }}
      />
    )
  }

  const getColumns = () => {
    const columns: Column[] = [
      {
        Header: lang.tr('admin.logs.column.date'),
        filterable: false,
        Cell: ({ original: { timestamp } }) => moment(timestamp).format(DATE_FORMAT),
        accessor: 'timestamp',
        width: 130
      }
    ]

    if (hostNames && hostNames.length > 1) {
      columns.push({
        Header: lang.tr('admin.logs.column.hostname'),
        Filter: filterHostname,
        accessor: 'hostname',
        width: 130
      })
    }

    return [
      ...columns,
      {
        Header: lang.tr('admin.logs.column.botId'),
        Filter: filterBot,
        accessor: 'botId',
        width: 150
      },
      {
        Header: lang.tr('admin.logs.column.level'),
        Cell: ({ original: { level } }) => {
          switch (level) {
            case 'info':
              return <span className={style.logInfo}>{lang.tr('admin.logs.level.info')}</span>
            case 'warn':
              return <span className={style.logWarn}>{lang.tr('admin.logs.level.warning')}</span>
            case 'error':
              return <span className={style.logError}>{lang.tr('admin.logs.level.error')}</span>
            case 'critical':
              return <span className={style.logCritical}>{lang.tr('admin.logs.level.critical')}</span>
          }
        },
        Filter: filterLevel,
        accessor: 'level',
        width: 110,
        className: 'center'
      },
      {
        Header: lang.tr('admin.logs.column.scope'),
        Filter: filterText,
        accessor: 'scope',
        width: 100
      },
      {
        Header: lang.tr('admin.logs.column.message'),
        Filter: filterText,
        Cell: ({ original: { message } }) => (
          <span dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;') }}></span>
        ),
        style: { whiteSpace: 'unset' },
        accessor: 'message'
      }
    ]
  }

  const renderRowHeader = () => {
    const rows = (data && data.length) || 0

    return (
      <small>
        {rows} rows ({getRangeLabel(dateRange)}){' '}
        {rows === 2000 && <span className={style.logError}>{lang.tr('admin.logs.rowLimitReached')}</span>}
      </small>
    )
  }

  return (
    <PageContainer title={<span>Logs </span>} fullWidth={true}>
      <div className={style.toolbar}>
        <div className={style.left}>{renderRowHeader()}</div>
        <div className={style.right}>
          <Popover>
            <Button text={lang.tr('admin.logs.dateTimeRange')} icon="calendar" small />

            <DateRangePicker
              allowSingleDayRange
              value={dateRange}
              shortcuts={getDateShortcuts()}
              timePrecision="second"
              onChange={range => setDateRange(range)}
              maxDate={new Date()}
            />
          </Popover>
          <Checkbox
            checked={onlyWorkspace}
            onChange={e => setOnlyWorkspace(e.currentTarget.checked)}
            disabled={!props.profile || !props.profile.isSuperAdmin}
            label={lang.tr('admin.logs.onlyBotsFromThisWorkspace')}
            style={{ marginLeft: 10 }}
          />
        </div>
      </div>

      <ReactTable
        columns={getColumns()}
        data={data}
        defaultFilterMethod={lowercaseFilter}
        defaultPageSize={20}
        filtered={filters}
        onFilteredChange={filtered => setFilters(filtered)}
        filterable
        defaultSorted={[{ id: 'timestamp', desc: true }]}
        className={cx(style.monitoringOverview, '-striped -highlight ')}
        previousText={lang.tr('previous')}
        nextText={lang.tr('next')}
        noDataText={lang.tr('noRowsFound')}
        pageText={lang.tr('page')}
        ofText={lang.tr('of')}
        rowsText={lang.tr('rows')}
      />
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({
  bots: state.bots.bots,
  profile: state.user.profile,
  currentWorkspace: state.user.currentWorkspace
})

const connector = connect(mapStateToProps, { fetchBots })
export default connector(Logs)
