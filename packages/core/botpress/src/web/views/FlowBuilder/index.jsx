import React, { Component } from 'react'
import classnames from 'classnames'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import _ from 'lodash'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import Toolbar from './containers/Toolbar'
import Diagram from './containers/Diagram'
import SidePanel from './containers/SidePanel'
import Topbar from './containers/Topbar'
import SkillsBuilder from './containers/SkillsBuilder'
import NodeProps from './containers/NodeProps'

import { switchFlow } from '~/actions'
import { getDirtyFlows } from '~/reducers'

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

  componentWillUnmount() {
    const { pathname } = this.props.history.location
    const hasDirtyFlows = !_.isEmpty(this.props.dirtyFlows)

    const hasUnsavedChanges = !/^\/flows\//g.exec(pathname) && !window.BOTPRESS_FLOW_EDITOR_DISABLED && hasDirtyFlows

    if (hasUnsavedChanges) {
      const isSave = confirm('Save changes?')

      if (isSave) {
        this.diagram.saveAllFlows()
      }
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
  showFlowNodeProps: state.flows.showFlowNodeProps,
  dirtyFlows: getDirtyFlows(state)
})

export default connect(mapStateToProps, { switchFlow })(withRouter(FlowBuilder))
