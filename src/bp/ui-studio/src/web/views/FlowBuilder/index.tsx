import { Intent, Position, Toaster } from '@blueprintjs/core'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { clearErrorSaveFlows, flowEditorRedo, flowEditorUndo, setDiagramAction, switchFlow } from '~/actions'
import { operationAllowed } from '~/components/Layout/PermissionsChecker'
import { Container } from '~/components/Shared/Interface'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { getDirtyFlows, RootReducer } from '~/reducers'
import { UserReducer } from '~/reducers/user'

import Diagram from './containers/Diagram'
import NodeProps from './containers/NodeProps'
import SidePanel from './containers/SidePanel'
import SkillsBuilder from './containers/SkillsBuilder'
import { PannelPermissions } from './sidePanel'
import { MutexInfo } from './sidePanel/Toolbar'
import style from './style.scss'

const toastMutex: _.Dictionary<boolean> = {}

const FlowToaster = Toaster.create({
  position: Position.TOP
})

class FlowBuilder extends Component<Props, State> {
  private diagram
  private userAllowed = false

  state = {
    initialized: false,
    readOnly: false,
    pannelPermissions: this.allPermissions,
    flowPreview: false,
    mutexInfo: undefined
  }

  get allPermissions(): PannelPermissions[] {
    return ['create', 'rename', 'delete']
  }

  init() {
    if (this.state.initialized || !this.props.user || this.props.user.email == null) {
      return
    }
    this.userAllowed = operationAllowed({ user: this.props.user, op: 'write', res: 'bot.flows' })
    this.setState({
      initialized: true
    })
    if (!this.userAllowed) {
      this.freezeAll()
    }
  }

  freezeAll() {
    this.setState({
      readOnly: true,
      pannelPermissions: []
    })
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps: Props) {
    this.init()

    const { flow } = this.props.match.params as any
    const nextRouteFlow = `${flow}.flow.json`

    if (prevProps.currentFlow !== this.props.currentFlow) {
      this.pushFlowState(this.props.currentFlow)
    } else if (flow && prevProps.currentFlow !== nextRouteFlow) {
      this.props.switchFlow(nextRouteFlow)
    }

    if (!prevProps.errorSavingFlows && this.props.errorSavingFlows) {
      const { status } = this.props.errorSavingFlows
      const message =
        status === 403
          ? 'Unauthorized flow update. You have insufficient role privileges to modify flows.'
          : 'There was an error while saving, deleting or renaming a flow. Last modification might not have been saved on server. Please reload page before continuing flow edition'
      toast(message, Intent.DANGER, 0, this.props.clearErrorSaveFlows)
    }

    const flowsHaveChanged = !_.isEqual(prevProps.flowsByName, this.props.flowsByName)
    const currentFlowHasSwitched = prevProps.currentFlow !== this.props.currentFlow
    if (flowsHaveChanged || currentFlowHasSwitched) {
      this.handleFlowFreezing()
    }
  }

  handleFlowFreezing() {
    if (!this.userAllowed) {
      this.freezeAll()
      return
    }

    const me = this.props.user.email

    const currentFlow = this.props.flowsByName[this.props.currentFlow]
    const { currentMutex } = (currentFlow || {}) as FlowView

    if (currentMutex && currentMutex.lastModifiedBy !== me && currentMutex.remainingSeconds) {
      this.setState({
        readOnly: true,
        pannelPermissions: ['create'],
        mutexInfo: { currentMutex }
      })
      return
    }

    const someoneElseIsEditingOtherFlow = _.values(this.props.flowsByName).some(
      f => f.currentMutex && f.currentMutex.lastModifiedBy !== me && !!f.currentMutex.remainingSeconds
    )

    if (someoneElseIsEditingOtherFlow) {
      this.setState({
        readOnly: false,
        pannelPermissions: ['create'],
        mutexInfo: { someoneElseIsEditingOtherFlow: true }
      })
      return
    }

    this.setState({
      readOnly: false,
      pannelPermissions: this.allPermissions,
      mutexInfo: undefined
    })
  }

  pushFlowState = flow => {
    this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)
  }

  render() {
    if (!this.state.initialized) {
      return null
    }

    const { readOnly, pannelPermissions } = this.state

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
      },
      'preview-flow': e => {
        e.preventDefault()
        this.setState({ flowPreview: true })
      },
      save: e => {
        e.preventDefault()
        toast('Pssst! Flows now save automatically, no need to save anymore.', Intent.PRIMARY, 700)
      }
    }

    return (
      <Container keyHandlers={keyHandlers}>
        <SidePanel
          readOnly={this.state.readOnly}
          mutexInfo={this.state.mutexInfo}
          permissions={pannelPermissions}
          flowPreview={this.state.flowPreview}
          onCreateFlow={name => {
            this.diagram.createFlow(name)
            this.props.switchFlow(`${name}.flow.json`)
          }}
        />
        <div className={style.diagram}>
          <Diagram
            readOnly={readOnly}
            flowPreview={this.state.flowPreview}
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

const toast = (message: string, intent: Intent, timeout: number, onDismissCb?: () => void) => {
  if (toastMutex[message]) {
    return
  }

  toastMutex[message] = true
  FlowToaster.show({
    message,
    intent,
    timeout,
    onDismiss: () => {
      toastMutex[message] = false
      onDismissCb && onDismissCb()
    }
  })
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: state.flows.currentFlow,
  flowsByName: state.flows.flowsByName,
  showFlowNodeProps: state.flows.showFlowNodeProps,
  dirtyFlows: getDirtyFlows(state),
  user: state.user,
  errorSavingFlows: state.flows.errorSavingFlows
})

const mapDispatchToProps = {
  switchFlow,
  setDiagramAction,
  flowEditorUndo,
  flowEditorRedo,
  clearErrorSaveFlows
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
  clearFlowsModification: () => void
  flowsByName: _.Dictionary<FlowView>
} & RouteComponentProps

interface State {
  initialized: any
  readOnly: boolean
  pannelPermissions: PannelPermissions[]
  flowPreview: boolean
  mutexInfo: MutexInfo
}
