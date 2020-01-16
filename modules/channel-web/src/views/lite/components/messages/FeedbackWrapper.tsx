import _ from 'lodash'
import React, { Component } from 'react'

type props = {
  show: boolean
  onFeedback: Function
}

export class FeedbackWrapper extends Component<props> {
  state = {
    feedbackSent: false
  }

  handleSendFeedback = rating => {
    this.props.onFeedback(rating)
    this.setState({ feedbackSent: true })
  }

  render() {
    if (this.props.show && !this.state.feedbackSent) {
      return (
        <React.Fragment>
          {this.props.children}
          <div className="bpw-message-feedback">
            <span onClick={() => this.handleSendFeedback(1)}>👍</span>
            <span onClick={() => this.handleSendFeedback(-1)}>👎</span>
          </div>
        </React.Fragment>
      )
    }

    return <React.Fragment>{this.props.children}</React.Fragment>
  }
}
