
import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'

import List from './list'
import Manage from './manage'
import CreateModal from './modal'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

const style = require('./style.scss')

export default class ContentView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      showModal: false
    }
  }

  componentDidMount() {
    this.fetchAllCategoriesMessages()
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
      this.setState({
        categories: data
      })
    })
  }

  fetchAllCategoriesMessages() {
    return axios.get('/content/categories/all/items')
    .then(({ data }) => {
      this.setState({
        messages: data
      })
    })
  }

  fetchCategoryMessages(id) {
    return axios.get('/content/categories/' + id + '/items')
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
    .then(() => { return this.fetchCategoryMessages(this.state.selectedId) })
    .then(() => { this.setState({ showModal: false } ) })
  }

  handleCategorySelected(id) {
    this.fetchCategoryMessages(id)
    .then(() => { this.setState({ selectedId: id }) })    
  }

  handleDeleteSelected(ids) {
    this.deleteItems(ids)
    .then(() => { return this.fetchCategoryMessages(this.state.selectedId) })
  }

  handleRefresh() {
    this.fetchCategoryMessages(this.state.selectedId || 'all')
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
                  messages={this.state.messages || []}
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
