import React, { Component } from 'react'
import CodeMirror from 'react-codemirror'
import _ from 'lodash'

import classnames from 'classnames'

const style = require('./style.scss')

require('codemirror/lib/codemirror.css')
require('codemirror/theme/zenburn.css')
require('codemirror/mode/yaml/yaml')

const LAST_LINE_REGEX = /^(.+):/
const REFRESH_INTERVAL = 2000 // 2seconds
const TIME_EDITING = 3000 // 3seconds
const ANIM_TIME = 500
const WAIT_TIME = 2000

export default class CodeView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      lastEditTime: null
    }

    this.codeMirror = null
    this.timer = null

    this.isEditing = this.isEditing.bind(this)
  }

  componentDidMount() {
    setTimeout(() => this.refreshPositionAdjustments(), WAIT_TIME)

    this.timer = setInterval(() => {
      if (!this.isEditing() && this.props.code !== this.state.lastCode) {
        this.props.setLoading(true)
        setTimeout(() => this.refreshPositionAdjustments(), ANIM_TIME)
      }
    }, REFRESH_INTERVAL)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  isEditing() {
    if (!this.state.lastEditTime) {
      return false
    }

    const timeSinceLastEdit = Date.now() - this.state.lastEditTime
    return timeSinceLastEdit <= TIME_EDITING
  }

  refreshPositionAdjustments() {
    return this.getBlockDivs()
    .then(::this.getLastLines)
    .then(::this.getLineDivs)
    .then(::this.setHeights)
    .then(() => {
      this.setState({
        lastCode: this.props.code
      })
      this.props.setLoading(false)
    })
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
            numberOfRows: index - beginIndex + 1,
            beginIndex: beginIndex,
            endIndex: index
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

  setHeight(line, block, i, rows) {
    const rowHeight = 20

    let linesHeight = 0
    for (let k = line.beginIndex; k <= line.endIndex; k++) {
      linesHeight += rows[k].clientHeight
    }

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
    let marginBottom = linesHeight + (numberOfRowToAdd * rowHeight) - (blockHeight)
    
    if (blockHeight <= 20) {
      marginBottom = 0
    }

    block.setAttribute('style', 'margin-bottom: ' + marginBottom + 'px;')
  }

  setHeights() {
    const rows = document.getElementsByClassName('CodeMirror-line')
    
    return new Promise((resolve, reject) => {
      _.forEach(this.state.lineDivs, (line, i) => {

        const block = this.state.blockDivs[i]
        
        if (!this.props.error && block) {
          this.setHeight(line, block, i, rows)
        }
      })

      return resolve()
    })
  }

  handleCodeChanged(event) {
    this.props.update(event)

    this.setState({
      lastEditTime: Date.now()
    })
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

