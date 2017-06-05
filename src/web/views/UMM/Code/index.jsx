import React, { Component } from 'react'
import CodeMirror from 'react-codemirror'
import _ from 'lodash'

import classnames from 'classnames'

const style = require('./style.scss')

require('codemirror/lib/codemirror.css')
require('codemirror/theme/zenburn.css')
require('codemirror/mode/yaml/yaml')

const LAST_LINE_REGEX = /^.+:/

export default class CodeView extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.getBlockHeights()
    .then(::this.getBlockLines)
    .then(::this.getCorrespondingDiv)
    .then(::this.setHeightLastLines)
  }

  getBlockHeights() {
    return new Promise((resolve, reject) => {
      const blocks = document.getElementsByClassName('bp-umm-block')
      const blockHeights = []
      _.forEach(blocks, (block) => {
        blockHeights.push(block.clientHeight)
      })

      this.setState({
        blockHeights: blockHeights
      })

      return resolve()
    })
  }

  getBlockLines() {
    return new Promise((resolve, reject) => {
      const lines = []
      _.forEach(this.props.code.split('\n'), (line, i) => {
        if (LAST_LINE_REGEX.test(line)) {
          lines.push(i)
        }
      })

      this.setState({
        lastLines: lines
      })

      return resolve()
    })
  }

  getCorrespondingDiv() {
    const lineDivs = document.getElementsByClassName('CodeMirror-line')

    return new Promise((resolve, reject) => {
      const lastLineDivs = []

      _.forEach(this.state.lastLines, (i) => {
        if (i !== 0) {
          lastLineDivs.push(lineDivs[i - 1])
        }
      })

      this.setState({
        lastLineDivs: lastLineDivs
      })

      return resolve()
    })
  }

  setHeightLastLines() {
    return new Promise((resolve, reject) => {
      _.forEach(this.state.lastLineDivs, (line) => {
        line.setAttribute('style', 'background-color:red; border: 1px solid blue;')
      })

      return resolve()
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
      indentUnit: 1,
      tabSize: 1,
      scrollbarStyle: null
    }

    return <CodeMirror 
      className={classNames}
      value={this.props.code}
      onChange={this.props.update}
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

