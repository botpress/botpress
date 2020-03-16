import React from 'react'

export class DisappearingText extends React.Component {
  state = {
    visible: true
  }
  componentDidMount() {
    // Text disappear in 5 seconds. You can also get the date the message was sent by using this.props.sentOn
    setTimeout(() => {
      this.setState({ visible: false })
    }, 5000)
  }

  render() {
    const Keyboard = this.props.keyboard

    // Prepent to add something before the composer, and Append to add after
    return (
      <Keyboard.Prepend keyboard={this.props.myrandomproperty} visible={this.state.visible}>
        This text is always visible in the chat window
      </Keyboard.Prepend>
    )
  }
}

export class FeedbackButtons extends React.Component {
  sendSatisfied = () => {
    this.props.onSendData({ type: 'user_satisfied', text: 'satisfied' })
  }

  sendMoreInfo = () => {
    this.props.onSendData({ type: 'more_info', text: 'more info about ...' })
  }

  renderBtn() {
    return (
      <div>
        <button onClick={this.sendSatisfied}>I am satisfied</button>
        <button onClick={this.sendMoreInfo}>I need more info</button>
      </div>
    )
  }

  // This simple example will show two buttons after the bot's answer (only the latest one) asking for feedback
  render() {
    const Keyboard = this.props.keyboard
    return (
      <Keyboard.Append keyboard={this.renderBtn()} visible={this.props.isLastGroup}>
        {this.props.children}
      </Keyboard.Append>
    )
  }
}

export const ColorText = props => {
  return <div style={{ color: props.color }}>{props.children}</div>
}

export const UpperCase = props => {
  return <div style={{ textTransform: 'uppercase' }}>{props.children}</div>
}
