import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
  clearErrorSaveFlows,
  closeFlowNodeProps,
  flowEditorRedo,
  flowEditorUndo,
  refreshActions,
  refreshIntents,
  setDiagramAction,
  switchFlow
} from '~/actions'
import { Container } from '~/components/Shared/Interface'
import { Timeout, toastFailure, toastInfo } from '~/components/Shared/Utils'
import { isOperationAllowed } from '~/components/Shared/Utils/AccessControl'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { isInputFocused } from '~/keyboardShortcuts'
import { getDirtyFlows, RootReducer } from '~/reducers'
import { UserReducer } from '~/reducers/user'

import Diagram from './diagram'
import SkillsBuilder from './skills'
import style from './style.scss'
import SidePanel from './SidePanel'
import { PanelPermissions } from './SidePanel'
import { MutexInfo } from './SidePanel/Toolbar'

type Props = {
  currentFlow: string
  showFlowNodeProps: boolean
  dirtyFlows: string[]
  user: UserReducer
  setDiagramAction: (action: string) => void
  switchFlow: (flowName: string) => void
  flowEditorUndo: () => void
  flowEditorRedo: () => void
  errorSavingFlows: any
  clearErrorSaveFlows: () => void
  clearFlowsModification: () => void
  closeFlowNodeProps: () => void
  refreshActions: () => void
  refreshIntents: () => void
  flowsByName: _.Dictionary<FlowView>
} & RouteComponentProps

interface State {
  initialized: any
  readOnly: boolean
  pannelPermissions: PanelPermissions[]
  flowPreview: boolean
  mutexInfo: MutexInfo
  showSearch: boolean
}

class FlowBuilder extends Component<Props, State> {
  private diagram
  private userAllowed = false

  state = {
    initialized: false,
    readOnly: false,
    pannelPermissions: this.allPermissions,
    flowPreview: false,
    mutexInfo: undefined,
    showSearch: false
  }

  get allPermissions(): PanelPermissions[] {
    return ['create', 'rename', 'delete']
  }

  init() {
    if (this.state.initialized || !this.props.user || this.props.user.email == null) {
      return
    }
    this.userAllowed = isOperationAllowed({ operation: 'write', resource: 'bot.flows' })
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
    this.props.refreshActions()
    this.props.refreshIntents()
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
      toastFailure(message, Timeout.LONG, this.props.clearErrorSaveFlows)
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

  hideSearch = () => this.setState({ showSearch: false })

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
      find: e => {
        e.preventDefault()
        this.setState({ showSearch: !this.state.showSearch })
      },
      'preview-flow': e => {
        e.preventDefault()
        this.setState({ flowPreview: true })
      },
      save: e => {
        e.preventDefault()
        toastInfo('Pssst! Flows now save automatically, no need to save anymore.', Timeout.LONG)
      },
      delete: e => {
        if (!isInputFocused()) {
          e.preventDefault()
          this.diagram.deleteSelectedElements()
        }
      },
      cancel: e => {
        e.preventDefault()
        this.props.closeFlowNodeProps()
        this.hideSearch()
      }
    }

    return (
      <Container keyHandlers={keyHandlers} sidePanelWidth={320}>
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
            showSearch={this.state.showSearch}
            hideSearch={this.hideSearch}
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
      </Container>
    )
  }
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
  clearErrorSaveFlows,
  closeFlowNodeProps,
  refreshActions,
  refreshIntents
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(FlowBuilder))
