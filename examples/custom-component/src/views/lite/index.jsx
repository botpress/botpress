import React from 'react'

// This component will display a drop down menu with a button, and will show something else when the conversation continues
export { DropdownMenu } from './components/DropdownMenu'

// Display a basic login form
export { LoginForm } from './components/LoginForm'

// This is an example on how to replace the webchat composer (the typing zone)
export { Composer } from './components/Composer'

export { DisappearingText, FeedbackButtons, UpperCase, ColorText } from './components/Advanced'

export class InjectedBelow extends React.Component {
  render() {
    // Return null if you just want to interact with the chat.
    return null

    // Or you can add special content like:
    // return (
    //   <div style={{ align: 'center' }}>
    //     <small>Injected below chat</small>
    //   </div>
    // )
  }
}

export class UpperCasedText extends React.Component {
  render() {
    return <div>{this.props.text && this.props.text.toUpperCase()}</div>
  }
}
