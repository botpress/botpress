import React from 'react'

import style from './style.scss'

export default class Typing extends React.Component {
  constructor() {
    super()

    this.state = {
      message: ''
    }
  }

  handleChange = (event) => {
    this.setState({
      message: event.target.value
    })
  }

  handleKeyPress = (event) => {
    if (event.key === 'Enter' && this.state.message) {
      this.props.sendMessage(this.state.message)
      event.preventDefault()
      this.setState({
        message: ''
      })
      return false
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
