import React from 'react'
import ReactDOM from 'react-dom'

import { Alert, Button } from 'react-bootstrap'

export default class DismissableAlert extends React.Component {
  state = { alertVisible: true }

  render() {
    const dismiss = () => this.setState({ alertVisible: false })
    if (this.state.alertVisible) {
      return (
        <Alert bsStyle="danger" onDismiss={dismiss}>
          <h4>An error occured sending a broadcast</h4>
          <p>Have a look at the logs to see what hapenned</p>
          <p>
            <Button onClick={dismiss}>Hide Alert</Button>
          </p>
        </Alert>
      )
    }

    return null
  }
}
