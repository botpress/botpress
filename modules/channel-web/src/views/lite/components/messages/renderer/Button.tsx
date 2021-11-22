import React, { Component } from 'react'

import { HTMLInputEvent, Renderer } from '../../../typings'

import { FileInput } from './FileInput'

/**
 * A simple button, with a possibility to be used as a file upload button
 *
 * @param {object} buttons The list of buttons to display (object with a label and a payload)
 * @param {function} onButtonClicked Called when the button is clicked with the label and the payload
 * @param {function} onFileUpload This is called when a file is uploaded
 */
export class Button extends Component<Renderer.Button> {
  constructor(props) {
    super(props)
  }

  handleButtonClick = e => {
    if (this.props.preventDoubleClick) {
      e.target.disabled = true
    }

    this.props.onButtonClick?.(this.props.label, this.props.payload)
  }

  handleFileUpload = (event: HTMLInputEvent) => {
    if (!event.target.files) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.props.onFileUpload?.(this.props.label, this.props.payload, event.target.files[0])
  }

  renderFileUpload(accept) {
    return (
      <button className={'bpw-button bpw-file-button'}>
        <FileInput
          name={'uploadField'}
          accept={accept}
          className={'bpw-file-message'}
          placeholder={this.props.label}
          onFileChanged={this.handleFileUpload}
        />
        <span>{this.props.label}</span>
      </button>
    )
  }

  render() {
    if (this.props.payload === 'BOTPRESS.IMAGE_UPLOAD') {
      return this.renderFileUpload('image/*')
    }

    if (this.props.payload === 'BOTPRESS.FILE_UPLOAD') {
      return this.renderFileUpload('*/*')
    }

    return (
      <button className={'bpw-button'} onClick={this.handleButtonClick}>
        {this.props.label}
      </button>
    )
  }
}
