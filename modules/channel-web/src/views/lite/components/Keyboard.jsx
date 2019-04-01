import React, { Component } from 'react'

class KeyboardElements extends React.Component {
  constructor(props) {
    super(props)
    this.el = document.createElement('div')
  }

  insertChildAt(child, index = 0, parent) {
    if (index >= parent.children.length) {
      parent.appendChild(child)
    } else {
      parent.insertBefore(child, parent.children[index])
    }
  }

  componentDidMount() {
    if (this.props.append) {
      this.insertChildAt(this.el, this.props.index, Default.appendRef.current)
    } else {
      this.insertChildAt(this.el, this.props.index, Default.prependRef.current)
    }
  }

  componentWillUnmount() {
    if (this.props.append) {
      Default.appendRef.current.removeChild(this.el)
    } else {
      Default.prependRef.current.removeChild(this.el)
    }
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el)
  }
}

export class Prepend extends Component {
  render() {
    return (
      <div>
        {this.props.visible && <KeyboardElements index={this.props.index}>{this.props.keyboard}</KeyboardElements>}
        {this.props.children}
      </div>
    )
  }
}

export class Append extends Component {
  render() {
    return (
      <div>
        {this.props.visible && <KeyboardElements append={true}>{this.props.keyboard}</KeyboardElements>}
        {this.props.children}
      </div>
    )
  }
}

export class Default extends Component {
  static prependRef = React.createRef()
  static appendRef = React.createRef()

  render() {
    return (
      <div className={'bpw-keyboard'}>
        <div ref={Default.prependRef} />
        {this.props.children}
        <div ref={Default.appendRef} />
      </div>
    )
  }
}
