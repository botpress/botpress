
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
    .then(this.fetchCategories)
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

  fetchCategoryMessages(category) {
    return axios.get('/content/categories/' + category + '/items')
    .then(({ data }) => {
      this.setState({
        messages: data
      })
    })
  }

  fetchSchema(category) {
    return axios.get('/content/categories/' + category + '/schema')
    .then(({ data }) => {
      this.setState({
        schema: data
      })
    })
  }

  createItem(data, category) {
    return axios.post('/content/categories/' + category + '/items', data)
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

  handleCatogorySelected(name) {
    this.setState({
      selected: name
    })

    this.fetchCategory(name)
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
                  handleAdd={::this.handleAdd}
                  handleCategorySelected={::this.handleCategorySelected} />
              </td>
              <td style={{ 'width': '80%' }}>
                <Manage 
                  selected={this.state.selected} />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
