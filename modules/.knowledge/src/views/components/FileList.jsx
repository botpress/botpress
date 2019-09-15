import React, { Component } from 'react'
import CheckboxTable from 'react-table'
import 'react-table/react-table.css'
import { Button } from 'react-bootstrap'
import style from '../style.scss'

export default class FileList extends Component {
  state = {
    checkedIds: [],
    allChecked: false
  }

  handleCheckboxChanged = id => {
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
      let ids = []

      if (this.state.allChecked) {
        ids = this.props.data.map(d => d.id)
      }

      this.setState({ checkedIds: ids })
    })
  }

  renderFilterPlaceholder = placeholder => ({ filter, onChange }) => (
    <input
      type="text"
      placeholder={placeholder}
      value={filter ? filter.value : ''}
      style={{ width: '100%' }}
      onChange={event => onChange(event.target.value)}
    />
  )

  renderActionButtons() {
    return (
      <span>
        <Button onClick={this.props.onRefresh} title="Refresh">
          <i className="material-icons">refresh</i>
        </Button>

        <Button
          onClick={() => this.props.onDeleteSelected(this.state.checkedIds)}
          disabled={_.isEmpty(this.state.checkedIds)}
          title="Delete selected"
        >
          <i className="material-icons">delete</i>
        </Button>
      </span>
    )
  }

  getTableColumns() {
    return [
      {
        Header: x => {
          return (
            <input
              type="checkbox"
              className="checkbox"
              checked={this.state.allChecked}
              onChange={() => this.handleAllCheckedChanged()}
            />
          )
        },
        Cell: ({ original }) => {
          const checked = _.includes(this.state.checkedIds, original.id)
          return (
            <input
              type="checkbox"
              className="checkbox"
              checked={checked}
              onChange={() => this.handleCheckboxChanged(original.id)}
            />
          )
        },
        id: 'checkbox',
        accessor: '',
        filterable: false,
        sortable: false,
        resizable: false,
        width: 30
      },
      {
        Header: 'Filename',
        Cell: ({ value }) => (
          <a href="#" onClick={() => this.props.onView(value)}>
            {value}
          </a>
        ),
        Filter: this.renderFilterPlaceholder('Search'),
        filterable: true,
        resizable: false,
        accessor: 'filename'
      },
      {
        Header: '',
        Cell: ({ value }) => (
          <Button bsSize="xs" className={style.btn_mini} onClick={() => this.props.onDelete(value)}>
            <i className="material-icons">delete</i>
          </Button>
        ),
        accessor: 'id',
        filterable: false,
        sortable: false,
        resizable: false,
        width: 35
      }
    ]
  }

  renderHeader() {
    return (
      <div className={style.header}>
        <div>{this.renderActionButtons()}</div>
      </div>
    )
  }

  renderTable() {
    return (
      <CheckboxTable
        data={this.props.data}
        columns={this.getTableColumns()}
        defaultPageSize={10}
        className="-striped -highlight"
      />
    )
  }

  render() {
    return (
      <div>
        <h3>Indexed documents</h3>
        {this.renderHeader()}
        {this.renderTable()}
      </div>
    )
  }
}
