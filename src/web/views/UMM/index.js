import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import Search from './Search'
import List from './List'
import Actions from './Actions'
import Code from './Code'
import Platform from './Platform'
import Preview from './Preview'

import { Grid, Row, Col, Panel } from 'react-bootstrap'

const style = require('./style.scss')

const REFRESH_TIME_PREVIEW = 2 * 1000 // 2 seconds

export default class UMMView extends Component {
  state = {
    loading: true
  }

  componentDidMount() {
    this.setState({
      loading: false
    })

    // this.fetchListOfTools()
    // .then(this.fetchBlocks)
    // .then(() => {
    //   this.setState({
    //     loading: false
    //   })
    // })
  }

  fetchListOfTools() {
    return axios.get('/api/umm/tools').then(res => {
      this.setState({
        tools: res.data
      })
    })
  }

  fetchBlocks() {
    const document = ''
    const platform = 'messenger'

    return axios.post('/api/umm/preview', { document, platform }).then(res => {
      this.setState({
        ...res.data
      })
    })
  }

  refreshPreview() {
    _.throttle(this.fetchBlocks, REFRESH_TIME_PREVIEW)
  }

  render() {
    if (this.state.loading) {
      return null
    }

    const classNames = classnames({
      [style.umm]: true,
      'bp-umm': true
    })

    return (
      <ContentWrapper>
        <PageHeader>
          <span>Universal Message Markdown</span>
        </PageHeader>
        <table className={classNames}>
          <tbody>
            <tr>
              <td style={{ width: '20%' }}>
                <Search />
              </td>
              <td style={{ width: '40%' }}>
                <Actions />
              </td>
              <td style={{ width: '40%' }}>
                <Platform />
              </td>
            </tr>
            <tr>
              <td>
                <List />
              </td>
              <td>
                <Code />
              </td>
              <td>
                <Preview />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
