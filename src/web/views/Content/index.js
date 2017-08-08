
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
    this.setState({
      loading: false
    })
  }

  handleAdd() {
    console.log('ADD')
  }

  handleCatogorySelected(name) {
    console.log('SELECTED: ', name)
    
    this.setState({
      selected: name
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
