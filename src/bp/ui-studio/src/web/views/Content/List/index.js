import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import { Checkbox, Table, Button, FormControl, FormGroup, Tooltip, OverlayTrigger, Glyphicon } from 'react-bootstrap'

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
        _.forEach(this.props.contentItems, ({ id }) => {
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

  handleCloneSelected = () => {
    this.props.handleClone(this.state.checkedIds)

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
        <th>Content Id</th>
        <th>Category</th>
        <th>Preview</th>
        <th>Created on</th>
      </tr>
    )
  }

  renderContentItem = (m, i) => {
    const handleEdit = () => !this.props.readOnly && this.props.handleEdit(m.id, m.categoryId)
    const checked = _.includes(this.state.checkedIds, m.id)
    const className = classnames(style.item, { [style.selected]: checked })

    return (
      <tr className={className} key={i}>
        {!this.props.readOnly && (
          <td style={{ width: '2%', minWidth: '34px' }}>
            <Checkbox checked={checked} onClick={() => this.handleCheckboxChanged(m.id, m.categoryId)} />
          </td>
        )}
        <td style={{ width: '16%' }}>{'#!' + m.id}</td>
        <td style={{ width: '8%' }}>{m.categoryId}</td>
        <td style={{ width: '58%' }}>{m.previewText}</td>
        <td style={{ width: '18%' }}>{moment(m.createdOn).format('MMMM Do YYYY, h:mm')}</td>
        {!this.props.readOnly && (
          <td>
            <Button bsSize="small" onClick={handleEdit}>
              <Glyphicon glyph="pencil" />
            </Button>
          </td>
        )}
      </tr>
    )
  }

  renderTable() {
    if (this.props.contentItems && this.props.contentItems.length === 0) {
      const message = this.props.readOnly
        ? "There's no content here."
        : "There's no content yet. You can create some using the 'Add' button."
      return <div className={style.empty}>{message}</div>
    }

    return (
      <div className={style.container}>
        <Table striped bordered condensed hover>
          <tbody>{this.props.contentItems.map(this.renderContentItem)}</tbody>
        </Table>
      </div>
    )
  }

  renderPaging() {
    const count = this.props.count

    let from = (this.props.page - 1) * this.props.itemsPerPage + 1
    let to = this.props.page * this.props.itemsPerPage

    from = count !== 0 ? from : 0
    to = to <= count ? to : count

    const text = `${from} - ${to} of ${count}`

    return <span className={style.paging}>{text}</span>
  }

  renderActionButtons() {
    return (
      <span>
        {!this.props.readOnly && (
          <Button onClick={this.handleAllCheckedChanged}>
            <Checkbox checked={this.state.allChecked} onClick={this.handleAllCheckedChanged} />
          </Button>
        )}
        <Button onClick={this.props.handleRefresh} title="Refresh">
          <i className="material-icons">refresh</i>
        </Button>
        {!this.props.readOnly && (
          <Button
            onClick={this.handleDeleteSelected}
            disabled={_.isEmpty(this.state.checkedIds)}
            title="Delete selected"
          >
            <i className="material-icons">delete</i>
          </Button>
        )}
        {!this.props.readOnly && (
          <Button onClick={this.handleCloneSelected} disabled={_.isEmpty(this.state.checkedIds)} title="Clone selected">
            <i className="material-icons">filter_none</i>
          </Button>
        )}
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
          disabled={this.props.page * this.props.itemsPerPage >= this.props.count}
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
