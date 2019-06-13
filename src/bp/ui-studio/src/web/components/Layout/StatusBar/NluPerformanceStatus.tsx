import { Colors } from '@blueprintjs/core'
import axios from 'axios'
import React from 'react'
import { FaThLarge } from 'react-icons/fa'

import ActionItem from './ActionItem'
import style from './StatusBar.styl'

const GREEM_LOWER_BOUND = 0.85
const RED_UPPER_BOUND = 0.5

interface MatrixInfo {
  matrix: any | undefined
  confusionComputing: boolean
}

interface Props {
  synced: boolean
  updateSyncStatus: (synced: boolean) => void
}

interface State {
  f1: number
  synced: boolean
  computing: boolean
}

export default class NluPerformanceStatus extends React.Component<Props, State> {
  state: State = {
    f1: undefined,
    synced: true,
    computing: false
  }
  computationMutex = false // not in the state because it needs to be updated in sync

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.fetchConfusion()
  }

  componentDidUpdate() {
    if (!this.props.synced && this.state.synced) {
      this.setState({ f1: undefined, synced: false })
    }
  }

  fetchConfusion = async (modelHash?: string) => {
    const { matrix, confusionComputing } = await this.getConfusionMatrix(modelHash)
    const f1 = confusionComputing ? undefined : this.extractF1FromMatrix(matrix)
    const synced = !!matrix
    this.props.updateSyncStatus(synced)
    this.setState({ f1, synced: !!matrix, computing: confusionComputing })
  }

  getConfusionMatrix: (modelHash?: string) => Promise<MatrixInfo> = async (modelHash?) => {
    if (!modelHash) {
      const { data } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/currentModelHash`)
      modelHash = data
    }

    try {
      const { data } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/confusion/${modelHash}`)
      return data as MatrixInfo
    } catch {
      return { confusionComputing: false } as MatrixInfo
    }
  }

  extractF1FromMatrix(matrix): number | undefined {
    if (!matrix || !matrix.intents || !matrix.intents.all) {
      return
    }
    return matrix.intents.all.f1
  }

  calculateConfusion = async () => {
    const { confusionComputing } = await this.getConfusionMatrix()
    this.computationMutex = this.computationMutex || confusionComputing

    if (this.computationMutex) {
      return
    }

    this.computationMutex = true
    this.setState({ f1: undefined, computing: true })

    const response = await axios.post(`${window.BOT_API_PATH}/mod/nlu/confusion`)

    this.computationMutex = false
    this.setState({ computing: false })
    await this.fetchConfusion(response.data.modelHash)
  }

  mapF1ToColor(f1: number | undefined) {
    if (!f1) {
      return Colors.WHITE
    }
    if (f1 < RED_UPPER_BOUND) {
      return Colors.RED2
    }
    if (f1 >= GREEM_LOWER_BOUND) {
      return Colors.GREEN4
    }
    return Colors.GOLD4
  }

  render() {
    return (
      <ActionItem
        title={'NLU Performance Status'}
        description={this.state.f1 ? `f1: ${this.state.f1}` : 'currently no f1 to display'}
        disabled={this.state.computing}
        className={style.right}
        onClick={this.calculateConfusion}
      >
        <FaThLarge color={this.mapF1ToColor(this.state.f1)} />
      </ActionItem>
    )
  }
}
