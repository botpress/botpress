import React from 'react'

import style from './style.scss'

export default class Typing extends React.Component {
  constructor() {
    super()

    this.state = {
      message: ''
    }
  }

  handleChange = event => {
    this.setState({
      message: event.target.value
    })
  }

  handleKeyPress = event => {
    if (this.state.message) {
      const message = this.state.message.trim()

      if (event.key === 'Enter' && message.length > 0) {
        this.props.sendMessage(message)
        event.preventDefault()
        this.setState({
          message: ''
        })
        return false
      }
    }
  }

  render() {
    return (
      <div className={style.typing}>
        <textarea value={this.state.message} onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
      </div>
    )
  }
}
