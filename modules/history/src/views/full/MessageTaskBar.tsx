import React from 'react'
import { IoMdFlag } from 'react-icons/io'
import ReactTooltip from 'react-tooltip'

import style from './style.scss'

interface Filters {
  flag: boolean
}

interface Props {
  currentConv: string
  updateFilters: (f: Filters) => void
  useAsFilter: boolean
  selectedCount: number
  flag: () => void
  unflag: () => void
}

interface State {
  filters: Filters
  currentConv: string
}

export class MessageTaskBar extends React.Component<Props, State> {
  state = {
    filters: {
      flag: false
    },
    currentConv: undefined
  }

  componentDidUpdate() {
    if (this.props.currentConv !== this.state.currentConv) {
      this.setState({ currentConv: this.props.currentConv, filters: { flag: false } })
    }
  }

  toggleFlagFilter = () => {
    this.state.filters.flag = !this.state.filters.flag
    this.props.updateFilters(this.state.filters)
  }

  render() {
    return (
      <div className={style.messageTaskBar}>
        {!this.props.useAsFilter && (
          <div className={style.messageTaskBarFilter}>
            <div>{this.props.selectedCount} selected messages</div>
            <IoMdFlag className={style.messageTaskBarFlagIcon} data-tip data-for={'flag'} onClick={this.props.flag} />
            <ReactTooltip id={'flag'} effect={'solid'}>
              <div>Mark selected messages as not good</div>
            </ReactTooltip>
            <IoMdFlag
              className={style.messageTaskBarUnflagIcon}
              data-tip
              data-for={'unflag'}
              onClick={this.props.unflag}
            />
            <ReactTooltip id={'unflag'} effect={'solid'}>
              <div>Unflag Selected messages</div>
            </ReactTooltip>
          </div>
        )}
        {this.props.useAsFilter && (
          <div>
            <span>Display only flagged messages:</span>
            <input type={'checkbox'} checked={this.state.filters.flag} onChange={this.toggleFlagFilter} />
          </div>
        )}
      </div>
    )
  }
}
