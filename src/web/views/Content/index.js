
import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'

import List from './list'
import Manage from './manage'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

const style = require('./style.scss')

export default class ContentView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    this.fetchAllCategoriesMessages()
    .then(::this.fetchCategories)
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
    return axios.post('/content/categories/' + id + '/items', data)
    .then(res => {
      console.log('POST: New item created...')
      console.log(res)
    })
  }


  deleteItems(data) {
    return axios.delete('/content/categories/all/items', data)
    .then(res => {
      console.log('DELETE: Array of ids deleted...')
      console.log(res)
    })
  } 

  handleAdd() {
    console.log('ADD')
  }

  handleCategorySelected(id) {
    console.log('SELECTED: ', id)

    this.setState({
      selected: id
    })

    this.fetchCategory(id)
  }

  handleDeleteSelected(ids) {
    console.log('DELETE: ', ids)
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
                  handleAdd={::this.handleAdd}
                  handleCategorySelected={::this.handleCategorySelected} />
              </td>
              <td style={{ 'width': '80%' }}>
                <Manage 
                  items={this.state.items || []}
                  handleDeleteSelected={::this.handleDeleteSelected} />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
