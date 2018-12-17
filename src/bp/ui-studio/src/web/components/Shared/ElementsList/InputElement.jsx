import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

export class InputElement extends React.Component {
  elementInputRef = React.createRef()

  state = {
    error: undefined
  }

  onEnter = value => {
    this.props.onEnter(value)
  }

  handleOnEnter = event => {
    const inputValue = event.target.value
    const enterKeyPressed = event.keyCode === 13
    const inputNotEmpty = inputValue !== ''
    const elementUnique = !this.props.elements.includes(inputValue)

    if (enterKeyPressed) {
      if (inputNotEmpty && elementUnique) {
        this.setState({ error: undefined }, () => this.onEnter(inputValue))
        if (this.props.eraseValue) {
          this.elementInputRef.current.value = ''
        }
      } else {
        this.setState({ error: new Error('The element must be unique and cannot be an empty string.') })
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        <input
          autoFocus
          className={classnames('form-control', this.state.error && style.inputError)}
          ref={this.elementInputRef}
          type="text"
          placeholder={this.props.placeholder || ''}
          defaultValue={this.props.defaultValue || ''}
          onKeyDown={this.handleOnEnter}
        />
        {this.state.error && <div>{this.state.error.message}</div>}
      </React.Fragment>
    )
  }
}
