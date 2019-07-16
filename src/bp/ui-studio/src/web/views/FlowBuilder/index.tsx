import { Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
  clearErrorSaveFlows,
  clearFlowsModification,
  flowEditorRedo,
  flowEditorUndo,
  setDiagramAction,
  switchFlow
} from '~/actions'
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
import { FlowToaster } from './FlowToaster'

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

    if (!prevProps.errorSavingFlows && this.props.errorSavingFlows) {
      FlowToaster.show({
        message:
          'There was an error while saving, deleting or renaming a flow. Last modification might not have been saved on server. Please reload page before continuing flow edition',
        intent: Intent.DANGER,
        onDismiss: this.props.clearErrorSaveFlows
      })
    }

    if (!prevProps.lastModification && this.props.lastModification) {
      FlowToaster.show({
        message: `The modification "${this.props.lastModification.modification}" was applied on the flow "${
          this.props.lastModification.name
        }"`,
        intent: Intent.WARNING,
        onDismiss: this.props.clearFlowsModification
      })
    }
  }
  pushFlowState = flow => {
    this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)
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
  user: state.user,
  errorSavingFlows: state.flows.errorSavingFlows,
  lastModification: state.flows.lastServerModification
})

const mapDispatchToProps = {
  switchFlow,
  setDiagramAction,
  flowEditorUndo,
  flowEditorRedo,
  clearErrorSaveFlows,
  clearFlowsModification
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
  errorSavingFlows: any
  clearErrorSaveFlows: () => void
  lastModification: any
  clearFlowsModification: () => void
} & RouteComponentProps

interface State {
  initialized: any
  readOnly: any
}
