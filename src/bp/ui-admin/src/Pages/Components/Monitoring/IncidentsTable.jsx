import React from 'react'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import moment from 'moment'

const IncidentsTable = ({ data }) => {
  const columns = [
    {
      Header: 'Rule',
      accessor: 'ruleName'
    },
    {
      Header: 'Host',
      accessor: 'hostName'
    },
    {
      Header: 'Start Time',
      Cell: x => moment(x.value).format('YYYY-MM-DD HH:mm:ss'),
      width: 140,
      className: 'center',
      accessor: 'startTime'
    },
    {
      Header: 'End Time',
      Cell: x => (x.value && moment(x.value).format('YYYY-MM-DD HH:mm:ss')) || '',
      width: 140,
      accessor: 'endTime'
    },
    {
      Header: 'Trigger Value',
      width: 100,
      accessor: 'triggerValue'
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

export default IncidentsTable
