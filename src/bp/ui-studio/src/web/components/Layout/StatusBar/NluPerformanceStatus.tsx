import { Icon } from '@blueprintjs/core'
import axios from 'axios'
import cx from 'classnames'
import _ from 'lodash'
import React from 'react'

import ActionItem from './ActionItem'
import style from './StatusBar.styl'

interface MatrixInfo {
  matrix: any | undefined
  confusionComputing: boolean
}

interface Props {
  synced: boolean
  contentLang: string
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

  componentDidUpdate(prevProps: Props) {
    if (!this.props.synced && this.state.synced) {
      this.setState({ f1: undefined, synced: false })
    }

    if (prevProps.contentLang && prevProps.contentLang != this.props.contentLang) {
      this.fetchConfusion()
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
      const { data } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/confusion/${modelHash}/studio`, {
        params: { lang: this.props.contentLang }
      })
      return data as MatrixInfo
    } catch {
      return { confusionComputing: false } as MatrixInfo
    }
  }

  extractF1FromMatrix(matrix: any): number | undefined {
    const f1 = _.get(matrix, 'intents.all.f1')

    return f1 ? Math.round(f1 * 100) : undefined
  }

  calculateConfusion = async () => {
    const { confusionComputing } = await this.getConfusionMatrix()
    this.computationMutex = this.computationMutex || confusionComputing

    if (this.computationMutex) {
      return
    }

    this.computationMutex = true
    this.setState({ f1: undefined, computing: true })

    const response = await axios.post(`${window.BOT_API_PATH}/mod/nlu/confusion`, { version: 'studio' })

    this.computationMutex = false
    this.setState({ computing: false })
    await this.fetchConfusion(response.data.modelHash)
  }

  render() {
    const colorScale = style['color-' + Math.min(Math.round(this.state.f1 / 10), 10)]
    return (
      <ActionItem
        title={'NLU performance'}
        description={
          this.state.f1
            ? `Overall score: ${this.state.f1} %`
            : 'No score to show, click to start NLU performance analysis'
        }
        disabled={this.state.computing}
        className={style.right}
        onClick={this.calculateConfusion}
      >
        <Icon icon="cube" iconSize={18} className={cx(colorScale, style.brain)} />
      </ActionItem>
    )
  }
}
