import _ from 'lodash'
import React, { Component } from 'react'

type props = {
  show: boolean
  onFeedback: (rating: number) => Promise<void>
}

export class FeedbackWrapper extends Component<props> {
  state = {
    feedbackSent: false
  }

  handleSendFeedback = rating => {
    // tslint:disable-next-line: no-floating-promises
    this.props.onFeedback(rating).then(() => {
      this.setState({ feedbackSent: true })
    })
  }

  render() {
    if (this.props.show && !this.state.feedbackSent) {
      return (
        <div>
          {this.props.children}
          <span style={{ cursor: 'pointer' }} onClick={() => this.handleSendFeedback(1)}>
            👍
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => this.handleSendFeedback(-1)}>
            👎
          </span>
        </div>
      )
    }

    return <div>{this.props.children}</div>
  }
}
