import React, { Component } from 'react'
import CodeMirror from 'react-codemirror'
import _ from 'lodash'

import classnames from 'classnames'

const style = require('./style.scss')

require('codemirror/lib/codemirror.css')
require('codemirror/theme/zenburn.css')
require('codemirror/mode/yaml/yaml')

const LAST_LINE_REGEX = /^(.+):/

export default class CodeView extends Component {
  constructor(props) {
    super(props)

    this.codeMirror = null
  }

  componentDidMount() {
    this.refreshAdjustments()
  }

  refreshAdjustments() {
    this.getBlockDivs()
    .then(::this.getLastLines)
    .then(::this.getLineDivs)
    .then(::this.setHeights)
  }

  getBlockDivs() {
    return new Promise((resolve, reject) => {
      const blocks = document.getElementsByClassName('bp-umm-block')

      this.setState({
        blockDivs: blocks
      })

      return resolve()
    })
  }

  getLastLines() {
    return new Promise((resolve, reject) => {
      const lines = []
      _.forEach(this.props.code.split('\n'), (line, i) => {
        if (LAST_LINE_REGEX.test(line)) {
          const contentNext = line.match(LAST_LINE_REGEX)[1]

          lines.push({ 
            index: i,
            contentNext: contentNext 
          })
        }
      })

      this.setState({
        lastLines: lines
      })

      return resolve()
    })
  }

  getLineDivs() {
    const lines = document.getElementsByClassName('CodeMirror-line')
    let beginIndex = 0

    return new Promise((resolve, reject) => {
      const lineDivs = []

      _.forEach(this.state.lastLines, (last) => {
        if (last.index !== 0) {
          const index = last.index - 1

          lineDivs.push({
            lastLine: lines[index],
            numberOfRows: index - beginIndex + 1
          })

          beginIndex = index + 1
        }
      })

      this.setState({
        lineDivs: lineDivs
      })

      return resolve()
    })
  }

  setHeight(line, block, i, rowHeight) {
    const linesHeight = rowHeight * line.numberOfRows
    const blockHeight = block.clientHeight

    let numberOfRowToAdd = Math.floor((blockHeight - linesHeight) / rowHeight) + 1

    if (linesHeight <= blockHeight) {

      let toAdd = ""
      
      for (let count = 0; count < numberOfRowToAdd; count++) {
        toAdd += "\n"
      }

      const content = this.state.lastLines[i + 1].contentNext
      const code = this.props.code.replace(content, toAdd + content)
      this.props.update(code)
    }

    numberOfRowToAdd = numberOfRowToAdd > 0 ? numberOfRowToAdd : 0
    const marginBottom = ((line.numberOfRows + numberOfRowToAdd) * rowHeight) - (blockHeight)
    
    block.setAttribute('style', 'margin-bottom: ' + marginBottom + 'px;')
  }

  setHeights() {
    const row = document.getElementsByClassName('CodeMirror-line')[0]
    let rowHeight = 0
    
    if (row) {
      rowHeight = row.clientHeight
    }
    
    return new Promise((resolve, reject) => {
      _.forEach(this.state.lineDivs, (line, i) => {

        const block = this.state.blockDivs[i]
        
        if (!this.props.error && block) {
          this.setHeight(line, block, i, rowHeight)
        }
      })

      return resolve()
    })
  }

  handleCodeChanged(event) {
    this.props.update(event)
    this.refreshAdjustments()
  }

  renderEditor() {
    const classNames = classnames({
      [style.editor]: true,
      'bp-umm-editor': true
    })

    const options = {
      theme: 'zenburn',
      mode: 'yaml',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 1,
      tabSize: 1,
      showInvisibles: true,
      scrollbarStyle: null
    }

    return <CodeMirror 
      className={classNames}
      value={this.props.code}
      onChange={::this.handleCodeChanged}
      options={options} />
  }

  render() {
    const classNames = classnames({
      [style.code]: true,
      'bp-umm-code': true
    })

    return <div className={classNames}>
        {this.renderEditor()}
      </div>
  }
}

