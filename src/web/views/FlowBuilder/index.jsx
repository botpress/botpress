import React, { Component } from 'react'
import classnames from 'classnames'
import SplitPane from 'react-split-pane'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import Toolbar from './containers/Toolbar'
import Diagram from './containers/Diagram'
import SidePanel from './containers/SidePanel'
import Topbar from './containers/Topbar'

const style = require('./style.scss')

export default class FlowBuilder extends Component {
  state = {
    flowName: ''
  }

  render() {
    return (
      <ContentWrapper stretch={true} className={style.wrapper}>
        <PageHeader className={style.header} width="100%">
          <Topbar />
        </PageHeader>
        <Toolbar
          onSaveAllFlows={() => {
            this.diagram.saveAllFlows()
          }}
          onCreateFlow={name => {
            this.diagram.createFlow(name)
          }}
          onDelete={() => {
            this.diagram.deleteSelectedElements()
          }}
          onCopy={() => {
            this.diagram.copySelectedElementToBuffer()
          }}
          onPaste={() => {
            this.diagram.pasteElementFromBuffer()
          }}
        />
        <div className={style.workspace}>
          <SplitPane split="vertical" minSize={200} defaultSize={250}>
            <div className={classnames(style.sidePanel)}>
              <SidePanel />
            </div>

            <div className={classnames(style.diagram)}>
              <Diagram
                ref={el => {
                  if (!!el) {
                    this.diagram = el.getWrappedInstance()
                  }
                }}
              />
            </div>
          </SplitPane>
        </div>
      </ContentWrapper>
    )
  }
}
