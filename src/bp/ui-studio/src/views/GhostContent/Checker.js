import React, { Component } from 'react'

import { fetchStatus } from './util'

const CHECK_INTERVAL_SEC = 5

class GhostContentStatusChecker extends Component {
  state = {
    hasPending: false
  }

  fetch = () => {
    fetchStatus()
      .then(data => {
        const hasPending = data && !!Object.keys(data).length
        this.setState({ hasPending })
      })
      .catch(() => {
        // do nothing
      })
  }

  componentDidMount() {
    this.fetch()
    this.checkInterval = setInterval(this.fetch, CHECK_INTERVAL_SEC * 1000)
  }

  componentWillUnmount() {
    clearInterval(this.checkInterval)
  }

  render() {
    const { hasPending } = this.state
    return (
      hasPending && (
        <span>
          &nbsp;<i className="icon material-icons" title="You have unsynced changes, see how to sync it.">
            warning
          </i>
        </span>
      )
    )
  }
}

export default GhostContentStatusChecker
