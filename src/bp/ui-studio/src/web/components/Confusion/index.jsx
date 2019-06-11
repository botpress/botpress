import { FaThLarge } from 'react-icons/fa'
import React from 'react'
import classNames from 'classnames'
import axios from 'axios'
import style from './style.scss'

export default class NluPerformanceStatus extends React.Component {
  FETCH_TIME_INTERVAL = 500 // 2Hz

  state = {
    status: 'unsync',
    botId: null
  }
  waitingForConfusion = false
  timer = null

  componentDidMount() {
    const url = new URL(window.location.href)
    const pathElements = url.pathname.split('/')
    const botId = pathElements[2]
    this.setState({ botId })

    this.setupHttpHandlers()

    this.timer = setInterval(() => this.fetchConfusionStatus(this.state.botId), this.FETCH_TIME_INTERVAL)
  }

  setupHttpHandlers() {
    this.client = axios.create()
    // this.client.interceptors.response.use(
    //   response => response,
    //   error => {
    //     return Promise.reject(error)
    //   }
    // )
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  fetchConfusionStatus = async botId => {
    const confusionMatrix = await this.getConfusionMatrix(botId)
    const { f1, status } = this.extractStatusFromMatrix(confusionMatrix)
    this.props.updateNluStatus({ f1score: f1, fetching: false })
    this.setState({ botId, status })
  }

  getConfusionMatrix = async botId => {
    const baseUrl = this.buildNluApiBasePath(this.state.botId)
    const modelHashResponse = await this.client.get(`${baseUrl}/currentModelHash`)

    return this.client
      .get(`${baseUrl}/confusion/${modelHashResponse.data}`)
      .then(confusionMatrixResponse => {
        return confusionMatrixResponse.data
      })
      .catch(err => {
        return undefined
      })
  }

  extractStatusFromMatrix(matrix) {
    if (!matrix) {
      return { f1: null, status: 'unsync' }
    }

    const f1 = matrix.intents.all.f1
    if (f1 < 0.5) {
      return { f1, status: 'red' }
    }

    if (f1 > 0.85) {
      return { f1, status: 'green' }
    }

    return { f1, status: 'yellow' }
  }

  calculateConfusion = async () => {
    if (!this.waitingForConfusion) {
      this.waitingForConfusion = true

      clearInterval(this.timer)
      this.props.updateNluStatus({ f1score: null, fetching: true })
      this.setState({ status: 'unsync' })

      const baseUrl = this.buildNluApiBasePath(this.state.botId)
      this.client.post(`${baseUrl}/confusion`).then(() => {
        this.waitingForConfusion = false
        this.timer = setInterval(() => this.fetchConfusionStatus(this.state.botId), this.FETCH_TIME_INTERVAL)
      })
    }
  }

  buildNluApiBasePath(botId) {
    return `/api/v1/bots/${this.state.botId}/mod/nlu`
  }

  render() {
    return (
      <FaThLarge
        onClick={this.calculateConfusion}
        className={classNames(
          { [style.gray]: this.state.status === 'unsync' },
          { [style.green]: this.state.status === 'green' },
          { [style.red]: this.state.status === 'yellow' },
          { [style.yellow]: this.state.status === 'red' }
        )}
      />
    )
  }
}
