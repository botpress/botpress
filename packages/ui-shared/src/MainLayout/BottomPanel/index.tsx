import cx from 'classnames'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import style from './style.scss'

class Portal extends React.Component<BottomPanelProps> {
  private container: HTMLElement

  constructor(props) {
    super(props)
    this.container = document.createElement('div')
  }

  componentDidMount() {
    Container.containerRef.current?.appendChild(this.container)
    Container.addTab?.(this.props.tabName)
  }

  componentWillUnmount() {
    Container.containerRef.current?.removeChild(this.container)
    Container.removeTab?.(this.props.tabName)
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.container)
  }
}

export class Register extends React.Component<Partial<BottomPanelProps>> {
  render() {
    return (
      <div>
        <Portal {...this.props}>{this.props.children}</Portal>
      </div>
    )
  }
}

export class Container extends React.Component<Partial<BottomPanelProps>> {
  static containerRef: React.RefObject<HTMLDivElement> = React.createRef()
  static tabs: string[] = []
  static onTabsChanged: (tabs: string[]) => void

  static addTab = val => {
    Container.tabs.push(val)
    Container.onTabsChanged?.(Container.tabs)
  }

  static removeTab = val => {
    Container.tabs = Container.tabs.filter(x => x !== val)
    Container.onTabsChanged?.(Container.tabs)
  }

  render() {
    const isHidden = !this.props.activeTab || !Container.tabs.includes(this.props.activeTab)

    return (
      <div className={cx({ [style.hide]: isHidden })}>
        <div ref={Container.containerRef} />
      </div>
    )
  }
}

interface BottomPanelProps {
  activeTab?: string
  tabName?: string
  onTabsChanged?: (tabs: string[]) => void
}

export default { Container, Register }
