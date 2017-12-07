import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import { Checkbox, Table, Button, FormControl, FormGroup, Tooltip, OverlayTrigger } from 'react-bootstrap'

const style = require('./style.scss')

export default class ListView extends Component {
  state = {
    checkedIds: [],
    allChecked: false,
    search: ''
  }

  componentDidMount() {
    const fn = () => {
      if (this.props.handleSearch) {
        this.props.handleSearch(this.state.search)
      }
    }

    this.debouncedHandleSearch = _.debounce(fn, 1000)
  }

  handleCheckboxChanged(id) {
    const modified = this.state.checkedIds

    if (_.includes(this.state.checkedIds, id)) {
      _.pull(modified, id)
    } else {
      modified.push(id)
    }

    this.setState({
      checkedIds: modified
    })
  }

  handleAllCheckedChanged = () => {
    this.setState({
      allChecked: !this.state.allChecked
    })

    setImmediate(() => {
      const ids = []

      if (this.state.allChecked) {
        _.forEach(this.props.messages, ({ id }) => {
          ids.push(id)
        })
      }

      this.setState({
        checkedIds: ids
      })
    })
  }

  handleDeleteSelected = () => {
    this.props.handleDeleteSelected(this.state.checkedIds)

    this.setState({
      checkedIds: [],
      allChecked: false
    })
  }

  handleSearchChanged = event => {
    this.setState({
      search: event.target.value
    })

    this.debouncedHandleSearch && this.debouncedHandleSearch()
  }

  renderTableHeader() {
    return (
      <tr>
        <th />
        <th>UMM Id</th>
        <th>Category</th>
        <th>Preview</th>
        <th>Created on</th>
      </tr>
    )
  }

  renderMessage = m => {
    const checked = _.includes(this.state.checkedIds, m.id)
    const className = classnames(style.item, {
      [style.selected]: checked
    })

    return (
      <tr className={className}>
        <td style={{ width: '2%', minWidth: '34px' }}>
          <Checkbox checked={checked} onClick={() => this.handleCheckboxChanged(m.id, m.categoryId)} />
        </td>
        <td style={{ width: '16%' }} onClick={() => this.props.handleModalShow(m.id, m.categoryId)}>
          {'#!' + m.id}
        </td>
        <td style={{ width: '8%' }} onClick={() => this.props.handleModalShow(m.id, m.categoryId)}>
          {m.categoryId}
        </td>
        <td style={{ width: '58%' }} onClick={() => this.props.handleModalShow(m.id, m.categoryId)}>
          {m.previewText}
        </td>
        <td style={{ width: '18%' }} onClick={() => this.props.handleModalShow(m.id, m.categoryId)}>
          {moment(m.createdOn).format('MMMM Do YYYY, h:mm')}
        </td>
      </tr>
    )
  }

  renderTable() {
    if (this.props.messages && this.props.messages.length === 0) {
      return <div className={style.empty}>There's no content yet. You can create some using the 'Add' button.</div>
    }

    return (
      <div className={style.container}>
        <Table striped bordered condensed hover>
          <tbody>{this.props.messages.map(this.renderMessage)}</tbody>
        </Table>
      </div>
    )
  }

  renderPaging() {
    const count = this.props.count

    let from = (this.props.page - 1) * this.props.messagesPerPage + 1
    let to = this.props.page * this.props.messagesPerPage

    from = count !== 0 ? from : 0
    to = to <= count ? to : count

    const text = `${from} - ${to} of ${count}`

    return <span className={style.paging}>{text}</span>
  }

  renderActionButtons() {
    return (
      <span>
        <Button onClick={this.handleAllCheckedChanged}>
          <Checkbox checked={this.state.allChecked} onClick={this.handleAllCheckedChanged} />
        </Button>
        <Button onClick={this.props.handleRefresh}>
          <i className="material-icons">refresh</i>
        </Button>
        <Button onClick={this.handleDeleteSelected} disabled={_.isEmpty(this.state.checkedIds)}>
          <i className="material-icons">delete</i>
        </Button>
      </span>
    )
  }

  renderPagingButtons() {
    return (
      <span className={style.pagingButtons}>
        <Button onClick={this.props.handlePrevious} disabled={this.props.page === 1}>
          <i className="material-icons">keyboard_arrow_left</i>
        </Button>
        <Button
          onClick={this.props.handleNext}
          disabled={this.props.page * this.props.messagesPerPage >= this.props.count}
        >
          <i className="material-icons">keyboard_arrow_right</i>
        </Button>
      </span>
    )
  }

  renderSearchBar() {
    return (
      <FormGroup className={style.search}>
        <FormControl type="text" placeholder="Search" value={this.state.search} onChange={this.handleSearchChanged} />
      </FormGroup>
    )
  }

  renderHeader() {
    const leftCls = classnames('pull-left', style.left)
    const rightCls = classnames('pull-right', style.right)

    return (
      <div className={style.header}>
        <div className={leftCls}>
          {this.renderActionButtons()}
          {this.renderSearchBar()}
        </div>
        <div className={rightCls}>
          {this.renderPaging()}
          {this.renderPagingButtons()}
        </div>
      </div>
    )
  }

  render() {
    const classNames = classnames('bp-list', style.list)

    return (
      <div className={classNames}>
        {this.renderHeader()}
        {this.renderTable()}
      </div>
    )
  }
}
