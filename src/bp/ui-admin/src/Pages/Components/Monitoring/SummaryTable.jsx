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
      accessor: 'cpu.usage'
    },
    {
      Header: 'Peak Mem Usage',
      Cell: x => x.value + '%',
      width: 120,
      accessor: 'mem.usage'
    },
    {
      Header: 'Requests',
      width: 120,
      className: 'center',
      accessor: 'requests.count'
    },
    {
      Header: 'Events In',
      width: 120,
      className: 'center',
      accessor: 'eventsIn.count',
      align: 'right'
    },
    {
      Header: 'Events Out',
      width: 120,
      className: 'center',
      accessor: 'eventsOut.count'
    },
    {
      Header: 'Warnings',
      width: 120,
      className: 'center',
      accessor: 'warnings.count'
    },
    {
      Header: 'Errors',
      width: 120,
      className: 'center',
      accessor: 'errors.count'
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
