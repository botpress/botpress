import ms from 'ms'
import React, { Component } from 'react'
import NPS from './NetPromotingScore'
import NPSAdditionComment from './NetPromotingScore/components/NPSAdditionComment'
import { trackEvent } from './NetPromotingScore/SegmentHandler'
const NPS_KEY = 'bp/nps_after'

const npsDisplayRequirements = {
  initialDelayMs: ms('5d'),
  scoredDelayMs: ms('90d'),
  promptedDelayMs: ms('2d')
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
    trackEvent('nps_scored', { npsScore: score })
      .then(value => {
        this.setState({ score })
        setCuttoff(npsDisplayRequirements.scoredDelayMs)
      })
      .catch(e => {})
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
        children={<NPSAdditionComment onDismissed={this.onDismissed} />}
      />
    )
  }
}
