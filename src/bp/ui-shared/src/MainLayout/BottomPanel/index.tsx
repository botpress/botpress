import * as React from 'react'
import * as ReactDOM from 'react-dom'

class Portal extends React.Component<KeyboardElementsProps> {
  private container: HTMLElement

  constructor(props) {
    super(props)
    this.container = document.createElement('div')
  }

  componentDidMount() {
    Container.containerRef.current?.appendChild(this.container)
    Container.addTab(this.props.tabName)
  }

  componentWillUnmount() {
    Container.containerRef.current?.removeChild(this.container)
    Container.removeTab(this.props.tabName)
  }

  render() {
    console.log(Container)
    if (this.props) console.log(this.props)
    return ReactDOM.createPortal(this.props.children, this.container)
  }
}

export class Register extends React.Component<Partial<KeyboardElementsProps>> {
  render() {
    return (
      <div>
        <Portal {...this.props}>{this.props.children}</Portal>
      </div>
    )
  }
}

export class Container extends React.Component<Partial<KeyboardElementsProps>> {
  static containerRef: React.RefObject<HTMLDivElement> = React.createRef()
  static tabs: string[] = []
  static onTabChanged

  static addTab = val => {
    Container.tabs.push(val)
    Container.onTabChanged(Container.tabs)
  }

  static removeTab = val => {
    Container.tabs = Container.tabs.filter(x => x !== val)
    Container.onTabChanged(Container.tabs)
  }

  // static setActiveTab =

  render() {
    return (
      <div>
        <div ref={Container.containerRef} />
      </div>
    )
  }
}

interface KeyboardElementsProps {
  visible?: boolean
  activeTab?: string
  tabName?: string
  onTabChanged?: any
}

export default { Container, Register }
