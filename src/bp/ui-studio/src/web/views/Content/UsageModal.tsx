import React, { useState } from 'react'
import { Modal } from 'react-bootstrap'
import ReactTable from 'react-table'

import { ContentUsage } from '.'
import style from './style.scss'

interface Props {
  usage: ContentUsage[]
  handleClose: Function
}

interface State {
  page: number
  pageSize: number
}

export default class UsageModal extends React.Component<Props, State> {
  state = {
    page: 0,
    pageSize: 5
  }

  getTableColumns() {
    return [
      {
        Header: 'Type',
        filterable: false,
        accessor: 'type',
        width: 150
      },
      {
        Header: 'Name',
        filterable: false,
        accessor: 'name',
        width: 150
      },
      {
        Header: 'Node',
        filterable: false,
        accessor: 'node',
        width: 150
      },
      {
        Header: 'Count',
        filterable: false,
        accessor: 'count',
        width: 50
      }
    ]
  }

  fetchData = (state: State) => {
    this.setState({
      pageSize: state.pageSize,
      page: state.page
    })
  }

  render() {
    const pageCount = Math.ceil(this.props.usage.length / this.state.pageSize)
    return (
      <Modal
        container={document.getElementById('app')}
        className={style.modal}
        onHide={this.props.handleClose}
        backdrop={'static'}
        show
      >
        <Modal.Header closeButton>
          <Modal.Title>Content Usage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ReactTable
            columns={this.getTableColumns()}
            data={this.props.usage}
            page={this.state.page}
            onFetchData={this.fetchData}
            onPageSizeChange={(pageSize, page) => this.setState({ page, pageSize })}
            onPageChange={page => this.setState({ page })}
            defaultPageSize={this.state.pageSize}
            className="-striped -highlight"
            pages={pageCount}
          />
        </Modal.Body>
      </Modal>
    )
  }
}
