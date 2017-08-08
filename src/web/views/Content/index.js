
import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'

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
                <h3>Title 1</h3>
              </td>
              <td style={{ 'width': '80%' }}>
                <h3>Title 2</h3>
              </td>
            </tr>
            <tr>                
              <td>
                <h2>Section 1</h2>
              </td>
              <td>
                <h2>Section 2</h2>
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
