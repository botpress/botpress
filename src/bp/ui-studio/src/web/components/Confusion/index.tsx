import { Colors } from '@blueprintjs/core'
import axios from 'axios'
import React from 'react'
import { FaThLarge } from 'react-icons/fa'

const GOOD_LOWER_BOUND = 0.85
const BAD_UPPER_BOUND = 0.5

interface NluStatus {
  f1score: number
  synced: boolean
  computing: boolean
}

interface MatrixInfo {
  matrix: any
  confusionComputing: boolean
}

interface Props {
  updateNluStatus: (s: NluStatus) => void
  synced: boolean
}

type Health = 'unknown' | 'bad' | 'medium' | 'good'

interface HealthInfo {
  f1: number
  health: Health
}

interface State {
  health: Health
}

export default class NluPerformanceStatus extends React.Component<Props, State> {
  state: State = {
    health: 'unknown'
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
      this.setState({ health: 'unknown' })
    }
  }

  fetchConfusion = (modelHash?) => {
    this.getConfusionMatrix(modelHash)
      .then(matrixInfo => {
        const { matrix, confusionComputing } = matrixInfo
        if (confusionComputing) {
          this.setState({ health: 'unknown' })

          this.status = {
            f1score: undefined,
            synced: false,
            computing: true
          }
        } else {
          const { f1, health } = this.extractHealthFromMatrix(matrix)
          this.setState({ health })

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

  extractHealthFromMatrix(matrix): HealthInfo {
    if (!matrix || !matrix.intents || !matrix.intents.all) {
      return { f1: undefined, health: 'unknown' }
    }

    const f1 = matrix.intents.all.f1 as number
    if (f1 < BAD_UPPER_BOUND) {
      return { f1, health: 'bad' }
    }

    if (f1 >= GOOD_LOWER_BOUND) {
      return { f1, health: 'good' }
    }

    return { f1, health: 'medium' }
  }

  calculateConfusion = async () => {
    const { confusionComputing } = await this.getConfusionMatrix()

    this.status.computing = this.status.computing || confusionComputing
    if (!this.status.computing) {
      this.status.computing = true
      this.props.updateNluStatus(this.status)
      this.setState({ health: 'unknown' })

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

  mapHealthToColor(health: Health) {
    if (health === 'unknown') {
      return Colors.WHITE
    }
    if (health === 'bad') {
      return Colors.RED2
    }
    if (health === 'medium') {
      return Colors.GOLD4
    }
    if (health === 'good') {
      return Colors.GREEN4
    }
  }

  render() {
    return <FaThLarge onClick={this.calculateConfusion} color={this.mapHealthToColor(this.state.health)} />
  }
}
