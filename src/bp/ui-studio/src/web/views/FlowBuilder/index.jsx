import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import _ from 'lodash'
import { HotKeys } from 'react-hotkeys'

import DocumentationProvider from '~/components/Util/DocumentationProvider'
import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import { operationAllowed } from '~/components/Layout/PermissionsChecker'

import Toolbar from './containers/Toolbar'
import Diagram from './containers/Diagram'
import SidePanel from './containers/SidePanel'
import Topbar from './containers/Topbar'
import SkillsBuilder from './containers/SkillsBuilder'
import NodeProps from './containers/NodeProps'

import { switchFlow, setDiagramAction } from '~/actions'
import { getDirtyFlows } from '~/reducers'

const style = require('./style.scss')

class FlowBuilder extends Component {
  state = {
    initialized: false
  }

  init() {
    if (this.state.initialized || !this.props.user || this.props.user.email == null) {
      return
    }
    this.setState({
      initialized: true,
      readOnly: !operationAllowed({ user: this.props.user, op: 'write', res: 'bot.flows' })
    })
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps) {
    this.init()

    const { flow } = this.props.match.params
    const nextRouteFlow = `${flow}.flow.json`

    if (prevProps.currentFlow !== this.props.currentFlow) {
      this.pushFlowState(this.props.currentFlow)
    } else if (flow && prevProps.currentFlow !== nextRouteFlow) {
      this.props.switchFlow(nextRouteFlow)
    }
  }

  pushFlowState = flow => {
    this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)
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
    if (!this.state.initialized) {
      return null
    }

    const { readOnly } = this.state

    const keyHandlers = {
      'flow-add-node': () => this.props.setDiagramAction('insert_node'),
      'flow-save': () => this.diagram.saveAllFlows()
    }

    return (
      <HotKeys handlers={keyHandlers} focused>
        <DocumentationProvider file="flows" />
        <ContentWrapper stretch={true} className={style.wrapper}>
          <PageHeader className={style.header} width="100%">
            <Topbar readOnly={readOnly} />
          </PageHeader>
          <div className={style.workspace}>
            <SplitPane split="vertical" minSize={200} defaultSize={250}>
              <div className={style.sidePanel}>
                <SidePanel
                  readOnly={readOnly}
                  onCreateFlow={name => {
                    this.diagram.createFlow(name)
                    this.props.switchFlow(`${name}.flow.json`)
                  }}
                />
              </div>
              <div className={style.diagram}>
                {!readOnly && (
                  <Toolbar
                    onSaveAllFlows={() => {
                      this.diagram.saveAllFlows()
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
                )}
                <Diagram
                  readOnly={readOnly}
                  ref={el => {
                    if (!!el) {
                      this.diagram = el.getWrappedInstance()
                    }
                  }}
                />
              </div>
            </SplitPane>
            <SkillsBuilder />
            <NodeProps readOnly={readOnly} show={this.props.showFlowNodeProps} />
          </div>
        </ContentWrapper>
      </HotKeys>
    )
  }
}

const mapStateToProps = state => ({
  currentFlow: state.flows.currentFlow,
  showFlowNodeProps: state.flows.showFlowNodeProps,
  dirtyFlows: getDirtyFlows(state),
  user: state.user
})

export default connect(
  mapStateToProps,
  { switchFlow, setDiagramAction }
)(withRouter(FlowBuilder))
