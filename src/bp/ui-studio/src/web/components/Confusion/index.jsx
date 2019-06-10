import { FaThLarge } from 'react-icons/fa'
import React from 'react'
import classNames from 'classnames'
import axios from 'axios'
import style from './style.scss'

export default class NluPerformanceStatus extends React.Component {
  state = {
    currentStatus: 'unsync',
    botId: null
  }
  waitingForConfusion = false

  componentDidMount() {
    // let path = window.location.href
    // const studioSubstr = '/studio/'
    // const botIdIndex = path.indexOf(studioSubstr) + studioSubstr.length
    // path = path.substring(botIdIndex)
    // const botIdEndIndex = path.indexOf('/')
    // const botId = path.substring(0, botIdEndIndex)

    const url = new URL(window.location.href)
    const pathElements = url.pathname.split('/')
    const botId = pathElements[2]

    this.fetchConfusionStatus(botId)
  }

  fetchConfusionStatus = async botId => {
    const confusionMatrix = await this.getConfusionMatrix(botId)
    const currentStatus = this.extractStatusFromMatrix(confusionMatrix)
    this.setState({ botId, currentStatus })
  }

  getConfusionMatrix = async botId => {
    const modelHashResponse = await axios.get(`/api/v1/bots/${botId}/mod/nlu/currentModelHash`)
    const confusionMatrixResponse = await axios.get(`/api/v1/bots/${botId}/mod/nlu/confusion/${modelHashResponse.data}`)
    return confusionMatrixResponse.data
  }

  extractStatusFromMatrix(matrix) {
    if (!matrix) {
      return 'unsync'
    }

    const f1 = matrix.intents.all.f1
    if (f1 < 0.5) {
      return 'red'
    }

    if (f1 > 0.85) {
      return 'green'
    }

    return 'yellow'
  }

  calculateConfusion = async () => {
    if (!this.waitingForConfusion) {
      this.waitingForConfusion = true
      this.setState({ currentStatus: 'unsync' })
      axios.post(`/api/v1/bots/${this.state.botId}/mod/nlu/confusion`).then(() => {
        this.waitingForConfusion = false
        this.fetchConfusionStatus(this.state.botId)
      })
    }
  }

  render() {
    return (
      <FaThLarge
        onClick={this.calculateConfusion}
        className={classNames(
          { [style.gray]: this.state.currentStatus === 'unsync' },
          { [style.green]: this.state.currentStatus === 'green' },
          { [style.red]: this.state.currentStatus === 'yellow' },
          { [style.yellow]: this.state.currentStatus === 'red' }
        )}
      />
    )
  }
}
