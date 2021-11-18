import React from 'react'

import { Renderer } from '../../../typings'

export class FileInput extends React.Component<Renderer.FileInput> {
  state = {
    value: ''
  }

  handleFilChanged = e => {
    this.setState({ value: e.target.value.split(/(\\|\/)/g).pop() })
    this.props.onFileChanged && this.props.onFileChanged(e)
  }

  render() {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type={'file'}
          name={this.props.name}
          className={this.props.className}
          onChange={this.handleFilChanged}
          accept={this.props.accept}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            padding: 0,
            width: '100%',
            height: '40px',
            fontSize: '0px',
            cursor: 'pointer',
            zIndex: 100
          }}
        />
        <input
          type={'text'}
          tabIndex={-1}
          name={this.props.name + '_filename'}
          className={this.props.className}
          onChange={() => {}}
          placeholder={this.props.placeholder}
          disabled={this.props.disabled}
          style={{
            position: 'absolute',
            zIndex: -1,
            width: '100%',
            top: 0,
            left: 0
          }}
        />
      </div>
    )
  }
}
