
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

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

const REFRESH_TIME_PREVIEW = 1000
const CONTEXT = require('./context.js')

export default class UMMView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      previewLoading: true,
      refresh: false
    }

    this.throttled = _.throttle(this.simulate, REFRESH_TIME_PREVIEW)
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

  highlightAndMoveTo(cm, value) {
    const res = cm.getSearchCursor(value, { line: 0, ch: 0 })
    res.findNext()
    cm.getDoc().setSelection(res.from(), res.to())
  }

  handleSearchChanged(search) {
    this.setState({
      search: search
    })
  }

  handleSelectedBlockChanged(block) {
    const editor = document.getElementsByClassName('CodeMirror')[0]
    const cm = editor.CodeMirror

    this.highlightAndMoveTo(cm, block)

    this.setState({
      selectedBlock: block
    })
  }

  handleSelectedPlatformChanged(event) {
    this.setState({
      selectedPlatform: event.target.value
    })

    this.setState({
      previewLoading: true
    })

    setTimeout(() => {
      this.throttled()
      this.setState({
        previewLoading: false,
        refresh: true
      })
    }, 300)
    
  }

  handleDocumentChanged(code) {
    this.setState({
      code: code
    })

    const editor = document.getElementsByClassName('CodeMirror')[0]
    if (editor) {
      const cm = editor.CodeMirror

      const positions = cm.getCursor()
      cm.setValue(code)
      cm.setCursor(positions)

      this.throttled()
    }
  }

  handleAddTemplateToDocument(template) {
    const code = this.state.code + '\n' + template + '\n'
    this.setState({
      code: code
    })

    const editor = document.getElementsByClassName('CodeMirror')[0]
    
    if (editor) {
      const cm = editor.CodeMirror
      cm.setValue(code)

      setImmediate(() => {
        this.throttled()
        
        this.highlightAndMoveTo(cm, template)
        const node = ReactDOM.findDOMNode(this.end)
        node.scrollIntoView({ behavior: "smooth" })
      })
    }
  }

  handleSave() {
    return axios.post('/umm/blocs', {
      content: this.state.code
    })
    .then(() => {
      this.setState({
        hashCode: this.state.code
      })
    })
  }

  handlePreviewLoading() {
    this.setState({
      previewLoading: true
    })
  }

  handlePreviewLoaded() {
    this.setState({
      previewLoading: false
    })
  }

  handleResetRefresh() {
    this.setState({
      refresh: false
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
              <td style={{ width: '20%' }}>
                <Search search={this.state.search} update={::this.handleSearchChanged}/>
              </td>
              <td style={{ width: '40%' }}>
                <Actions 
                  templates={this.state.templates}
                  error={this.state.error}
                  add={::this.handleAddTemplateToDocument} />
              </td>
              <td style={{ width: '40%' }}>
                <Platform 
                  selected={this.state.selectedPlatform}
                  platforms={this.state.supportedPlatforms} 
                  update={::this.handleSelectedPlatformChanged}
                  save={::this.handleSave}
                  changed={hasChanged}/>
              </td>
            </tr>
            <tr>
              <td style={{ width: '20%' }}>
                <List
                  blocks={this.state.blocks} 
                  search={this.state.search}
                  selected={this.state.selectedBlock}
                  update={::this.handleSelectedBlockChanged} />
              </td>
              <td style={{ width: '40%' }} className={classnames(style.tdCode, 'bp-umm-td-code')}>
                <Code 
                  erro={this.state.error}
                  code={this.state.code}
                  shouldRefresh={this.state.refresh}
                  resetRefresh={::this.handleResetRefresh}
                  update={::this.handleDocumentChanged}
                  onLoading={::this.handlePreviewLoading}
                  onLoaded={::this.handlePreviewLoaded} />
                <div ref={(e) => { this.end = e }} />
              </td>
              <td style={{ width: '40%' }}>
                <Preview
                  blocks={this.state.blocks}
                  loading={this.state.previewLoading} />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentWrapper>
    )
  }
}
