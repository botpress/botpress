import { Classes, Dialog } from '@blueprintjs/core'
import React, { FC, useState } from 'react'
import ReactTable from 'react-table'

import { ContentUsage } from '.'
import style from './style.scss'

interface Props {
  usage: ContentUsage[]
  isOpen: boolean
  handleClose: () => void
}

export const UsageModal: FC<Props> = props => {
  const [getPage, setPage] = useState(0)
  const [getPageSize, setPageSize] = useState(5)

  const columns = [
    {
      Header: 'Type',
      filterable: false,
      accessor: 'type'
    },
    {
      Header: 'Name',
      filterable: false,
      accessor: 'name'
    },
    {
      Header: 'Node',
      filterable: false,
      accessor: 'node'
    },
    {
      Header: 'Count',
      filterable: false,
      accessor: 'count'
    }
  ]

  const onFetchData = ({ page, pageSize }) => {
    setPage(page)
    setPageSize(pageSize)
  }

  const onPageSizeChange = (pageSize: number, page: number) => {
    setPage(page)
    setPageSize(pageSize)
  }

  const pageCount = Math.ceil(props.usage.length / getPageSize)
  return (
    <Dialog
      title="Content Usage"
      isOpen={props.isOpen}
      className={style.modal}
      onClose={props.handleClose}
      canOutsideClickClose
    >
      <div className={Classes.DIALOG_BODY}>
        <ReactTable
          columns={columns}
          data={props.usage}
          page={getPage}
          onFetchData={onFetchData}
          onPageSizeChange={onPageSizeChange}
          onPageChange={setPage}
          defaultPageSize={getPageSize}
          className="-striped -highlight"
          pages={pageCount}
        />
      </div>
    </Dialog>
  )
}
