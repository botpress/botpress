import { Classes, Dialog } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import ReactTable from 'react-table'
import { getFlowLabel } from '~/components/Shared/Utils'

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
      Header: lang.tr('type'),
      filterable: false,
      accessor: 'type',
      width: 100
    },
    {
      Header: lang.tr('name'),
      filterable: false,
      accessor: 'name',
      Cell: x => {
        const href = getHref(x)
        const name = x.original.name
        return <a href={href}>{x.original.type === 'Flow' ? getFlowLabel(name) : name}</a>
      }
    },
    {
      Header: lang.tr('studio.content.usageModal.node'),
      filterable: false,
      accessor: 'node',
      Cell: x => {
        const href = getHref(x)
        return <a href={href}>{x.original.node}</a>
      }
    },
    {
      Header: lang.tr('count'),
      filterable: false,
      accessor: 'count',
      width: 80,
      className: style.centered
    }
  ]

  const getHref = x => {
    if (x.original.type === 'Flow') {
      const flowName = x.original.name.replace(/\.flow\.json$/i, '')
      return `/studio/${window.BOT_ID}/flows/${flowName}/#search:${x.original.node}`
    } else {
      return `/studio/${window.BOT_ID}/modules/qna?id=${x.original.id}`
    }
  }

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
      title={lang.tr('studio.content.usageModal.contentUsage')}
      isOpen={props.isOpen}
      className={style.modal}
      onClose={props.handleClose}
      canOutsideClickClose
      style={{ width: 700 }}
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
          previousText={lang.tr('previous')}
          nextText={lang.tr('next')}
          pageText={lang.tr('page')}
          ofText={lang.tr('of')}
          rowsText={lang.tr('rows')}
        />
      </div>
    </Dialog>
  )
}
