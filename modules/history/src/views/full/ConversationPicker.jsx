import React from 'react'
import style from './style.scss'

import 'react-day-picker/lib/style.css'

import { TiRefresh } from 'react-icons/ti'
import { FaFilter } from 'react-icons/fa'
import DayPickerInput from 'react-day-picker/DayPickerInput'

function QueryOptions(props) {
  return (
    <div className={style['query-options']}>
      <div className={style['query-options-daypick']}>
        <div className={style['query-options-from_to']}>from:</div>
        <div className={style['daypicker-item']}>
          <DayPickerInput value={props.defaultFrom} onDayChange={props.handleFromChange} />
        </div>
      </div>
      <div className={style['query-options-daypick']}>
        <div className={style['query-options-from_to']}>to:</div>
        <div className={style['daypicker-item']}>
          <DayPickerInput value={props.defaultTo} onDayChange={props.handleToChange} />
        </div>
      </div>
    </div>
  )
}

export class ConversationPicker extends React.Component {
  state = {
    displayQueryOptions: false
  }

  toggleFilters() {
    this.setState({ displayQueryOptions: !this.state.displayQueryOptions })
  }

  render() {
    return (
      <div className={style['conversations']}>
        <div className={style['conversations-titlebar']}>
          <div>Conversations</div>
          <div className={style['conversations-icons']}>
            <FaFilter className={style['conversations-filter']} onClick={() => this.toggleFilters()} />
            <TiRefresh className={style['conversations-refresh']} onClick={this.props.refresh} />
          </div>
        </div>
        {this.state.displayQueryOptions && (
          <QueryOptions
            handleFromChange={this.props.handleFromChange}
            handleToChange={this.props.handleToChange}
            defaultFrom={this.props.defaultFrom}
            defaultTo={this.props.defaultTo}
          />
        )}
        <div className={style.conversationsList}>
          {this.props.conversations.map(conv => {
            const convId = conv.id
            const lastCharIndex = Math.min(convId.indexOf('::') + 6, convId.length)
            const convDisplayName = `${convId.substr(0, lastCharIndex)}...`
            return (
              <div
                key={conv.id}
                className={style['conversations-entry']}
                onClick={() => this.props.onConversationChanged(conv.id)}
              >
                <span className={style['conversations-sessionId']}>{convDisplayName}</span>
                <span className={style['conversations-count']}>({conv.count})</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
