import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import {
  Checkbox,
  Table
} from 'react-bootstrap'

const style = require('./style.scss')

export default class ManageView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      checkedIds: [],
      allChecked: false
    }
  }

  handleCheckboxChanged(id) {
    console.log('CHECK: ', id)

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

  handleAllCheckedChanged() {
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

  handlePreviousClicked() {
    console.log('PREVIOUS') // TODO: Not implemented yet (server and client)
  }

  handleNextClicked() {
    console.log('NEXT') // TODO: Not implemented yet (server and client)
  }

  handleDeleteSelected() {
    this.props.handleDeleteSelected(this.state.checkedIds)
  }

  renderTableHeader() {
    return <tr>
        <th style={{ 'width': '20%' }}></th>
        <th style={{ 'width': '20%' }}>ID</th>
        <th style={{ 'width': '20%' }}>Category</th>
        <th style={{ 'width': '20%' }}>Preview</th>
        <th style={{ 'width': '20%' }}>Created</th>
      </tr>
  }

  renderMessage(m) {
    const checked = _.includes(this.state.checkedIds, m.id)

    return <tr>
        <td><Checkbox checked={checked} onClick={() => ::this.handleCheckboxChanged(m.id)}/></td>
        <td>{m.id}</td>
        <td>{m.categoryId}</td>
        <td>{m.previewText}</td>
        <td>{moment(m.createdOn).format('MMMM Do YYYY, h:mm')}</td>
      </tr>
  }

  renderTable() {
    return <div className={style.container}>
      <Table striped bordered condensed hover>
        <tbody>
          {this.props.messages.map(::this.renderMessage)}
        </tbody>
      </Table>
    </div>
  }

  renderHeader() {
    return <div className={style.header}>
      <div className={style.left}>
        <button onClick={::this.handleAllCheckedChanged}>
          <Checkbox checked={this.state.allChecked} onClick={::this.handleAllCheckedChanged}/>
        </button>
        <button onClick={() => this.props.handleRefresh}>
          <i className='material-icons'>refresh</i>
        </button> 
        <button onClick={::this.handleDeleteSelected}>
          <i className='material-icons'>delete</i>
        </button>
      </div>
      <div className={style.right}>
        <button onClick={::this.handlePreviousClicked}>
          <i className='material-icons'>keyboard_arrow_left</i>
        </button>
        <button onClick={::this.handleNextClicked}>
          <i className='material-icons'>keyboard_arrow_right</i>
        </button>
      </div>
    </div>
  }

  render() {
    const classNames = classnames({
      'bp-manage': true,
      [style.manage]: true
    })

    return <div className={classNames}>
      {this.renderHeader()}
      {this.renderTable()}
    </div>
  }
}
