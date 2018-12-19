import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

export class InputElement extends React.Component {
  elementInputRef = React.createRef()

  state = {
    error: undefined
  }

  handleOnEnter = event => {
    const inputValue = event.target.value
    const inputNotEmpty = inputValue.trim() !== ''
    const elementUnique = !this.props.elements.includes(inputValue)

    if (event.key === 'Enter') {
      if (inputNotEmpty && elementUnique) {
        this.setState({ error: undefined }, () => this.props.onEnterPressed(inputValue))

        if (this.props.cleanInputAfterEnterPressed) {
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
          className={classnames('form-control', (this.state.error || this.props.invalid) && style.inputError)}
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
