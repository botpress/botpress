import { lang } from 'botpress/shared'
import cx from 'classnames'
import moment from 'moment'
import React from 'react'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import style from './style.scss'

const IncidentsTable = ({ data }) => {
  const columns = [
    {
      Header: lang.tr('admin.monitoring.column.rule'),
      accessor: 'ruleName'
    },
    {
      Header: lang.tr('admin.monitoring.column.host'),
      accessor: 'hostName'
    },
    {
      Header: lang.tr('admin.monitoring.column.startTime'),
      Cell: x => moment(x.value).format('YYYY-MM-DD HH:mm:ss'),
      width: 140,
      className: 'center',
      accessor: 'startTime'
    },
    {
      Header: lang.tr('admin.monitoring.column.endTime'),
      Cell: x => (x.value && moment(x.value).format('YYYY-MM-DD HH:mm:ss')) || '',
      width: 140,
      accessor: 'endTime'
    },
    {
      Header: lang.tr('admin.monitoring.column.triggerValue'),
      width: 100,
      accessor: 'triggerValue'
    }
  ]

  return (
    <ReactTable
      columns={columns}
      data={data}
      defaultPageSize={5}
      defaultSorted={[{ id: 'host', desc: false }]}
      className={cx(style.monitoringOverview, '-striped -highlight')}
    />
  )
}

export default IncidentsTable
