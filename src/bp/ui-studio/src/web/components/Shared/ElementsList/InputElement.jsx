import { get } from 'lodash'
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

const DEFAULT_ROW_HEIGHT = 32

export class InputElement extends React.Component {
  elementInputRef = React.createRef()

  state = {
    rowHeight: DEFAULT_ROW_HEIGHT,
    error: undefined,
    text: ''
  }

  componentDidMount() {
    this.setState({ text: this.props.defaultValue }, this.updateTextareaHeight)
  }

  get inputNotEmpty() {
    return this.state.text && this.state.text.trim().length > 0
  }

  handleKeyDown = event => {
    if (event.key === 'Enter') {
      if (event.altKey && this.props.allowMultiline) {
        this.setState({ text: this.state.text + '\n' }, this.updateTextareaHeight)
      } else if (!event.altKey && this.inputNotEmpty) {
        this.tryAddElement()
      }

      event.preventDefault()
    }
  }

  handleOnChange = event => {
    this.setState({ text: event.target.value }, this.updateTextareaHeight)
  }

  updateTextareaHeight = () => {
    this.setState({ rowHeight: this.elementInputRef.current.scrollHeight })
  }

  handleOnBlur = _event => {
    this.inputNotEmpty && this.tryAddElement()
  }

  tryAddElement = () => {
    const elementUnique = !this.props.elements.includes(this.state.text)
    if (!this.inputNotEmpty || !elementUnique) {
      return this.setState({ error: new Error('The element must be unique and cannot be an empty string.') })
    }

    const value = this.state.text // make a copy because of async
    this.setState({ error: undefined }, () => this.props.onElementAdd(value))

    if (this.props.cleanInputAfterEnterPressed) {
      this.setState({ text: '', rowHeight: DEFAULT_ROW_HEIGHT })
    }
  }

  render() {
    return (
      <React.Fragment>
        <textarea
          autoFocus
          className={classnames('form-control', style.inputArea, {
            [style.inputError]: this.state.error || this.props.invalid
          })}
          ref={this.elementInputRef}
          style={{ height: this.state.rowHeight }}
          value={this.state.text}
          placeholder={this.props.placeholder || ''}
          onBlur={this.handleOnBlur}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleOnChange}
        />
        {this.state.error && <div>{this.state.error.message}</div>}
      </React.Fragment>
    )
  }
}
