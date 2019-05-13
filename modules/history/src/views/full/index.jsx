import React from 'react'
import style from './style.scss'

export default class FullView extends React.Component {
  state = {
    conversations: [],
    messages: []
  }

  componentDidMount() {
    this.props.bp.axios.get('/mod/history/conversations').then(({ data }) => {
      this.setState({ conversations: data })
    })
  }

  componentWillUnmount() {
    this.unmounting = true
    clearInterval(this.metadataTimer)
  }

  getMessagesOfConversation(convId) {
    this.props.bp.axios.get(`/mod/history/messages/${convId}`).then(({ data }) => {
      this.setState({ messages: data })
    })
  }

  focusMessage(msgId) {
    console.log(m)
  }

  render() {
    if (!this.state.conversations) {
      return null
    }
    return (
      <div className={style['msg-container']}>
        <div className={style['conversations']}>
          {this.state.conversations.map(conv => {
            return (
              <div key={conv} value={conv} onClick={() => this.getMessagesOfConversation(conv)}>
                {`conversation #${conv}`}
              </div>
            )
          })}
        </div>
        <div className={style['messages']}>
          {this.state.messages &&
            this.state.messages.map(m => {
              return (
                <div
                  className={m.direction === 'outgoing' ? style['outgoing'] : style['incomming']}
                  key={m}
                  value={m}
                  onClick={() => this.focusMessage(m)}
                >
                  {m.payload.text}
                </div>
              )
            })}
        </div>
      </div>
    )
  }
}
