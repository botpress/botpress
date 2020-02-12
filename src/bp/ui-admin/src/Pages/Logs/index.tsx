import { Button, Checkbox, ControlGroup } from '@blueprintjs/core'
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

import { dropdownRenderer, filterText, lowercaseFilter } from './utils'

const LEVELS: Option[] = [
  { label: 'All', value: '' },
  { label: 'Warning', value: 'warn' },
  { label: 'Info', value: 'info' },
  { label: 'Error', value: 'error' },
  { label: 'Critical', value: 'critical' }
]

const TIME_SPAN: TimeOption[] = [
  { label: 'Last hour', value: moment.duration(1, 'h') },
  { label: 'Last day', value: moment.duration(24, 'h') },
  { label: 'Last week', value: moment.duration(7, 'd') },
  { label: 'Last month', value: moment.duration(30, 'd') },
  { label: 'Last year', value: moment.duration(365, 'd') }
]

const SCOPE_ITEMS: Option[] = [{ label: 'Everything', value: '' }]

interface Option {
  label: string
  value: string
}

interface TimeOption {
  label: string
  value: moment.Duration
}

interface Props {
  bots: BotConfig[]
  fetchBots: () => void
  profile: UserProfile
  currentWorkspace: any
}

const SelectDropdown = Select.ofType<Option>()
const SelectTimeDropdown = Select.ofType<TimeOption>()

const Logs: FC<Props> = props => {
  const [data, setData] = useState<sdk.LoggerEntry[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeOption>(TIME_SPAN[0])
  const [levelFilter, setLevelFilter] = useState<Option>(LEVELS[0])
  const [botFilter, setBotFilter] = useState<Option>(SCOPE_ITEMS[0])
  const [filters, setFilters] = useState()

  const [onlyWorkspace, setOnlyWorkspace] = useState(!props.profile.isSuperAdmin)
  const [botIds, setBotIds] = useState<string[]>([])

  useEffect(() => {
    if (!props.bots) {
      props.fetchBots()
    }

    // tslint:disable-next-line: no-floating-promises
    fetchLogs()
  }, [timeFilter, onlyWorkspace, props.currentWorkspace])

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
    const date = moment()
      .subtract(timeFilter.value)
      .format('x')

    try {
      const logs = (await api.getSecured().get(`/admin/logs?fromDate=${date}&onlyWorkspace=${onlyWorkspace}`)).data

      setData(logs)
      setBotIds(_.uniq(logs.map(x => x.botId).filter(Boolean)))

      if (isRefreshing) {
        toastSuccess('Logs refreshed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filterTimeSpan = () => {
    return (
      <SelectTimeDropdown
        items={TIME_SPAN}
        activeItem={timeFilter}
        popoverProps={{ minimal: true }}
        itemRenderer={dropdownRenderer}
        onItemSelect={option => setTimeFilter(option)}
      >
        <Button text={timeFilter && timeFilter.label} rightIcon="double-caret-vertical" />
      </SelectTimeDropdown>
    )
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
      Header: 'Timestamp',
      Filter: filterTimeSpan,
      Cell: ({ original: { timestamp } }) => moment(timestamp).format('YYYY-MM-DD HH:mm:ss'),
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
      accessor: 'message'
    }
  ]

  return (
    <PageContainer title={<span>Logs </span>} fullWidth={true}>
      <ControlGroup style={{ justifyContent: 'flex-end' }}>
        <div>
          <Button icon="refresh" text="Refresh logs" small={true} onClick={() => fetchLogs(true)}></Button>
        </div>
        <Checkbox
          checked={onlyWorkspace}
          onChange={e => setOnlyWorkspace(e.currentTarget.checked)}
          disabled={!props.profile.isSuperAdmin}
          label={`Only bots from this workspace`}
          style={{ marginLeft: 10 }}
        />
      </ControlGroup>

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
