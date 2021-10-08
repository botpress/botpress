import React, { Component, MouseEvent } from 'react'
import { FileUploadHandler } from '../typings'

import { FileInput } from './FileInput'

interface Props {
  label: string
  payload: any
  onFileUpload: FileUploadHandler
  preventDoubleClick?: boolean
  onButtonClick?: (label: string, payload: any) => void
  onUploadError?: (error: any) => void
}

/**
 * A simple button, with a possibility to be used as a file upload button
 *
 * @param {object} buttons The list of buttons to display (object with a label and a payload)
 * @param {function} onButtonClicked Called when the button is clicked with the label and the payload
 * @param {function} onFileUpload This is called when a file is uploaded
 */
export class Button extends Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (this.props.preventDoubleClick || true) {
      ;(e.target as HTMLButtonElement).disabled = true
    }

    this.props.onButtonClick?.(this.props.label, this.props.payload)
  }

  handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return
    }
    try {
      await this.props.onFileUpload(this.props.label, this.props.payload, event.target.files[0])
    } catch (err) {
      console.error('File upload error: ', err)
      this.props.onUploadError?.(err)
    }
  }

  renderFileUpload(accept: string) {
    return (
      <button className={'bpw-button'}>
        <span>{this.props.label}</span>
        <FileInput
          name={'uploadField'}
          accept={accept}
          className={'bpw-file-message'}
          placeholder={this.props.label}
          onFileChanged={this.handleFileUpload}
        />
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
