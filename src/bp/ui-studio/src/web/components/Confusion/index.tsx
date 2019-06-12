import axios from 'axios'
import React from 'react'
import { FaThLarge } from 'react-icons/fa'

import style from './style.scss'
import { MatrixInfo, NluStatus, NluStatusProps } from './typings'

const GREEN_LOWER_BOUND = 0.85
const RED_UPPER_BOUND = 0.5

export default class NluPerformanceStatus extends React.Component<NluStatusProps> {
  state = {
    color: 'gray'
  }
  status: NluStatus = {
    f1score: undefined,
    synced: true,
    computing: false
  }

  componentDidMount() {
    this.fetchConfusion()
  }

  componentDidUpdate() {
    if (!this.props.synced && this.status.synced) {
      this.status.synced = false
      this.setState({ color: 'gray' })
    }
  }

  fetchConfusion = (modelHash?) => {
    this.getConfusionMatrix(modelHash)
      .then(matrixInfo => {
        const { matrix, confusionComputing } = matrixInfo
        if (confusionComputing) {
          this.setState({ color: 'gray' })

          this.status = {
            f1score: undefined,
            synced: false,
            computing: true
          }
        } else {
          const { f1, color } = this.extractColorFromMatrix(matrix)
          this.setState({ color })

          this.status = {
            f1score: f1,
            synced: !!matrix,
            computing: false
          }
        }
        this.props.updateNluStatus(this.status)
      })
      .catch(this.handleError)
  }

  getConfusionMatrix: (h?: string) => Promise<MatrixInfo> = async (modelHash?) => {
    if (!modelHash) {
      const modelHashResponse = await axios.get(`${window.BOT_API_PATH}/mod/nlu/currentModelHash`)
      modelHash = modelHashResponse.data
    }

    return axios
      .get(`${window.BOT_API_PATH}/mod/nlu/confusion/${modelHash}`)
      .then(confusionMatrixResponse => {
        return confusionMatrixResponse.data as MatrixInfo
      })
      .catch(err => {
        return { matrix: undefined, confusionComputing: false }
      })
  }

  extractColorFromMatrix(matrix) {
    if (!matrix || !matrix.intents || !matrix.intents.all) {
      return { color: 'gray' }
    }

    const f1 = matrix.intents.all.f1
    if (f1 < RED_UPPER_BOUND) {
      return { f1, color: 'red' }
    }

    if (f1 >= GREEN_LOWER_BOUND) {
      return { f1, color: 'green' }
    }

    return { f1, color: 'yellow' }
  }

  calculateConfusion = async () => {
    const { confusionComputing } = await this.getConfusionMatrix()

    this.status.computing = this.status.computing || confusionComputing
    if (!this.status.computing) {
      this.status.computing = true
      this.props.updateNluStatus(this.status)
      this.setState({ color: 'gray' })

      axios
        .post(`${window.BOT_API_PATH}/mod/nlu/confusion`)
        .then(res => {
          this.status.computing = false
          this.props.updateNluStatus(this.status)
          this.fetchConfusion(res.data.modelHash)
        })
        .catch(this.handleError)
    }
  }

  handleError = err => {
    console.error(err)
  }

  render() {
    return <FaThLarge onClick={this.calculateConfusion} className={style[this.state.color]} />
  }
}
