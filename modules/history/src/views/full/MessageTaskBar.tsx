import { Alignment, AnchorButton, Checkbox, Colors, Divider, Icon, Position, Text, Tooltip } from '@blueprintjs/core'
import { LeftToolbarButtons, RightToolbarButtons, Toolbar } from 'botpress/ui'
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
  currentConv: string
  showCopiedTooltip: boolean
}

export class MessageTaskBar extends React.Component<Props, State> {
  state = {
    currentConv: undefined,
    showCopiedTooltip: false
  }
  filters: Filters = {
    flag: false
  }

  componentDidUpdate() {
    if (this.props.currentConv !== this.state.currentConv) {
      this.setState({ currentConv: this.props.currentConv })
    }
  }

  toggleFlagFilter = () => {
    this.filters.flag = !this.filters.flag
    this.props.updateFilters(this.filters)
  }

  renderActions() {
    return (
      <LeftToolbarButtons>
        <Text className={style.taskBarText}>{this.props.selectedCount} selected messages</Text>

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
      </LeftToolbarButtons>
    )
  }

  copyLink = () => {
    this.setState({ showCopiedTooltip: true })
    setTimeout(() => this.setState({ showCopiedTooltip: false }), 600)
  }

  renderFilters() {
    return (
      <Fragment>
        <LeftToolbarButtons>
          <Checkbox
            className={style.filtersCheckbox}
            inline
            label={'Show flagged only:'}
            alignIndicator={Alignment.RIGHT}
            checked={this.filters.flag}
            onChange={this.toggleFlagFilter}
          />
        </LeftToolbarButtons>

        <RightToolbarButtons>
          <div className={style.downloadCopy}>
            <MessageDownload messageGroups={this.props.messageGroups} />
            <Tooltip content={'copied!'} isOpen={this.state.showCopiedTooltip} position={Position.BOTTOM}>
              <CopyToClipboard text={window.location.href}>
                <AnchorButton icon={'link'} onClick={this.copyLink} />
              </CopyToClipboard>
            </Tooltip>
          </div>
        </RightToolbarButtons>
      </Fragment>
    )
  }

  render() {
    return <Toolbar>{this.props.useAsFilter ? this.renderFilters() : this.renderActions()}</Toolbar>
  }
}
