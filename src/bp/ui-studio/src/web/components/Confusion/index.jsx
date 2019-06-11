import { FaThLarge } from 'react-icons/fa'
import React from 'react'
import classNames from 'classnames'
import axios from 'axios'
import style from './style.scss'

export default class NluPerformanceStatus extends React.Component {
  state = {
    health: 'gray',
    botId: undefined
  }
  status = {
    f1score: null,
    unsynced: false,
    computing: false
  }

  componentDidMount() {
    const url = new URL(window.location.href)
    const pathElements = url.pathname.split('/')
    const botId = pathElements[2]
    this.setState({ botId })

    this.fetchConfusion(botId)
  }

  componentDidUpdate() {
    if (this.props.unsynced !== this.status.unsynced) {
      this.status.unsynced = this.props.unsynced
      this.setState({ health: 'gray' })
    }
  }

  fetchConfusion = async (botId, modelHash) => {
    const { matrix, workStatus } = await this.getConfusionMatrix(botId, modelHash)

    if (workStatus === 'busy') {
      this.setState({ health: 'gray' })

      this.status.f1score = null
      this.status.unsynced = true
      this.status.computing = true
    } else {
      const { f1, health } = this.extractHealthFromMatrix(matrix)
      this.setState({ health })

      this.status.f1score = f1
      this.status.unsynced = !matrix
      this.status.computing = false
    }
    this.props.updateNluStatus(this.status)
  }

  getConfusionMatrix = async (botId, modelHash) => {
    const baseUrl = this.buildNluApiBasePath(botId)

    if (!modelHash) {
      const modelHashResponse = await axios.get(`${baseUrl}/currentModelHash`)
      modelHash = modelHashResponse.data
    }

    return axios
      .get(`${baseUrl}/confusion/${modelHash}`)
      .then(confusionMatrixResponse => {
        return confusionMatrixResponse.data
      })
      .catch(err => {
        return { matrix: undefined, workStatus: 'sleep' }
      })
  }

  extractHealthFromMatrix(matrix) {
    if (!matrix) {
      return { f1: null, health: 'gray' }
    }

    const f1 = matrix.intents.all.f1
    if (f1 < 0.5) {
      return { f1, health: 'red' }
    }

    if (f1 > 0.85) {
      return { f1, health: 'green' }
    }

    return { f1, health: 'yellow' }
  }

  calculateConfusion = async () => {
    const { workStatus } = await this.getConfusionMatrix(this.state.botId)
    this.status.computing = this.status.computing || workStatus === 'busy'

    if (!this.status.computing) {
      this.status.computing = true
      this.props.updateNluStatus(this.status)
      this.setState({ health: 'gray' })

      const baseUrl = this.buildNluApiBasePath(this.state.botId)
      axios.post(`${baseUrl}/confusion`).then(res => {
        this.status.computing = false
        this.props.updateNluStatus(this.status)
        this.fetchConfusion(this.state.botId, res.data.modelHash)
      })
    }
  }

  buildNluApiBasePath(botId) {
    return `/api/v1/bots/${botId}/mod/nlu`
  }

  render() {
    return <FaThLarge onClick={this.calculateConfusion} className={style[this.state.health]} />
  }
}
