import React, { Component } from 'react'

import CodeMirror from 'react-codemirror'

import classnames from 'classnames'

const style = require('./style.scss')

require('codemirror/lib/codemirror.css')
require('codemirror/theme/zenburn.css')
require('codemirror/mode/yaml/yaml')

export default class CodeView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      code: ''
    }
  }

  handleUpdateChange = newCode => {
    this.setState({
      code: newCode
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
      indentUnit: 2,
      tabSize: 2,
      scrollbarStyle: null
    }

    return (
      <CodeMirror className={classNames} value={this.state.code} onChange={this.handleUpdateChange} options={options} />
    )
  }

  render() {
    const classNames = classnames({
      [style.code]: true,
      'bp-umm-code': true
    })

    return <div className={classNames}>{this.renderEditor()}</div>
  }
}
