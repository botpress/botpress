import React from 'react'
import Chat from './index.jsx'

export default class FullscreenChat extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <Chat fullscreen={true} {...this.props} />
  }
}
