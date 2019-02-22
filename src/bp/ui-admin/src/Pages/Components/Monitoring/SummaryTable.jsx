import React from 'react'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import moment from 'moment'

const SummaryTable = ({ data }) => {
  const columns = [
    {
      Header: 'Host',
      accessor: 'host'
    },
    {
      Header: 'Uptime',
      Cell: x => {
        const minutes = moment.duration(x.value, 'seconds').asMinutes()
        return `${Math.round(minutes)} mins`
      },
      width: 120,
      className: 'center',
      accessor: 'uptime'
    },
    {
      Header: 'Peak CPU Usage',
      Cell: x => x.value + '%',
      width: 120,
      accessor: 'cpuUsage'
    },
    {
      Header: 'Peak Mem Usage',
      Cell: x => x.value + '%',
      width: 120,
      accessor: 'memUsage'
    },
    {
      Header: 'Requests',
      width: 120,
      className: 'center',
      accessor: 'metrics.requests'
    },
    {
      Header: 'Events In',
      width: 120,
      className: 'center',
      accessor: 'metrics.eventsIn',
      align: 'right'
    },
    {
      Header: 'Events Out',
      width: 120,
      className: 'center',
      accessor: 'metrics.eventsOut'
    },
    {
      Header: 'Warnings',
      width: 120,
      className: 'center',
      accessor: 'metrics.warnings'
    },
    {
      Header: 'Errors',
      width: 120,
      className: 'center',
      accessor: 'metrics.errors'
    }
  ]

  return (
    <ReactTable
      columns={columns}
      data={data}
      defaultPageSize={5}
      defaultSorted={[{ id: 'host' }]}
      className="-striped -highlight monitoringOverview"
    />
  )
}

export default SummaryTable
