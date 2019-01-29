import { get } from 'lodash'
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

export class InputElement extends React.Component {
  elementInputRef = React.createRef()

  state = {
    error: undefined
  }

  get inputValue() {
    return get(this.elementInputRef, 'current.value', '')
  }

  get inputNotEmpty() {
    return this.inputValue.length > 0
  }

  handleOnEnter = event => {
    if (event.key === 'Enter' && this.inputNotEmpty) {
      this.tryAddElement(this.inputValue)
    }
  }

  handleOnBlur = _event => {
    if (this.inputNotEmpty && this.inputNotEmpty) {
      this.tryAddElement()
    }
  }

  tryAddElement = () => {
    const elementUnique = !this.props.elements.includes(this.inputValue)
    if (!this.inputNotEmpty || !elementUnique) {
      return this.setState({ error: new Error('The element must be unique and cannot be an empty string.') })
    }

    const value = this.inputValue // make a copy because of async
    this.setState({ error: undefined }, () => this.props.onElementAdd(value))

    if (this.props.cleanInputAfterEnterPressed) {
      this.elementInputRef.current.value = ''
    }
  }

  render() {
    return (
      <React.Fragment>
        <input
          autoFocus
          className={classnames('form-control', (this.state.error || this.props.invalid) && style.inputError)}
          ref={this.elementInputRef}
          type="text"
          placeholder={this.props.placeholder || ''}
          defaultValue={this.props.defaultValue || ''}
          onBlur={this.handleOnBlur}
          onKeyDown={this.handleOnEnter}
        />
        {this.state.error && <div>{this.state.error.message}</div>}
      </React.Fragment>
    )
  }
}
