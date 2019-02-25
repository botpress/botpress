import React from 'react'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import Toggle from 'react-toggle'
import classnames from 'classnames'

import 'react-toggle/style.css'
import style from './style.scss'

import Message from '../message'

export default class Conversation extends React.Component {
  constructor() {
    super()

    this.state = { loading: true, messages: null }
    this.appendMessage = this.appendMessage
  }

  scrollToBottom = () => {
    const messageScrollDiv = this.refs.innerMessages
    if (messageScrollDiv) {
      messageScrollDiv.scrollTop = messageScrollDiv.scrollHeight
    }
  }

  componentDidMount() {
    this.props.bp.events.on('guest.hitl.message', this.appendMessage)
  }

  componentWillUnmount() {
    this.props.bp.events.off('guest.hitl.message', this.appendMessage)
  }

  appendMessage = (message) => {
    if (this.state.messages && this.props.data && this.props.data.id === message.session_id) {
      this.setState({ messages: [...this.state.messages, message] })
      setTimeout(this.scrollToBottom, 50)
    }
  }

  togglePaused = () => {
    this.props.data.props = !this.props.data.props
    const sessionId = this.props.data.id
    const action = !!this.props.data.paused ? 'unpause' : 'pause'
    this.getAxios().post(`/mod/hitl/sessions/${sessionId}/${action}`)
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentWillReceiveProps(nextProps) {
    let newData = this.props.data
    if (nextProps.data) {
      newData = nextProps.data
    }

    if (newData && newData.id) {
      this.fetchSessionMessages(newData.id)
    }
  }

  fetchSessionMessages(sessionId) {
    this.setState({ loading: true })

    return this.getAxios()
      .get('/mod/hitl/sessions/' + sessionId)
      .then(({ data }) => {
        this.setState({
          loading: false,
          messages: data
        })

        setTimeout(this.scrollToBottom, 50)
      })
  }

  renderHeader() {
    const pausedTooltip = <Tooltip id="pausedTooltip">Pause this conversation</Tooltip>

    return (
      <div>
        <h3>
          {this.props.data && this.props.data.full_name}
          {this.props.data && !!this.props.data.paused ? <span className={style.pausedWarning}>Paused</span> : null}
        </h3>
        <OverlayTrigger placement="left" overlay={pausedTooltip}>
          <div className={style.toggleDiv}>
            <Toggle
              className={classnames(style.toggle, style.enabled)}
              checked={this.props.data && !this.props.data.paused}
              onChange={this.togglePaused}
            />
          </div>
        </OverlayTrigger>
      </div>
    )
  }

  renderMessages() {
    const dynamicHeightStyleInnerMessageDiv = {
      maxHeight: innerHeight - 210
    }

    return (
      <div
        className={style.innerMessages}
        id="innerMessages"
        ref="innerMessages"
        style={dynamicHeightStyleInnerMessageDiv}
      >
        {this.state.messages &&
          this.state.messages.map((m, i) => {
            return <Message key={i} content={m} />
          })}
      </div>
    )
  }

  render() {
    const dynamicHeightStyleMessageDiv = {
      height: innerHeight - 210
    }

    return (
      <div className={style.conversation}>
        <div className={style.header}>{this.props.data ? this.renderHeader() : null}</div>
        <div className={style.messages} style={dynamicHeightStyleMessageDiv}>
          {this.props.data ? this.renderMessages() : null}
        </div>
      </div>
    )
  }
}
