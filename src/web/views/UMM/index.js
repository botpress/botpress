
import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'
import { Grid, Row, Col, Panel } from 'react-bootstrap'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import Search from './Search'
import List from './List'
import Actions from './Actions'
import Code from './Code'
import Platform from './Platform'
import Preview from './Preview'

const style = require('./style.scss')

const REFRESH_TIME_PREVIEW = 2 * 1000 // 2 seconds
const CONTEXT = require('./context.js')

export default class UMMView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    this.fetchCode()
    .then(::this.fetchPlatforms)
    .then(::this.fetchTemplates)
    .then(::this.simulate)
    .then(() => {
      this.setState({
        loading: false
      })
    })
  }

  fetchCode() {
    return axios.get('/umm/blocs')
    .then(({ data }) => {
      this.setState({
        code: data.content
      })
    })  
  }

  fetchPlatforms() {
    return axios.get('/umm/platforms')
    .then(({ data }) => {
      this.setState({
        selectedPlatform: data.platforms[0] || null,
        supportedPlatforms: data.platforms
      })
    })
  }

  fetchTemplates() {
    return axios.get('/umm/templates')
    .then(({ data }) => {
      this.setState({
        template: data.templates
      })
    })
  }

  simulate() {
    return axios.post('/umm/simulate', {
      content: this.state.code,
      outputPlatform: this.state.selectedPlatform,
      context: CONTEXT,
      incomingEvent: CONTEXT
    })
    .then(({ data }) => {
      this.setState({
        blocks: data
      })
    })
  }

  refreshPreview() {
    _.throttle(this.simulate, REFRESH_TIME_PREVIEW)
  }

  handleSearchChanged(search) {
    this.setState({
      search: search
    })
  }

  handleSelectedBlockChanged(block) {
    this.setState({
      selectedBlock: block
    })
  }

  handleSelectedPlatformChanged(platform) {
    this.setState({
      selectedPlatform: platform
    })
  }

  handleDocumentChanged(code) {
    this.setState({
      code: code
    })
  }

  handleSave() {
    this.setState({
      loading: true
    })

    return axios.post('/umm/blocs', {
      content: this.state.code
    })
    .then(::this.simulate)
    .then(() => {
      this.setState({
        loading: false
      })
    })
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
        <PageHeader><span>Universal Message Markdown</span></PageHeader>
        <table className={classNames}>
          <tbody>
            <tr>
              <td style={{ 'width': '20%' }}>
                <Search search={this.state.search} update={::this.handleSearchChanged}/>
              </td>
              <td style={{ 'width': '40%' }}>
                <Actions 
                  templates={this.state.templates} />
              </td>
              <td style={{ 'width': '40%' }}>
                <Platform 
                  selected={this.state.selectedPlatform}
                  platforms={this.state.supportedPlatforms} 
                  update={::this.handleSelectedPlatformChanged}
                  save={::this.handleSave}/>
              </td>
            </tr>
            <tr>
              <td>
                <List
                  blocks={this.state.blocks} 
                  search={this.state.search}
                  selected={this.state.selectedBlock}
                  update={::this.handleSelectedBlockChanged} />
              </td>
              <td>
                <Code 
                  code={this.state.code}
                  update={::this.handleDocumentChanged} />
              </td>
              <td>
                <Preview
                  block={this.state.blocks} />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
