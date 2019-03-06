import React from 'react'
import Chat from './main.jsx'

export class Fullscreen extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <Chat fullscreen={true} {...this.props} />
  }
}

export class Embedded extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <Chat fullscreen={false} {...this.props} />
  }
}

/**
 * @deprecated Since the way views are handled has changed, we're also exporting views in lowercase.
 * https://botpress.io/docs/developers/migrate/
 */
export { Embedded as embedded } from '.'
export { Fullscreen as fullscreen } from '.'
