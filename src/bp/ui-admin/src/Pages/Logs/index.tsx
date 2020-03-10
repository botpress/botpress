import { Button, Checkbox, Popover } from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import { BotConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { Dropdown, Option } from 'botpress/shared'
import { UserProfile } from 'common/typings'
import _ from 'lodash'
import moment from 'moment'
import queryString from 'query-string'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import ReactTable, { Column } from 'react-table'
import { toastSuccess } from '~/utils/toaster'
import PageContainer from '~/App/PageContainer'

import api from '../../api'
import { fetchBots } from '../../reducers/bots'

import { filterText, getDateShortcuts, getRangeLabel, lowercaseFilter } from './utils'

const LEVELS: Option[] = [
  { label: 'All', value: '' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Critical', value: 'critical' }
]

const EVERYTHING: Option[] = [{ label: 'Everything', value: '' }]

interface Props {
  bots: BotConfig[]
  fetchBots: () => void
  profile: UserProfile
  currentWorkspace: any
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const Logs: FC<Props> = props => {
  const [data, setData] = useState<sdk.LoggerEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<Option>(LEVELS[0])
  const [botFilter, setBotFilter] = useState<Option>(EVERYTHING[0])
  const [hostFilter, setHostFilter] = useState<Option>(EVERYTHING[0])
  const [dateRange, setDateRange] = useState<DateRange>()
  const [filters, setFilters] = useState()
  const [hostNames, setHostNames] = useState<string[]>([])

  const [onlyWorkspace, setOnlyWorkspace] = useState(!props.profile.isSuperAdmin)
  const [botIds, setBotIds] = useState<string[]>([])

  useEffect(() => {
    if (!props.bots) {
      props.fetchBots()
    }

    if (!dateRange) {
      setDateRange(getDateShortcuts()[1].dateRange)
    }

    // tslint:disable-next-line: no-floating-promises
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
      const logs = (await api.getSecured().get(`/admin/logs?${args}`)).data

      setData(logs)
      setBotIds(_.uniq(logs.map(x => x.botId).filter(Boolean)))
      setHostNames(_.uniq(logs.map(x => x.hostname).filter(Boolean)))

      if (isRefreshing) {
        toastSuccess('Logs refreshed')
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
        Header: 'Date',
        filterable: false,
        Cell: ({ original: { timestamp } }) => moment(timestamp).format(DATE_FORMAT),
        accessor: 'timestamp',
        width: 130
      }
    ]

    if (hostNames && hostNames.length > 1) {
      columns.push({
        Header: 'Hostname',
        Filter: filterHostname,
        accessor: 'hostname',
        width: 130
      })
    }

    return [
      ...columns,
      {
        Header: 'Bot ID',
        Filter: filterBot,
        accessor: 'botId',
        width: 150
      },
      {
        Header: 'Level',
        Cell: ({ original: { level } }) => {
          switch (level) {
            case 'info':
              return <span className="logInfo">Info</span>
            case 'warn':
              return <span className="logWarn">Warning</span>
            case 'error':
              return <span className="logError">Error</span>
            case 'critical':
              return <span className="logCritical">Critical</span>
          }
        },
        Filter: filterLevel,
        accessor: 'level',
        width: 110,
        className: 'center'
      },
      {
        Header: 'Scope',
        Filter: filterText,
        accessor: 'scope',
        width: 100
      },
      {
        Header: 'Message',
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
        {rows === 2000 && <span className="logError">Row limit reached. Choose a different time range</span>}
      </small>
    )
  }

  return (
    <PageContainer title={<span>Logs </span>} fullWidth={true}>
      <div className="logToolbar-container">
        <div className="logToolbar-left">{renderRowHeader()}</div>
        <div className="logToolbar-right">
          <Popover>
            <Button text="Date Time Range" icon="calendar" small />

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
            disabled={!props.profile.isSuperAdmin}
            label={`Only bots from this workspace`}
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
        defaultSorted={[{ id: 'level', desc: false }]}
        className="-striped -highlight monitoringOverview"
      />
    </PageContainer>
  )
}

const mapStateToProps = state => ({
  bots: state.bots.bots,
  profile: state.user.profile,
  currentWorkspace: state.user.currentWorkspace
})

export default connect(mapStateToProps, { fetchBots })(Logs)
