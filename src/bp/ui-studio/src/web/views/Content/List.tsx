import { AnchorButton, Button, Divider, InputGroup, Position, Tooltip } from '@blueprintjs/core'
import { confirmDialog, lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import Markdown from 'react-markdown'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import { LeftToolbarButtons, Toolbar } from '~/components/Shared/Interface'
import { Downloader } from '~/components/Shared/Utils'
import withLanguage from '~/components/Util/withLanguage'

import { ContentUsage } from '.'
import style from './style.scss'
import { UsageModal } from './UsageModal'

class ListView extends Component<Props, State> {
  private debouncedHandleSearch

  state = {
    searchTerm: '',
    checkedIds: [],
    allChecked: false,
    pageSize: 20,
    pages: 0,
    page: 0,
    filters: [],
    sortOrder: [],
    sortOrderUsage: '',
    tableHeight: 0,
    downloadUrl: undefined,
    showUsageModal: false,
    contentUsage: []
  }

  componentDidMount() {
    this.updateTableHeight()
    this.debouncedHandleSearch = _.debounce(() => this.launchSearch(), 1000)
    window.addEventListener('resize', this.updateTableHeight)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateTableHeight)
  }

  componentDidUpdate(prevProps) {
    if (this.props.count !== prevProps.count) {
      this.setState({ page: 0 })
    }
  }

  updateTableHeight = () => {
    this.setState({ tableHeight: window.innerHeight - 36 /** Toolbar height */ - 40 /** bottom buttons height */ })
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
    this.setState({ allChecked: !this.state.allChecked })

    setImmediate(() => {
      const ids = []

      if (this.state.allChecked) {
        _.forEach(this.props.contentItems, ({ id }) => {
          ids.push(id)
        })
      }

      this.setState({ checkedIds: ids })
    })
  }

  handleDeleteSelected = async () => {
    if (
      await confirmDialog(lang.tr('studio.content.confirmDeleteItem', { count: this.state.checkedIds.length }), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      this.props.handleDeleteSelected(this.state.checkedIds)
      this.setState({ checkedIds: [], allChecked: false })
    }
  }

  handleCloneSelected = () => {
    this.props.handleClone(this.state.checkedIds)
    this.setState({ checkedIds: [], allChecked: false })
  }

  handleSearchChanged = event => {
    this.setState({ searchTerm: event.target.value })
    this.debouncedHandleSearch?.()
  }

  onImportCompleted = () => {
    this.props.refreshCategories()
    this.launchSearch()
  }

  launchSearch = () => {
    const searchQuery: SearchQuery = {
      from: this.state.page * this.state.pageSize,
      count: this.state.pageSize,
      sortOrder: this.state.sortOrder,
      filters: this.state.filters,
      searchTerm: this.state.searchTerm
    }

    this.props.handleSearch(searchQuery)
  }

  fetchData = state => {
    const filters = state.filtered.map(filter => {
      return { column: filter.id, value: filter.value }
    })
    let sortOrder = state.sorted.map(sort => {
      return { column: sort.id, desc: sort.desc }
    })

    if (sortOrder[0].column == 'usage') {
      // we save the sorting locally, because the database doesn't have the 'usage' column
      this.state.sortOrderUsage = sortOrder[0].desc ? 'desc' : 'asc'
      sortOrder = []
    } else {
      this.state.sortOrderUsage = ''
    }

    const hasTextChanged = !_.isEqual(this.state.filters, filters)

    this.setState(
      {
        pageSize: state.pageSize,
        page: state.page,
        sortOrder,
        filters
      },
      () => {
        hasTextChanged ? this.debouncedHandleSearch?.() : this.launchSearch()
      }
    )
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

  onRowClick = (_state, rowInfo, column, _instance) => {
    return {
      onClick: (_e, handleOriginal) => {
        if (rowInfo) {
          if (column.id === 'usage') {
            if (rowInfo.original.usage.length) {
              this.setState({ showUsageModal: true, contentUsage: rowInfo.original.usage })
            }
          } else if (column.id !== 'checkbox' && !this.props.readOnly) {
            const { id, contentType } = rowInfo.original
            this.props.handleEdit(id, contentType)
          }
        }

        if (handleOriginal) {
          handleOriginal()
        }
      }
    }
  }

  getTableColumns() {
    return [
      {
        Header: () => {
          return (
            <input
              id="chk-all"
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
              id={`chk-${original.id}`}
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
        width: 35
      },
      {
        Header: lang.tr('id'),
        Cell: x => `#!${x.value}`,
        filterable: false,
        accessor: 'id',
        width: 170
      },
      {
        Header: lang.tr('studio.content.contentType'),
        filterable: false,
        accessor: 'contentType',
        width: 150
      },
      {
        Header: lang.tr('preview'),
        accessor: 'previews',
        filterable: false,
        Cell: x => {
          const preview = x.original.previews?.[this.props.contentLang]
          const className = classnames({ [style.missingTranslation]: preview.startsWith('(missing translation) ') })
          return (
            <React.Fragment>
              <span className={className}>
                <Markdown
                  source={preview}
                  renderers={{
                    image: props => <img {...props} className={style.imagePreview} />,
                    link: props => (
                      <a href={props.href} target="_blank">
                        {props.children}
                      </a>
                    )
                  }}
                />
              </span>
            </React.Fragment>
          )
        }
      },
      {
        Header: lang.tr('modifiedOn'),
        Cell: x =>
          x.original.modifiedOn ? moment(x.original.modifiedOn).format('MMM Do YYYY, h:mm') : lang.tr('never'),
        accessor: 'modifiedOn',
        filterable: false,
        width: 150
      },
      {
        Header: lang.tr('createdOn'),
        Cell: x => (x.original.createdOn ? moment(x.original.createdOn).format('MMM Do YYYY, h:mm') : lang.tr('never')),
        accessor: 'createdOn',
        filterable: false,
        width: 150
      },
      {
        Header: lang.tr('usage'),
        id: 'usage',
        Cell: x => {
          const count = this.getCountUsage(x.original.usage)
          return count ? <a>{count}</a> : count
        },
        filterable: false,
        className: style.centered,
        width: 100
      },
      {
        Cell: _x => (!this.props.readOnly ? <Button small icon="edit" className="icon-edit" /> : ''),
        filterable: false,
        width: 45
      }
    ]
  }

  getCountUsage(usage: ContentUsage[]) {
    return usage.reduce((acc: number, v: ContentUsage) => (acc += v.count), 0)
  }

  renderTable() {
    const pageCount = Math.ceil(this.props.count / this.state.pageSize)
    const noDataMessage = this.props.readOnly
      ? lang.tr('studio.content.noContent')
      : lang.tr('studio.content.noContentYet')

    if (this.state.sortOrderUsage) {
      const desc = this.state.sortOrderUsage === 'desc'
      this.props.contentItems.sort((a, b) => {
        const c = this.getCountUsage(a.usage) > this.getCountUsage(b.usage) ? 1 : -1
        return desc ? -c : c
      })
    }

    return (
      <ReactTable
        columns={this.getTableColumns()}
        data={this.props.contentItems}
        page={this.state.page}
        onFetchData={this.fetchData}
        onPageSizeChange={(pageSize, page) => this.setState({ page, pageSize })}
        onPageChange={page => this.setState({ page })}
        getTdProps={this.onRowClick}
        defaultPageSize={this.state.pageSize}
        defaultSorted={[{ id: 'modifiedOn', desc: true }]}
        noDataText={noDataMessage}
        className="-striped -highlight"
        style={{ height: this.state.tableHeight }}
        pages={pageCount}
        manual
        filterable
        previousText={lang.tr('previous')}
        nextText={lang.tr('next')}
        pageText={lang.tr('page')}
        ofText={lang.tr('of')}
        rowsText={lang.tr('rows')}
      />
    )
  }

  downloadJson = () => {
    this.setState({ downloadUrl: `${window.BOT_API_PATH}/content/export?${Date.now()}` })
  }

  render() {
    return (
      <div>
        <Downloader url={this.state.downloadUrl} />
        <Toolbar>
          <LeftToolbarButtons>
            <Tooltip content={lang.tr('refresh')} position={Position.BOTTOM}>
              <AnchorButton id="btn-refresh" icon="refresh" onClick={this.props.handleRefresh} />
            </Tooltip>

            <Divider />
            {!this.props.readOnly && (
              <Tooltip content={lang.tr('studio.content.deleteElements')} position={Position.BOTTOM}>
                <AnchorButton
                  id="btn-delete"
                  icon="trash"
                  disabled={_.isEmpty(this.state.checkedIds)}
                  onClick={this.handleDeleteSelected}
                />
              </Tooltip>
            )}

            {!this.props.readOnly && (
              <Tooltip content={lang.tr('studio.content.cloneElements')} position={Position.BOTTOM}>
                <AnchorButton
                  id="btn-duplicate"
                  icon="duplicate"
                  disabled={_.isEmpty(this.state.checkedIds)}
                  onClick={this.handleCloneSelected}
                />
              </Tooltip>
            )}
            <Divider />
            <InputGroup
              id="input-search"
              style={{ marginTop: 3, width: 250 }}
              placeholder={lang.tr('studio.content.searchContent')}
              small
              value={this.state.searchTerm}
              onChange={this.handleSearchChanged}
            />
          </LeftToolbarButtons>
          {/*
          Disabled for now, it still needs a little bit more testing with additional scenarios.
          <RightToolbarButtons>
            <ImportModal onImportCompleted={this.onImportCompleted} />
            <Button
              id="btn-export"
              icon="upload"
              text="Export to JSON"
              onClick={this.downloadJson}
              style={{ marginLeft: 5 }}
            />
          </RightToolbarButtons> */}
        </Toolbar>
        <div style={{ padding: 5 }}>{this.renderTable()}</div>
        <UsageModal
          usage={this.state.contentUsage}
          handleClose={() => this.setState({ showUsageModal: false })}
          isOpen={this.state.showUsageModal}
        />
      </div>
    )
  }
}
export default withLanguage(ListView)

interface Props {
  count: number
  contentItems: any
  readOnly: boolean
  contentLang: string
  handleSearch: (query: SearchQuery) => void
  handleDeleteSelected: (ids: string[]) => void
  handleClone: (ids: string[]) => void
  handleRefresh: () => void
  handleEdit: (id: string, contentType: any) => void
  refreshCategories: () => void
}

interface State {
  page: number
  pageSize: number
  allChecked: boolean
  checkedIds: string[]
  searchTerm: string
  sortOrder: any
  filters: any
  tableHeight: number
  downloadUrl: string | undefined
  showUsageModal: boolean
  contentUsage: ContentUsage[]
}

interface SearchQuery {
  from: number
  count: number
  sortOrder: any
  filters: any
  searchTerm: string
}
