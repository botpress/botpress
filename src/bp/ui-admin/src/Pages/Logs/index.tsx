import { Button, Checkbox, Popover, Tooltip } from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import { Select } from '@blueprintjs/select'
import { BotConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
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

import { dropdownRenderer, filterText, getDateShortcuts, lowercaseFilter } from './utils'

const LEVELS: Option[] = [
  { label: 'All', value: '' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Critical', value: 'critical' }
]

const SCOPE_ITEMS: Option[] = [{ label: 'Everything', value: '' }]

interface Option {
  label: string
  value: string
}

interface Props {
  bots: BotConfig[]
  fetchBots: () => void
  profile: UserProfile
  currentWorkspace: any
}

const SelectDropdown = Select.ofType<Option>()
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const Logs: FC<Props> = props => {
  const [data, setData] = useState<sdk.LoggerEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<Option>(LEVELS[0])
  const [botFilter, setBotFilter] = useState<Option>(SCOPE_ITEMS[0])
  const [dateRange, setDateRange] = useState<DateRange>()
  const [filters, setFilters] = useState()

  const [onlyWorkspace, setOnlyWorkspace] = useState(!props.profile.isSuperAdmin)
  const [botIds, setBotIds] = useState<string[]>([])

  useEffect(() => {
    if (!props.bots) {
      props.fetchBots()
    }

    if (!dateRange) {
      setDateRange(getDateShortcuts()[0].dateRange)
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
      setBotFilter(SCOPE_ITEMS[0])
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

      if (isRefreshing) {
        toastSuccess('Logs refreshed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filterBot = ({ onChange }) => {
    if (!props.bots) {
      return null
    }

    const items = [...SCOPE_ITEMS, ...botIds.map(id => ({ label: id, value: id }))]

    return (
      <SelectDropdown
        items={items}
        activeItem={botFilter}
        popoverProps={{ minimal: true }}
        itemRenderer={dropdownRenderer}
        onItemSelect={option => {
          setBotFilter(option)
          onChange(option.value)
          updateBotIdUrl(option.value)
        }}
      >
        <Button text={botFilter && botFilter.label} rightIcon="double-caret-vertical" />
      </SelectDropdown>
    )
  }

  const filterLevel = ({ onChange }) => {
    return (
      <SelectDropdown
        items={LEVELS}
        activeItem={levelFilter}
        popoverProps={{ minimal: true }}
        itemRenderer={dropdownRenderer}
        onItemSelect={option => {
          setLevelFilter(option)
          onChange(option.value)
        }}
      >
        <Button text={levelFilter && levelFilter.label} rightIcon="double-caret-vertical" />
      </SelectDropdown>
    )
  }

  const columns: Column[] = [
    {
      Header: 'Date',
      filterable: false,
      Cell: ({ original: { timestamp } }) => moment(timestamp).format(DATE_FORMAT),
      accessor: 'timestamp',
      width: 130
    },
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

  const getRangeLabel = () => {
    if (dateRange) {
      return `From ${moment(dateRange[0]).format(DATE_FORMAT)} to ${moment(dateRange[1]).format(DATE_FORMAT)}`
    }
  }

  return (
    <PageContainer title={<span>Logs </span>} fullWidth={true}>
      <div style={{ display: 'flex' }}>
        <Popover>
          <Tooltip content={getRangeLabel()} hoverOpenDelay={500}>
            <Button text="Change Time Frame" icon="calendar" small />
          </Tooltip>
          <DateRangePicker
            allowSingleDayRange
            value={dateRange}
            shortcuts={getDateShortcuts()}
            timePrecision="second"
            onChange={val => setDateRange(val)}
            maxDate={new Date()}
          />
        </Popover>

        <div>
          <Button icon="refresh" text="Refresh logs" small onClick={() => fetchLogs(true)} style={{ marginLeft: 10 }} />
        </div>
        <Checkbox
          checked={onlyWorkspace}
          onChange={e => setOnlyWorkspace(e.currentTarget.checked)}
          disabled={!props.profile.isSuperAdmin}
          label={`Only bots from this workspace`}
          style={{ marginLeft: 10 }}
        />
      </div>

      <ReactTable
        columns={columns}
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
