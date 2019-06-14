import { Divider, Icon } from '@blueprintjs/core'
import { AnchorButton, Colors, Position, Tooltip } from '@blueprintjs/core'
import { Toolbar } from 'botpress/ui'
import React, { Fragment } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { MessageGroup } from '../../typings'

import style from './style.scss'
import { MessageDownload } from './MessageDownload'

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
  messageGroups: MessageGroup[]
}

interface State {
  filters: Filters
  currentConv: string
  showCopiedTooltip: boolean
}

export class MessageTaskBar extends React.Component<Props, State> {
  state = {
    filters: {
      flag: false
    },
    currentConv: undefined,
    showCopiedTooltip: false
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

  renderFilters() {
    return (
      <Toolbar>
        <Fragment>
          <div className={style.taskBarText}>{this.props.selectedCount} selected messages</div>

          <Divider />

          <Tooltip content={'Mark selected messages as not good'} position={Position.BOTTOM}>
            <AnchorButton data-tip data-for={'flag'} onClick={this.props.flag}>
              <Icon icon={'flag'} color={Colors.BLACK} />
            </AnchorButton>
          </Tooltip>

          <Tooltip content={'Unflag Selected messages'} position={Position.BOTTOM}>
            <AnchorButton>
              <Icon icon={'flag'} color={Colors.GRAY1} onClick={this.props.unflag} />
            </AnchorButton>
          </Tooltip>
        </Fragment>
      </Toolbar>
    )
  }

  copyLink = e => {
    console.log(e)
    this.setState({ showCopiedTooltip: true })
    setTimeout(() => this.setState({ showCopiedTooltip: false }), 600)
  }

  renderActions() {
    return (
      <Toolbar>
        <label className={style.taskBarText}>
          <span className={style.taskBarLabel}>Display only flagged messages:</span>
          <input
            style={{ margin: 0 }}
            id={'displayFlagCheckbox'}
            className={style.displayFlagCheckbox}
            type={'checkbox'}
            checked={this.state.filters.flag}
            onChange={this.toggleFlagFilter}
          />
        </label>

        <div key={'download-copy'} className={style.downloadCopy}>
          <MessageDownload messageGroups={this.props.messageGroups} />
          <Tooltip content={'copied!'} isOpen={this.state.showCopiedTooltip} position={Position.BOTTOM}>
            <CopyToClipboard text={window.location.href}>
              <AnchorButton icon={'link'} onClick={this.copyLink} />
            </CopyToClipboard>
          </Tooltip>
        </div>
      </Toolbar>
    )
  }

  render() {
    if (!this.props.useAsFilter) {
      return this.renderFilters()
    } else {
      return this.renderActions()
    }
  }
}
