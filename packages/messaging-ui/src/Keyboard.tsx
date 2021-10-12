import React from 'react'
import ReactDOM from 'react-dom'

class KeyboardElements extends React.Component<KeyboardElementsProps> {
  private container: HTMLElement

  constructor(props: KeyboardElementsProps) {
    super(props)
    this.container = document.createElement('div')
  }

  insertChildAt(child: HTMLElement, index = 0, parent: HTMLElement | null) {
    if (index >= (parent?.children.length || -1)) {
      parent?.appendChild(child)
    } else {
      parent?.insertBefore(child, parent.children[index])
    }
  }

  componentDidMount() {
    if (this.props.append) {
      this.insertChildAt(this.container, this.props.index, Keyboard.appendRef.current)
    } else {
      this.insertChildAt(this.container, this.props.index, Keyboard.prependRef.current)
    }
  }

  componentWillUnmount() {
    if (this.props.append) {
      Keyboard.appendRef.current?.removeChild(this.container)
    } else {
      Keyboard.prependRef.current?.removeChild(this.container)
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

export default class Keyboard extends React.Component<Partial<KeyboardElementsProps>> {
  static prependRef: React.RefObject<HTMLDivElement> = React.createRef()
  static appendRef: React.RefObject<HTMLDivElement> = React.createRef()
  static isReady = () => Keyboard.appendRef.current !== null

  render() {
    return (
      <div className={'bpw-keyboard'}>
        <div ref={Keyboard.prependRef} />
        {this.props.children}
        <div ref={Keyboard.appendRef} />
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
