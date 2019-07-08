import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { flowEditorRedo, flowEditorUndo, setDiagramAction, switchFlow } from '~/actions'
import { operationAllowed } from '~/components/Layout/PermissionsChecker'
import { Container } from '~/components/Shared/Interface'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { getDirtyFlows, RootReducer } from '~/reducers'
import { UserReducer } from '~/reducers/user'

import Diagram from './containers/Diagram'
import NodeProps from './containers/NodeProps'
import SidePanel from './containers/SidePanel'
import SkillsBuilder from './containers/SkillsBuilder'
import Toolbar from './containers/Toolbar'
import style from './style.scss'

class FlowBuilder extends Component<Props, State> {
  private diagram

  state = {
    initialized: false,
    readOnly: false
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

    const { flow } = this.props.match.params as any
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
      add: e => {
        e.preventDefault()
        this.props.setDiagramAction('insert_node')
      },
      save: e => {
        e.preventDefault()
        this.diagram.saveAllFlows()
      },
      undo: e => {
        e.preventDefault()
        this.props.flowEditorUndo()
      },
      redo: e => {
        e.preventDefault()
        this.props.flowEditorRedo()
      }
    }

    return (
      <Container keyHandlers={keyHandlers}>
        <SidePanel
          readOnly={readOnly}
          onCreateFlow={name => {
            this.diagram.createFlow(name)
            this.props.switchFlow(`${name}.flow.json`)
          }}
        />
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
        <div className={style.diagram}>
          <Diagram
            readOnly={readOnly}
            ref={el => {
              if (!!el) {
                // @ts-ignore
                this.diagram = el.getWrappedInstance()
              }
            }}
          />
        </div>

        <DocumentationProvider file="flows" />
        <SkillsBuilder />
        <NodeProps readOnly={readOnly} show={this.props.showFlowNodeProps} />
      </Container>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: state.flows.currentFlow,
  showFlowNodeProps: state.flows.showFlowNodeProps,
  dirtyFlows: getDirtyFlows(state),
  user: state.user
})

const mapDispatchToProps = {
  switchFlow,
  setDiagramAction,
  flowEditorUndo,
  flowEditorRedo
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(FlowBuilder))

type Props = {
  currentFlow: string
  showFlowNodeProps: boolean
  dirtyFlows: string[]
  user: UserReducer
  setDiagramAction: any
  switchFlow: any
  flowEditorUndo: any
  flowEditorRedo: any
} & RouteComponentProps

interface State {
  initialized: any
  readOnly: any
}
