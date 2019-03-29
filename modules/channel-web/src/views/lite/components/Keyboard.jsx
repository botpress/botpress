import React, { Component } from 'react'

class KeyboardElements extends React.Component {
  constructor(props) {
    super(props)
    this.el = document.createElement('div')
  }

  componentDidMount() {
    Default.prependRef.current.appendChild(this.el)
  }

  componentWillUnmount() {
    Default.prependRef.current.removeChild(this.el)
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el)
  }
}

export class Prepend extends Component {
  render() {
    return (
      <div>
        {this.props.visible && <KeyboardElements>{this.props.keyboard}</KeyboardElements>}
        {this.props.children}
      </div>
    )
  }
}

export class Default extends Component {
  static prependRef = React.createRef()

  render() {
    return (
      <div className={'bpw-keyboard'}>
        <div ref={Default.prependRef} />
        {this.props.children}
      </div>
    )
  }
}
