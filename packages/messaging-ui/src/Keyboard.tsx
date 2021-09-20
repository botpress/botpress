import * as React from 'react'
import * as ReactDOM from 'react-dom'

class KeyboardElements extends React.Component<KeyboardElementsProps> {
  private container: HTMLElement

  constructor(props) {
    super(props)
    this.container = document.createElement('div')
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
      this.insertChildAt(this.container, this.props.index, Default.appendRef.current)
    } else {
      this.insertChildAt(this.container, this.props.index, Default.prependRef.current)
    }
  }

  componentWillUnmount() {
    if (this.props.append) {
      Default.appendRef.current?.removeChild(this.container)
    } else {
      Default.prependRef.current?.removeChild(this.container)
    }
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.container)
  }
}

export class Prepend extends React.Component<Partial<KeyboardElementsProps>> {
  render() {
    return (
      <div>
        {this.props.visible && <KeyboardElements index={this.props.index}>{this.props.keyboard}</KeyboardElements>}
        {this.props.children}
      </div>
    )
  }
}

export class Append extends React.Component<Partial<KeyboardElementsProps>> {
  render() {
    return (
      <div>
        {this.props.visible && <KeyboardElements append>{this.props.keyboard}</KeyboardElements>}
        {this.props.children}
      </div>
    )
  }
}

export class Default extends React.Component<Partial<KeyboardElementsProps>> {
  static prependRef: React.RefObject<HTMLDivElement> = React.createRef()
  static appendRef: React.RefObject<HTMLDivElement> = React.createRef()
  static isReady = () => Default.appendRef.current !== null

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

interface KeyboardElementsProps {
  /** When true, the keyboard is appended at the end. Otherwise, it is prepended */
  append?: boolean
  index?: number
  visible?: boolean
  /** A keyboard can be any kind of element */
  keyboard?: any
}
