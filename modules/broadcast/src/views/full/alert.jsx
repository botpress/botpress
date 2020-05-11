import React from 'react'

import { Callout, Button, Intent } from '@blueprintjs/core'
import style from './style.scss'

export default class DismissableAlert extends React.Component {
  state = { alertVisible: true }

  render() {
    const dismiss = () => this.setState({ alertVisible: false })
    if (this.state.alertVisible) {
      return (
        <Callout title="An error occurred sending a broadcast" intent={Intent.DANGER} onDismiss={dismiss}>
          <p>Have a look at the logs to see what happened</p>
          <p>
            <Button intent={Intent.DANGER} onClick={dismiss} text="Hide Alert" />
          </p>
        </Callout>
      )
    }

    return null
  }
}
