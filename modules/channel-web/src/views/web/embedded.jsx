import React from 'react'
import ReactGA from 'react-ga'
import Chat from './index.jsx'

export default class FullscreenChat extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    ReactGA.initialize('UA-90044826-2')
    ReactGA.event({ category: 'WebChat', action: 'Rendered Embedded Webchat', nonInteraction: true })
    return <Chat fullscreen={false} {...this.props} />
  }
}
