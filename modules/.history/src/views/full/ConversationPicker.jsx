import React from 'react'
import style from './style.scss'
import { Icon, Position } from '@blueprintjs/core'
import { DateRangeInput } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'

import { SidePanelSection, ItemList } from 'botpress/ui'

function QueryOptions(props) {
  return (
    <div style={{ margin: '1em' }}>
      <DateRangeInput
        className={style.datepicker}
        popoverProps={{ position: Position.BOTTOM_RIGHT }}
        formatDate={date => date.toLocaleDateString()}
        onChange={props.handleDateChange}
        value={[props.from, props.to]}
        parseDate={str => (str ? new Date(str) : new Date())}
        shortcuts={false}
        closeOnSelection={true}
        allowSingleDayRange={true}
      />
    </div>
  )
}

export class ConversationPicker extends React.Component {
  state = {
    selectedConvId: undefined
  }

  mapConversationToListItem = conv => {
    const convId = conv.id
    const lastCharIndex = Math.min(convId.indexOf('::') + 18, convId.length)
    const convDisplayName = `${convId.substr(0, lastCharIndex)}... (${conv.count})`

    return {
      key: convId,
      label: convDisplayName,
      value: conv,
      selected: convId === this.state.selectedConvId
    }
  }

  updateConversation = convUiItem => {
    this.setState({ selectedConvId: convUiItem.value.id })
    this.props.onConversationChanged(convUiItem.value.id)
  }

  render() {
    const actions = [
      {
        icon: <Icon icon="refresh" />,
        onClick: this.props.refresh,
        tooltip: 'Refresh Conversations'
      }
    ]
    return (
      <div style={{ height: '100%' }}>
        <SidePanelSection label={'Conversations'} actions={actions}>
          <div className={style.conversations}>
            <QueryOptions handleDateChange={this.props.handleDateChange} from={this.props.from} to={this.props.to} />
            <ItemList
              items={this.props.conversations.map(this.mapConversationToListItem)}
              onElementClicked={this.updateConversation}
            />
          </div>
        </SidePanelSection>
      </div>
    )
  }
}
