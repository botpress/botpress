
import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

import List from './list'
import Manage from './manage'
import CreateModal from './modal'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

const style = require('./style.scss')

const MESSAGES_PER_PAGE = 20

export default class ContentView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      showModal: false,
      selectedId: 'all',
      page: 1
    }
  }

  componentDidMount() {
    this.fetchCategoryMessages(this.state.selectedId)
    .then(::this.fetchCategories)
    .then(() => {
      return this.fetchSchema('trivia')
    })
    .then(() => {
      this.setState({
        loading: false
      })  
    })
  }

  fetchCategories() {
    return axios.get('/content/categories')
    .then(({ data }) => {
      const count = this.state.selectedId === 'all' 
        ? _.sumBy(data, 'count') || 0
        : _.find(data, { id: this.state.selectedId }).count

      this.setState({
        categories: data,
        count: count
      })
    })
  }

  fetchCategoryMessages(id) {
    const from = (this.state.page - 1) * MESSAGES_PER_PAGE
    const count = MESSAGES_PER_PAGE

    return axios.get('/content/categories/' + id + '/items?from=' + from + '&count=' + count)
    .then(({ data }) => {
      this.setState({
        messages: data
      })
    })
  }

  fetchSchema(id) {
    return axios.get('/content/categories/' + id + '/schema')
    .then(({ data }) => {
      this.setState({
        schema: data
      })
    })
  }

  createItem(data, id) {
    return axios.post('/content/categories/' + id + '/items', { formData: data })
    .then(res => {
      console.log('POST: New item created...')
      console.log(res)
    })
  }

  deleteItems(data) {
    return axios.post('/content/categories/all/bulk_delete', data)
    .then(res => {
      console.log('DELETE: Array of ids deleted...')
      console.log(res)
    })
  } 

  handleToggleModal() {
    this.setState({
      showModal: !this.state.showModal
    })
  }

  handleCreate(data) {
    this.createItem(data, this.state.selectedId)
    .then(::this.fetchCategories)
    .then(() => { return this.fetchCategoryMessages(this.state.selectedId) })
    .then(() => { this.setState({ showModal: false } ) })
  }

  handleCategorySelected(id) {
    this.fetchCategoryMessages(id)
    .then(() => { this.setState({ selectedId: id }) })    
  }

  handleDeleteSelected(ids) {
    this.deleteItems(ids)
    .then(::this.fetchCategories)
    .then(() => { return this.fetchCategoryMessages(this.state.selectedId) })
  }

  handleRefresh() {
    this.fetchCategoryMessages(this.state.selectedId || 'all')
  }

  handlePrevious() {
    this.setState({
      page: (this.state.page - 1) || 1
    })

    setImmediate(() => {
      this.fetchCategoryMessages(this.state.selectedId)
    })
  }

  handleNext() {
    this.setState({
      page: this.state.page + 1
    })

    setImmediate(() => {
      this.fetchCategoryMessages(this.state.selectedId)
    })
  }
 
  render() {
    if (this.state.loading) {
      return null
    }

    const classNames = classnames({
      [style.content]: true,
      'bp-content': true
    })

    return (
      <ContentWrapper>
        <PageHeader><span>Content Manager</span></PageHeader>
        <table className={classNames}>
          <tbody>
            <tr>
              <td style={{ 'width': '20%' }}>
                <List
                  categories={this.state.categories || []}
                  selectedId={this.state.selectedId || 'all'}
                  handleAdd={::this.handleToggleModal}
                  handleCategorySelected={::this.handleCategorySelected} />
              </td>
              <td style={{ 'width': '80%' }}>
                <Manage
                  page={this.state.page}
                  count={this.state.count}
                  messagesPerPage={MESSAGES_PER_PAGE}
                  messages={this.state.messages || []}
                  handlePrevious={::this.handlePrevious}
                  handleNext={::this.handleNext}
                  handleRefresh={::this.handleRefresh}
                  handleDeleteSelected={::this.handleDeleteSelected} />
              </td>
            </tr>
          </tbody>
        </table>
        <CreateModal 
          show={this.state.showModal}
          schema={(this.state.schema && this.state.schema.json) || {}}
          uiSchema={(this.state.schema && this.state.schema.ui) || {}}
          handleCreate={::this.handleCreate}
          handleClose={::this.handleToggleModal} />
      </ContentWrapper>
    )
  }
}
