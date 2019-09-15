import { Classes, H4, Overlay, Tab, Tabs } from '@blueprintjs/core'
import classnames from 'classnames'
import React from 'react'

import AdvancedSettings from './Advanced'
import BasicSettings from './Basic'

export default class Settings extends React.Component<any> {
  state = {
    selectedTabId: 'basic',
    isOpen: false
  }

  handleTabChange = selectedTabId => this.setState({ selectedTabId })

  render() {
    return (
      <Overlay
        isOpen={this.props.isOpen}
        onClose={this.props.toggle}
        className={Classes.OVERLAY_SCROLL_CONTAINER}
        usePortal={false}
      >
        <div className={classnames(Classes.CARD, Classes.ELEVATION_4)} style={{ width: 535, top: '20px', left: '25%' }}>
          <H4>Settings</H4>

          <Tabs id="tabs" onChange={this.handleTabChange} selectedTabId={this.state.selectedTabId}>
            <Tab id="basic" title="Basic" panel={<BasicSettings store={this.props.store} />} />
            <Tab id="advanced" title="Advanced" panel={<AdvancedSettings store={this.props.store} />} />
          </Tabs>
        </div>
      </Overlay>
    )
  }
}
