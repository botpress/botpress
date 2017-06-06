
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

const REFRESH_TIME_PREVIEW = 3 * 1000 // 3 seconds
const CONTEXT = require('./context.js')

export default class UMMView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }

    this.throttled = _.throttle(this.simulate, REFRESH_TIME_PREVIEW, { 'trailing': false })
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
        hashCode: data.content,
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
        templates: data.templates
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
        error: null,
        blocks: data
      })
    })
    .catch((err) => {
      this.setState({
        error: err.response.data.message
      })
    })
  }

  refreshPreview() {
    return _.throttle(this.simulate, REFRESH_TIME_PREVIEW)
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

  handleSelectedPlatformChanged(event) {
    this.setState({
      selectedPlatform: event.target.value
    })
  }

  handleDocumentChanged(code) {
    this.setState({
      code: code
    })

    const editor = document.getElementsByClassName('CodeMirror')[0].CodeMirror
    const positions = editor.getCursor()
    editor.setValue(code)
    editor.setCursor(positions)

    this.throttled()
  }

  handleAddTemplateToDocument(template) {
    const code = this.state.code + "\n\n" + template
    this.setState({
      code: code
    })

    const editor = document.getElementsByClassName('CodeMirror')[0].CodeMirror
    editor.setValue(code)

    this.throttled()
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

    const hasChanged = this.state.hashCode && (this.state.hashCode !== this.state.code)

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
                  templates={this.state.templates}
                  error={this.state.error}
                  add={::this.handleAddTemplateToDocument} />
              </td>
              <td style={{ 'width': '40%' }}>
                <Platform 
                  selected={this.state.selectedPlatform}
                  platforms={this.state.supportedPlatforms} 
                  update={::this.handleSelectedPlatformChanged}
                  save={::this.handleSave}
                  changed={hasChanged}/>
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
                  erro={this.state.error}
                  code={this.state.code}
                  update={::this.handleDocumentChanged} />
              </td>
              <td>
                <Preview
                  blocks={this.state.blocks} />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
