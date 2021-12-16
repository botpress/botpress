import React, { Component } from 'react'
import NPS from './NetPromotingScore'
import NPSAdditionComment from './NetPromotingScore/components/NPSAdditionComment'
import { trackEvent } from './NetPromotingScore/SegmentHandler'

const NPS_KEY = 'bp/nps_after'

const npsDisplayRequirements = {
  // initialDelayMs: 1000 * 5, // five seconds FOR TESTING
  // scoredDelayMs: 1000 * 15, // 15 seconds FOR TESTING
  // promptedDelayMs: 1000 * 15 // 1 second FOR TESTING
  initialDelayMs: 1000 * 60 * 60 * 24 * 1, // one day
  scoredDelayMs: 1000 * 60 * 60 * 24 * 14, // 1 Month
  promptedDelayMs: 1000 * 60 * 60 * 24 * 14 // two days, delay before re-asking
}

const setCuttoff = delayTime => {
  const promptCuttoffTime = Date.now() + delayTime
  window.BP_STORAGE.set(NPS_KEY, promptCuttoffTime)
}

export default class Nps extends Component {
  state = { score: null, dismissed: false, displayable: false }

  componentDidMount = () => {
    const npsCuttoff = window.BP_STORAGE.get(NPS_KEY)
    if (!npsCuttoff) {
      setCuttoff(npsDisplayRequirements.initialDelayMs)
      return
    }
    if (Date.now() > Number(npsCuttoff)) {
      this.setState({ displayable: true })
      setCuttoff(npsDisplayRequirements.promptedDelayMs)
    }
  }

  onSubmit = score => {
    void trackEvent('nps_scored', { npsScore: score })
    this.setState({ score })
    setCuttoff(npsDisplayRequirements.scoredDelayMs)
  }

  onDismissed = () => {
    this.setState({ dismissed: true })
  }
  render() {
    if (!this.state.displayable) {
      return null
    }
    return (
      <NPS
        score={this.state.score}
        dismissed={this.state.dismissed}
        onSubmit={this.onSubmit}
        onDismissed={this.onDismissed}
        children={<NPSAdditionComment />}
      ></NPS>
    )
  }
}
