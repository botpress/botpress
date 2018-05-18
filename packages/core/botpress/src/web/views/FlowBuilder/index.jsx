import React, { Component } from 'react'
import classnames from 'classnames'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import Toolbar from './containers/Toolbar'
import Diagram from './containers/Diagram'
import SidePanel from './containers/SidePanel'
import Topbar from './containers/Topbar'
import SkillsBuilder from './containers/SkillsBuilder'
import NodeProps from './containers/NodeProps'

import { switchFlow } from '~/actions'

const style = require('./style.scss')

class FlowBuilder extends Component {
  componentWillReceiveProps(nextProps) {
    const { flow } = nextProps.match.params
    if (flow) {
      const nextFlow = `${flow}.flow.json`
      if (this.props.currentFlow !== nextFlow) {
        this.props.switchFlow(nextFlow)
      }
    } else if (this.props.currentFlow) {
      this.props.history.push(`/flows/${this.props.currentFlow.replace(/\.flow\.json/, '')}`)
    }
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
          <SkillsBuilder />
          <NodeProps show={this.props.showFlowNodeProps} />
        </div>
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({
  currentFlow: state.flows.currentFlow,
  showFlowNodeProps: state.flows.showFlowNodeProps
})
export default connect(mapStateToProps, { switchFlow })(withRouter(FlowBuilder))
