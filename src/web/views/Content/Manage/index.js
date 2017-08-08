import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

export default class ManageView extends Component {
  constructor(props) {
    super(props)
  }

  handleDeleteSelected() {
    const ids = []
    this.props.handleDeleteSelected(ids)
  }

  renderTableHeader() {
    return <th>
        <td></td>
        <td>ID</td>
        <td>Category</td>
        <td>Preview</td>
      </th>
  }

  renderItem(i) {
    return <tr>
        <td></td>
        <td>{i.id}</td>
        <td>{i.categoryId}</td>
        <td>{i.previewText}}</td>
      </tr>
  }

  renderTable() {
    return <table>
      {this.renderTableHeader()}
      {this.props.items.map(this.renderItem)}
    </table>
  }

  renderHeader() {
    return <div>
      <button className='bp-button' onClick={::this.handleDeleteSelected}>Delete</button>
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
