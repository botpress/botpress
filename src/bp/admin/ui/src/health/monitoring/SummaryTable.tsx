import { Button, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import { Metric } from 'common/monitoring'
import moment from 'moment'
import React, { useState } from 'react'
import ReactTable from 'react-table'
import 'react-table/react-table.css'

import ServerControl from './ServerControl'
import style from './style.scss'

const SummaryTable = ({ data }) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [host, setHost] = useState('')

  const restartServer = async host => {
    setHost(host)
    setModalOpen(true)
  }

  const columns = [
    {
      Header: lang.tr('admin.monitoring.column.host'),
      accessor: 'host'
    },
    {
      Header: lang.tr('admin.monitoring.column.uptime'),
      Cell: x => {
        const minutes = moment.duration(x.value, 'seconds').asMinutes()
        return `${Math.round(minutes)} mins`
      },
      width: 120,
      className: 'center',
      accessor: 'uptime'
    },
    {
      Header: lang.tr('admin.monitoring.column.peakCpuUsage'),
      Cell: x => x.value + '%',
      width: 120,
      accessor: 'cpu.usage'
    },
    {
      Header: lang.tr('admin.monitoring.column.peakMemUsage'),
      Cell: x => x.value + '%',
      width: 120,
      accessor: 'mem.usage'
    },
    {
      Header: lang.tr('admin.monitoring.column.requests'),
      width: 120,
      className: 'center',
      accessor: Metric.Requests
    },
    {
      Header: lang.tr('admin.monitoring.column.eventsIn'),
      width: 120,
      className: 'center',
      accessor: Metric.EventsIn,
      align: 'right'
    },
    {
      Header: lang.tr('admin.monitoring.column.eventsOut'),
      width: 120,
      className: 'center',
      accessor: Metric.EventsOut
    },
    {
      Header: lang.tr('admin.monitoring.column.warnings'),
      width: 120,
      className: 'center',
      accessor: Metric.Warnings
    },
    {
      Header: lang.tr('admin.monitoring.column.errors'),
      width: 120,
      className: 'center',
      accessor: Metric.Errors
    },
    {
      Header: lang.tr('admin.monitoring.column.criticals'),
      width: 120,
      className: 'center',
      accessor: Metric.Criticals
    },
    {
      Cell: x => (
        <Tooltip content={lang.tr('admin.monitoring.restart')}>
          <Button icon="power" onClick={() => restartServer(x.original.host)} small />
        </Tooltip>
      ),

      filterable: false,
      width: 45
    }
  ]

  return (
    <React.Fragment>
      <ReactTable
        columns={columns}
        data={data}
        defaultPageSize={5}
        defaultSorted={[{ id: 'host', desc: false }]}
        className={cx(style.monitoringOverview, '-striped -highlight')}
      />
      <ServerControl hostname={host} isOpen={isModalOpen} toggle={() => setModalOpen(!isModalOpen)} />
    </React.Fragment>
  )
}

export default SummaryTable
